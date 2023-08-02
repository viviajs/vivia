import chalk from 'chalk'
import path from 'path'

import { readDir, readJSON, readYAML } from './utils.js'

class Vivia {
  plugins: Record<string, Function> = {}
  config: any
  data: any
  content: any
  template: any

  async load () {
    this.config = readYAML('vivia.yml')

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
    }

    try {
      this.data = readDir('data')
    } catch {
      this.data = {}
    }
    try {
      this.content = readDir('content')
    } catch {
      this.content = {}
    }
    try {
      this.template = readDir('template')
    } catch {
      this.template = {}
    }
  }

  async render (path: string) {
    let context: any = {
      path: path,
      type: 'md',
      config: this.config,
      data: this.data,
      template: (() => {
        // template matching rule:
        // 1. find template matching the path
        // 2. find default template in the same directory
        // 3. turn to parent directory and repeat 1 and 2

        let t = this.template
        let d

        // /a/b/c.md
        // this will slice the first slash and the last .md
        for (const p of filepath.slice(0, -3).slice(1).split('/')) {
          try {
            d = t[Object.keys(t).find(t => t.startsWith('default')) as string]
          } catch {}
          try {
            t = t[Object.keys(t).find(t => t.startsWith(p)) as string]
            if (t == null) throw new Error()
          } catch {
            if (d == null) console.error(`no template matched ${req.path}`)
            return d ?? ''
          }
        }
        if (t == null) console.error(`no template matched ${req.path}`)
        return t ?? ''
      })(),
      content: readFile(`content${filepath}`)
    }

    let renderers = this.config.render[context.type]
    if (!(renderers instanceof Array)) renderers = [renderers]

    renderers.forEach((name: string) => {
      try {
        if (this.plugins[name] == undefined)
          throw new Error('Plugin not installed or loaded')
        this.plugins[name](context)
      } catch (e) {
        console.error(
          chalk.red(`Failed to render ${context.path} at vivia-${name}:`)
        )
        console.error(e)
      }
    })
  }
}

export default Vivia
