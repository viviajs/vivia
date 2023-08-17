import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import { minimatch } from 'minimatch'

import { readFile, readJSON, readYAML, writeFile } from './utils.js'
import { pathToFileURL } from 'url'

class Vivia {
  plugins: Record<string, Function> = {}
  config: any = {}
  data: Record<string, any> = {}
  content: Record<string, any> = {}
  template: Record<string, any> = {}

  async loadConfig () {
    try {
      this.config = {
        port: 3722,
        plugins: {},
        prerender: {},
        prender: {},
        root: '/',
        outdir: 'public',
        ...readYAML('vivia.yml')
      }
    } catch {
      console.error(chalk.red(`Not a vivia project folder`))
      process.exit()
    }
  }

  async loadPlugins () {
    this.plugins = {}
    const load = async (dep: string) => {
      try {
        const pluginName = dep.replace('vivia-', '')
        const pluginConfig = this.config.plugins[pluginName] ?? {}
        const modulePath = pathToFileURL(
          path.join(process.cwd(), 'node_modules', dep, 'index.js')
        ).href
        const module = await import(modulePath)
        let plugins = module.default(pluginConfig)
        if (plugins instanceof Function) plugins = { [pluginName]: plugins }
        this.plugins = { ...this.plugins, ...plugins }

        console.info(chalk.green(`Loaded ${dep}`))
      } catch (e) {
        console.error(chalk.red(`Failed to load ${dep}:`))
        console.error(e)
      }
    }

    const deps: Record<string, string> =
      readJSON('package.json').dependencies ?? {}

    const asyncs = Object.keys(deps)
      .filter(dep => dep.startsWith('vivia-'))
      .map(load)

    await Promise.all(asyncs)
  }

  async loadContent () {
    this.content = {}
    const read = async (...paths: string[]) => {
      // try {
      for (const filename of fs.readdirSync(path.join(...paths))) {
        const stat = fs.statSync(path.join(...paths, filename))
        if (stat.isFile()) {
          const pathname = path.posix
            .join(...paths, filename)
            .replace('content/', '')

          const context = await this.prerender(
            pathname,
            readFile(...paths, filename)
          )

          this.content[context.path] = context.body
        }
        if (stat.isDirectory()) await read(...paths, filename)
      }
      // } catch {}
    }
    await read('content')
  }

  async loadData () {
    this.data = {}
    try {
      for (const filename of fs.readdirSync('data')) {
        if (fs.statSync(path.join('data', filename)).isFile()) {
          const key = path.basename(filename, path.extname(filename))
          switch (path.extname(filename)) {
            case 'yml':
            case 'yaml':
              this.data[key] = readYAML('data', filename)
              break
            case 'json':
              this.data[key] = readJSON('data', filename)
              break
            default:
              this.data[key] = readFile('data', filename)
              break
          }
        }
      }
    } catch {}
  }

  async loadTemplate () {
    this.template = {}
    const read = (...paths: string[]) => {
      try {
        for (const filename of fs.readdirSync(path.join(...paths))) {
          const stat = fs.statSync(path.join(...paths, filename))
          if (stat.isFile()) {
            const key = path.posix
              .join(...paths, path.basename(filename, path.extname(filename)))
              .replace('template/', '')
            this.template[key] = readFile(...paths, filename).toString()
          }
          if (stat.isDirectory()) read(...paths, filename)
        }
      } catch {}
    }
    read('template')
  }

  async load () {
    await this.loadConfig()
    await this.loadPlugins()
    await this.loadContent()
    await this.loadData()
    await this.loadTemplate()
  }

  findTemplate (pathname: string) {
    // first, try to find the template that matches perfectly
    const basepath = path.posix.join(
      path.dirname(pathname),
      path.basename(pathname, path.extname(pathname))
    )

    if (this.template.hasOwnProperty(basepath)) return this.template[basepath]

    // if not, try to find the template that matches the directory most
    let current = path.dirname(pathname)
    while (current != '.') {
      const temppath = path.posix.join(current, 'default')
      if (this.template.hasOwnProperty(temppath)) {
        return this.template[temppath]
      }
      // not matched, go to the parent directory
      current = path.dirname(current)
    }
    return this.template['default'] ?? ''
  }

  async prerender (pathname: string, content: any) {
    const context = {
      config: this.config,
      body: content,
      data: this.data,
      template: this.findTemplate(pathname),
      path: pathname,
      get link () {
        return path.join(this.config.root, this.path)
      }
    }

    let key = Object.keys(this.config.prerender).find(glob =>
      minimatch(pathname, glob)
    )
    if (key == undefined) return context
    let renderers = this.config.prerender[key]
    if (renderers == undefined) return context
    if (!(renderers instanceof Array)) renderers = [renderers]

    for (const name of renderers) {
      try {
        if (this.plugins[name] == undefined)
          throw new Error(`Plugin 'vivia-${name}' not installed or loaded`)
        await this.plugins[name](context)
      } catch (e) {
        console.error(
          chalk.red(`Failed to prerender ${context.path} at 'vivia-${name}':`)
        )
        console.error(e)
      }
    }
    return context
  }

  async render (pathname: string) {
    const context = {
      config: this.config,
      body: this.content[pathname],
      content: this.content,
      data: this.data,
      template: this.findTemplate(pathname),
      path: pathname,
      get link () {
        return path.join(this.config.root, this.path)
      }
    }

    let key = Object.keys(this.config.render).find(glob =>
      minimatch(pathname, glob)
    )
    if (key == undefined) return context
    let renderers = this.config.render[key]
    if (renderers == undefined) return context
    if (!(renderers instanceof Array)) renderers = [renderers]

    for (const name of renderers) {
      try {
        if (this.plugins[name] == undefined)
          throw new Error(`Plugin 'vivia-${name}' not installed or loaded`)
        await this.plugins[name](context)
      } catch (e) {
        console.error(
          chalk.red(`Failed to render ${context.path} at 'vivia-${name}':`)
        )
        console.error(e)
      }
    }
    return context
  }

  async build (pathname: string) {
    const context = await this.render(pathname)
    writeFile(path.resolve(this.config.outdir, context.path), context.body)
  }

  async buildAll () {
    fs.rmSync(this.config.outdir, { recursive: true, force: true })
    await Promise.all(Object.keys(this.content).map(this.build.bind(this)))
  }

  async rebuild (pathname: string) {
    this.content[pathname] = readFile('content', pathname)
    await this.build(pathname)
  }

  async rebuildAll () {
    await this.loadContent()
    await this.loadData()
    await this.loadTemplate()
    await this.buildAll()
  }
}

export default Vivia
