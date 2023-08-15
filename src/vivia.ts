import chalk from 'chalk'
import path from 'path'

import { readDir, readJSON, readYAML } from './utils.js'
import { pathToFileURL } from 'url'

class Vivia {
  plugins: Record<string, Function> = {}
  config: any
  data: Record<string, any> = {}
  content: Record<string, any> = {}
  template: Record<string, any> = {}

  defaultConfig = {
    port: 3722,
    plugins: {}
  }

  async loadConfig () {
    try {
      this.config = { ...this.defaultConfig, ...readYAML('vivia.yml') }
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

    const functions = Object.keys(deps)
      .filter(dep => dep.startsWith('vivia-'))
      .map(load)

    await Promise.all(functions)
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
      type: path.extname(pathname).slice(1),
      path: pathname.replace('index.md', ''),
      content: this.content[pathname],
      template: '{{@ content }}'
    }

    let pipeline: string[] = this.config.pipeline[context.type]
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
}

export default Vivia
