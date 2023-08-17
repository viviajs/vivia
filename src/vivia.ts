import chalk from 'chalk'
import path from 'path'
import fs from 'fs'

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
        pipeline: {},
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
    const load = async (pluginName: string) => {
      try {
        const pluginConfig = this.config.plugins[pluginName] ?? {}
        const modulePath = pathToFileURL(
          path.join(process.cwd(), 'node_modules', pluginName, 'index.js')
        ).href
        const module = await import(modulePath)
        let plugins = module.default(pluginConfig)
        if (plugins instanceof Function)
          plugins = { [pluginName.replace('vivia-', '')]: plugins }
        this.plugins = { ...this.plugins, ...plugins }

        console.info(chalk.green(`Loaded ${pluginName}`))
      } catch (e) {
        console.error(chalk.red(`Failed to load ${pluginName}:`))
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
    const read = (...paths: string[]) => {
      try {
        for (const filename of fs.readdirSync(path.join(...paths))) {
          const stat = fs.statSync(path.join(...paths, filename))
          if (stat.isFile()) {
            const key = path.posix
              .join(...paths, filename)
              .replace('content/', '')
            this.content[key] = readFile(...paths, filename)
          }
          if (stat.isDirectory()) read(...paths, filename)
        }
      } catch {}
    }
    read('content')
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

    const context = {
      path: pathname,
      get link () {
        return '/' + this.path.replace('index.html', '')
      },
      content: this.content[pathname],
      template: findtemp()
    }

    let pipeline: string[] = this.config.pipeline[path.extname(context.path)]
    if (pipeline == undefined) pipeline = []
    if (!(pipeline instanceof Array)) pipeline = [pipeline]

    for (const name of pipeline) {
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
    writeFile(path.resolve(this.config.outdir, context.path), context.content)
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
