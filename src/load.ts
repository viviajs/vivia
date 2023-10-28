import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import { minimatch } from 'minimatch'

import Vivia from './vivia.js'

import { readFile, readJSON, readYAML, writeFile } from './utils.js'


function loadConfig (vivia: Vivia) {
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

async function loadPlugins (vivia: Vivia) {
  this.plugins = {}
  const load = async (dep: string) => {
    try {
      const pluginName = dep.replace('vivia-', '')
      const pluginConfig = this.config.plugins[pluginName] ?? {}
      pluginConfig.debug = this.debug
      // import() starts from where 'dist/vivia.js' is
      // very useful because you don't have to deal with the logic
      // about returning to 'node_modules' when loading themes

      // FIXME: error if installed as a global package
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

  const tasks = Object.keys(deps)
    .filter(dep => dep.startsWith('vivia-') && !dep.startsWith('vivia-theme-'))
    .map(load)

  await Promise.all(tasks)
}

async function loadSource (vivia: Vivia) {
  this.source = {}
  const read = async (...paths: string[]) => {
    try {
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
    } catch {}
  }
  await read('source')
}

async function loadData (vivia: Vivia) {
  const read = (...paths: string[]) => {
    let data: any = {}
    try {
      for (const filename of fs.readdirSync(path.join(...paths))) {
        const stat = fs.statSync(path.join(...paths, filename))
        if (stat.isFile()) {
          const key = path.basename(filename, path.extname(filename))
          switch (path.extname(filename)) {
            case '.yml':
            case '.yaml':
              data[key] = readYAML(...paths, filename)
              break
            case '.json':
              data[key] = readJSON(...paths, filename)
              break
            case '.txt':
              data[key] = readFile(...paths, filename).toString()
            default:
              data[key] = readFile(...paths, filename)
              break
          }
        }
        if (stat.isDirectory()) {
          data[filename] = read(...paths, filename)
        }
      }
    } catch {}
    return data
  }
  this.data = read('data')
}

async function loadTemplate () {
  this.template = {}
  const read = (...paths: string[]) => {
    try {
      for (const filename of fs.readdirSync(path.join(...paths))) {
        const stat = fs.statSync(path.join(...paths, filename))
        if (stat.isFile()) {
          const key = path.posix
            .join(...paths, path.basename(filename, path.extname(filename)))
            .replace('template/', '')
          this.template[key] = path.resolve(...paths, filename)
        }
        if (stat.isDirectory()) read(...paths, filename)
      }
    } catch {}
  }
  read('template')
}

async function loadTheme (vivia: Vivia) {
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

async function load (vivia: Vivia) {
  await this.loadConfig()
  await this.loadPlugins()
  await this.loadData()
  await this.loadTemplate()
  await this.loadSource()
  await this.loadTheme()
}
