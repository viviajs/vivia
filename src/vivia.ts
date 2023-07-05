import chalk from 'chalk'
import path from 'path'

import { readDir, readJSON } from './utils.js'

class Vivia {
  plugin: Record<string, Record<string, Function>> = { renderer: {} }
  config: any
  data: any
  content: any
  template: any

  constructor (config: object) {
    this.config = config
  }

  async load () {
    const deps = readJSON('package.json').dependencies
    if (deps == undefined) return

    await Promise.all(
      Object.keys(deps)
        .filter((dep: string) => dep.startsWith('vivia-'))
        .map(async (dep: string) => {
          const type = dep.split('-')[1]
          const name = dep.split('-').slice(2).join('-')

          try {
            let pluginConfig
            try {
              pluginConfig = this.config.plugins[type][name] ?? {}
            } catch {
              pluginConfig = {}
            }
            this.plugin[type][name] = (
              await import(
                'file://' +
                  path.join(process.cwd(), 'node_modules', dep, 'index.js')
              )
            ).default(pluginConfig)

            console.log(chalk.green(`Loaded ${dep}`))
          } catch (e) {
            console.error(chalk.red(`Failed to load ${dep}:`))
            console.error(e)
          }
        })
    )

    this.data = readDir('data')
    this.content = readDir('content')
    this.template = readDir('template')
  }

  async render (ctx: any) {
    let renderers = this.config.render[ctx.type]
    if (!(renderers instanceof Array)) renderers = [renderers]

    renderers.forEach((name: string) => {
      try {
        if (this.plugin.renderer[name] == undefined)
          throw new Error('Plugin not installed or loaded')
        this.plugin.renderer[name](ctx)
      } catch (e) {
        console.error(
          chalk.red(`Failed to render ${ctx.path} at vivia-renderer-${name}:`)
        )
        console.error(e)
      }
    })
  }
}

export default Vivia
