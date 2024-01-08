import fs from 'fs'
import path from 'path'

import Config from './config.js'
import Utils from './utils.js'
import { minimatch } from 'minimatch'
import { globSync } from 'glob'

function loadConfig (dir: string) {
  const filename = fs
    .readdirSync(dir)
    .find(file => path.basename(file, path.extname(file)) === 'vivia')
  if (filename == null) {
    throw new Error(`No vivia config file found in ${dir}`)
  }
  return Object.assign(new Config(), Utils.parse(dir, filename))
}

function loadTheme (name: string) {
  return new Vivia(
    path.join(process.cwd(), 'node_modules', `vivia-theme-${name}`)
  )
}

function loadPlugins (dir: string) {
  return Object.keys(Utils.parse(dir, 'package.json').dependencies).filter(
    (dep: string) => dep.startsWith('vivia-')
  )
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
        Utils.parse(pluginPath, 'package.json').main ?? 'index.js'
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
    console.log(this.config.pipelines)
    console.log(process.cwd())
    console.log(path.resolve('./source'))

    for (const pipeline of this.config.pipelines) {
      console.log(globSync(pipeline.source, { cwd: 'source' }))
    }
  }
}

export default Vivia
