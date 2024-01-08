import fs from 'fs'
import path from 'path'

import Config from './config.js'
import { globSync } from 'glob'
import yaml from 'yaml'

function loadConfig (dir: string) {
  const config = yaml.parse(
    fs.readFileSync(path.join(dir, 'vivia.yml'), 'utf8')
  )
  return Object.assign(new Config(), config)
}

function loadTheme (name: string) {
  return new Vivia(
    path.join(process.cwd(), 'node_modules', `vivia-theme-${name}`)
  )
}

function loadPlugins (dir: string) {
  return Object.keys(
    JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
      .dependencies
  ).filter((dep: string) => dep.startsWith('vivia-'))
}

class Vivia {
  config: Config
  plugins: string[]
  globals: Record<string, any> = {}
  renderers: Record<string, Function> = {}

  constructor (public workdir: string) {
    this.config = loadConfig(workdir)
    this.plugins = loadPlugins(workdir)
    if (this.config.theme) {
      const theme = loadTheme(this.config.theme)
      theme.workdir = workdir
      Object.assign(theme.config, this.config)
      return theme
    }
  }

  async init () {
    const tasks = this.plugins.map(async plugin => {
      const pluginPath = path.join(process.cwd(), 'node_modules', plugin)
      const mainPath = path.join(
        pluginPath,
        JSON.parse(
          fs.readFileSync(path.join(pluginPath, 'package.json'), 'utf8')
        ).main ?? 'index.js'
      )
      const pluginModule = await import(mainPath)
      const pluginOptions = this.config.plugins?.[plugin]
      pluginModule.default(pluginOptions, this)
    })
    await Promise.all(tasks)
  }

  async render () {
    this.config.pipelines.sort(
      (a, b) => (a.priority ?? -1) - (b.priority ?? -1)
    )

    for (const pipeline of this.config.pipelines) {
      const source = globSync(pipeline.source, { cwd: 'source' }).map(file => {
        return {
          path: file,
          content: fs.readFileSync(path.join('source', file), 'utf8')
        }
      })
      for (const renderer of pipeline.renderers) {
        this.renderers[renderer](source)
      }
    }
  }
}

export default Vivia
