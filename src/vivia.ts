import chalk from 'chalk'
import Config from './config.js'
import Plugin from './plugin.js'
import Utils from './utils.js'

class Vivia {
  workdir: string
  config: Config
  plugins: Record<string, Plugin> = {}
  globals: Record<string, any> = {}
  source: Map<string, any> = new Map()

  constructor (workdir: string) {
    this.workdir = workdir
    this.config = Config.from(workdir)
  }

  async load () {
    const tasks = Utils.parse(this.workdir, 'package.json')
      .dependencies.filter((dep: string) => {
        dep.startsWith('vivia-') && !dep.startsWith('vivia-theme-')
      })
      .map(async (dep: string) => {
        try {
          const name = dep.replace('vivia-', '')
          const plugin = await Utils.import(this.workdir, 'node_modules', dep)
          this.plugins[name] = plugin
          console.info(chalk.blue(`Loaded plugin ${dep}`))
        } catch (e) {
          console.error(chalk.red(`Failed to load plugin ${dep}`))
          console.error(e)
        }
      })
    await Promise.all(tasks)
  }

  async render () {}

  async run (argv: any) {}
}

export default Vivia
