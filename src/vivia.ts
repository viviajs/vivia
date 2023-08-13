import chalk from 'chalk'
import path from 'path'

import { readDir, readJSON, readYAML } from './utils.js'
import { pathToFileURL } from 'url'

class Vivia {
  plugins: Record<string, Function> = {}
  config: any
  data: Record<string, Buffer> = {}
  content: Record<string, Buffer> = {}
  template: Record<string, Buffer> = {}

  async load () {
    try {
      this.config = {
        port: 3722,
        plugins: {},
        ...readYAML('vivia.yml')
      }
    } catch {
      console.error(
        chalk.red(
          `'vivia.yml' not found. Run the command in a Vivia project folder or create a new one with 'vivia init'`
        )
      )
      process.exit(1)
    }

    const deps = readJSON('package.json').dependencies
    if (deps != undefined) {
      await Promise.all(
        Object.keys(deps)
          .filter((dep: string) => dep.startsWith('vivia-'))
          .map(async (dep: string) => {
            const name = dep.split('-').slice(1).join('-')

            try {
              let pluginConfig
              try {
                pluginConfig = this.config.plugins[name] ?? {}
              } catch {
                pluginConfig = {}
              }

              this.plugins[name] = (
                await import(
                  pathToFileURL(
                    path.join(process.cwd(), 'node_modules', dep, 'index.js')
                  ).href
                )
              ).default(pluginConfig)

              console.log(chalk.green(`Loaded ${dep}`))
            } catch (e) {
              console.error(chalk.red(`Failed to load ${dep}:`))
              console.error(e)
            }
          })
      )
    }

    try {
      this.data = readDir('data')
    } catch {}
    try {
      this.content = readDir('content')
    } catch {}
    try {
      this.template = readDir('template')
    } catch {}
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
