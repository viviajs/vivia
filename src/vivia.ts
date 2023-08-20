import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import { minimatch } from 'minimatch'

import { readFile, readJSON, readYAML, writeFile } from './utils.js'

class Vivia {
  plugins: Record<string, Function> = {}
  config: any = {}
  data: Record<string, any> = {}
  source: Record<string, any> = {}
  template: Record<string, any> = {}

  async loadConfig () {
    try {
      // default config
      this.config = {
        port: 3722,
        plugins: {},
        prerender: {},
        render: {},
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
        // import() starts from where 'dist/vivia.js' is
        // very useful because you don't have to deal with the logic
        // about returning to 'node_modules' when loading themes
        const modulePath = path.posix.join('../..', dep, 'index.js')
        const module = await import(modulePath)
        let plugins = module.default(pluginConfig)
        if (plugins instanceof Function) plugins = { [pluginName]: plugins }
        this.plugins = { ...this.plugins, ...plugins }

        console.info(chalk.green(`Loaded '${dep}'`))
      } catch (e) {
        console.error(chalk.red(`Failed to load '${dep}':`))
        console.error(e)
      }
    }

    const deps: Record<string, string> =
      readJSON('package.json').dependencies ?? {}

    const asyncs = Object.keys(deps)
      .filter(
        dep => dep.startsWith('vivia-') && !dep.startsWith('vivia-theme-')
      )
      .map(load)

    await Promise.all(asyncs)
  }

  async loadSource () {
    this.source = {}
    const read = async (...paths: string[]) => {
      // try {
      for (const filename of fs.readdirSync(path.join(...paths))) {
        const stat = fs.statSync(path.join(...paths, filename))
        if (stat.isFile()) {
          const pathname = path.posix
            .join(...paths, filename)
            .replace('source/', '')

          const context = await this.prerender(
            pathname,
            readFile(...paths, filename)
          )

          this.source[pathname] = context
        }
        if (stat.isDirectory()) await read(...paths, filename)
      }
      // } catch {}
    }
    await read('source')
  }

  async loadData () {
    this.data = {}
    try {
      for (const filename of fs.readdirSync('data')) {
        if (fs.statSync(path.join('data', filename)).isFile()) {
          const key = path.basename(filename, path.extname(filename))
          switch (path.extname(filename)) {
            case '.yml':
            case '.yaml':
              this.data[key] = readYAML('data', filename)
              break
            case '.json':
              this.data[key] = readJSON('data', filename)
              break
            case '.txt':
              this.data[key] = readFile('data', filename).toString()
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

  async loadTheme () {
    if (this.config.theme == undefined) return
    if (!(this.config.theme instanceof Array))
      this.config.theme = [this.config.theme]
    for (const name of this.config.theme ?? []) {
      try {
        const cwd = process.cwd()

        try {
          process.chdir(path.join('node_modules', `vivia-theme-${name}`))
        } catch {
          throw new Error(`Theme 'vivia-theme-${name}' not installed`)
        }

        const theme = new Vivia()
        await theme.load()
        this.config = { ...theme.config, ...this.config }
        this.plugins = { ...theme.plugins, ...this.plugins }
        this.source = { ...theme.source, ...this.source }
        this.data = { ...theme.data, ...this.data }
        this.template = { ...theme.template, ...this.template }

        process.chdir(cwd)
        console.info(chalk.green(`Loaded theme 'vivia-theme-${name}'`))
      } catch (e) {
        console.error(chalk.red(`Failed to load theme 'vivia-theme-${name}':`))
        console.error(e)
      }
    }
  }

  async load () {
    await this.loadConfig()
    await this.loadPlugins()
    await this.loadSource()
    await this.loadData()
    await this.loadTemplate()
    await this.loadTheme()
  }

  async prerender (pathname: string, content: Buffer) {
    const root = this.config.root
    const context = {
      content,
      config: this.config,
      path: pathname,
      get link () {
        return path.posix.join(root, this.path)
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
          chalk.red(`Failed to prerender '${context.path}' at 'vivia-${name}':`)
        )
        console.error(e)
      }
    }
    return context
  }

  async render (pathname: string) {
    const findtemp = () => {
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

    const context = this.source[pathname]
    context.source = this.source
    context.data = this.data
    context.template = findtemp()

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
          chalk.red(`Failed to render '${context.path}' at 'vivia-${name}':`)
        )
        console.error(e)
      }
    }
    return context
  }

  async build (pathname: string) {
    const context = await this.render(pathname)
    writeFile(path.resolve(this.config.outdir, context.path), context.content)
  }

  async buildAll () {
    fs.rmSync(this.config.outdir, { recursive: true, force: true })
    await Promise.all(Object.keys(this.source).map(this.build.bind(this)))
    console.info(chalk.cyan(`All successfully built`))
  }

  async rebuild (pathname: string) {
    const context = await this.prerender(pathname, readFile('source', pathname))
    this.source[pathname] = context
    await this.build(pathname)
  }

  async rebuildAll () {
    await this.loadSource()
    await this.loadData()
    await this.loadTemplate()
    await this.loadTheme()
    await this.buildAll()
  }
}

export default Vivia
