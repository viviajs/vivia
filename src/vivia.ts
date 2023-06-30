import chalk from 'chalk'
import fs from 'fs'

import loadBuildinPlugins from './plugins.js'

class Vivia {
  plugin: Record<string, Record<string, Function>> = {}
  config: any

  constructor (config: object) {
    this.config = config
  }

  async load () {
    this.plugin = loadBuildinPlugins(this.config)

    await Promise.all(
      Object.keys(
        JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies
      )
        .filter((dep: string) => dep.startsWith('vivia-'))
        .map(async (dep: string) => {
          const type = dep.split('-')[1]
          const name = dep.split('-').slice(2).join('-')
          try {
            if (!Object.keys(this.plugin).includes(type)) {
              throw new Error(`Plugin type '${type}' is not supported`)
            }

            const func = (await import('../../' + dep + '/index.js')).default

            if (typeof func !== 'function') {
              throw new Error('Plugin is expected to export a function')
            }

            this.plugin[type][name] = func
            console.log(chalk.green(`Loaded ${dep}`))
          } catch (e) {
            console.error(chalk.red(`Failed to load ${dep}:`))
            console.error(e)
          }
        })
    )
  }

  async render (context: any) {
    let pipeline = this.config.render[context.type]
    if (!(pipeline instanceof Array)) pipeline = [pipeline]

    pipeline.forEach((name: string) => {
      try {
        console.log('you see pipeline done: ' + this.plugin.renderer[name])
        this.plugin.renderer[name](context)
      } catch (e) {
        console.log(e)
      }
    })
  }
}

export default Vivia
