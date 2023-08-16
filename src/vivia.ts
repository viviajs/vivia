import chalk from 'chalk'
import path from 'path'

import { readDir, readFile, readJSON, readYAML, writeFile } from './utils.js'
import { pathToFileURL } from 'url'

class Vivia {
  plugins: Record<string, Function> = {}
  config: any = {
    port: 3722,
    plugins: {},
    pipeline: {},
    outdir: 'public'
  }
  data: Record<string, any> = {}
  content: Record<string, any> = {}
  template: Record<string, any> = {}

  async loadConfig () {
    try {
      this.config = { ...this.config, ...readYAML('vivia.yml') }
    } catch {
      console.error(chalk.red(`Not a vivia project folder`))
      process.exit(1)
    }
  }

  async loadPlugins () {
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

        console.log(chalk.green(`Loaded ${pluginName}`))
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

  async load () {
    await this.loadConfig()
    await this.loadPlugins()

    this.data = readDir('data')
    this.content = readDir('content')
    this.template = readDir('template')
  }

  async render (pathname: string) {
    const context = {
      path: pathname,
      get link () {
        return '/' + this.path.replace('index.html', '')
      },
      content: this.content[pathname],
      template: '{{@ content }}'
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
    await Promise.all(Object.keys(this.content).map(this.build.bind(this)))
  }

  async rebuild (pathname: string) {
    this.content[pathname] = readFile('content', pathname)
    await this.build(pathname)
  }

  async rebuildAll () {
    this.content = readDir('content')
    await this.buildAll()
  }
}

export default Vivia
