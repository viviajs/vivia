import chalk from 'chalk'
import Config from './config.js'
import Plugin from './plugin.js'
import Utils from './utils.js'

class Vivia {
  workdir: string
  config: Config
  plugins: Record<string, Plugin> = {}
  pipeline: Record<string, string[]> = {}
  globals: Record<string, any> = {}
  source: Map<string, any> = new Map()

  constructor (workdir: string) {
    this.workdir = workdir
    this.config = Config.from(workdir)
  }

  async load () {
    // load source
    Utils.readdir(this.workdir, 'source').forEach(filename => {
      this.source.set(
        Utils.posix(filename),
        Utils.read(this.workdir, 'source', filename)
      )
    })
    // load plugins
    const tasks = Utils.parse(this.workdir, 'package.json')
      .dependencies.filter((dep: string) => {
        dep.startsWith('vivia-') && !dep.startsWith('vivia-theme-')
      })
      .map(async (dep: string) => {
        try {
          const name = dep.replace('vivia-', '')
          const plugin = await Utils.import(process.cwd(), 'node_modules', dep)
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
