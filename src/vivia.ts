import { minimatch } from 'minimatch'
import Config from './config.js'
import Context from './context.js'
import Loader from './loader.js'
import Utils from './utils.js'

class Vivia {
  constructor (
    public workdir: string,
    public config: Config,
    public globals: Record<string, any>,
    public renderers: Record<string, Function>
  ) {}

  static async load (workdir?: string) {
    workdir = workdir ?? process.cwd()
    const config = Utils.loadConfig(workdir)
const vivia = new Vivia()
    if (config.theme) {

    }
    const vivia = new Vivia()
    this.loader = new Loader(this)
    const workdir = workdir ?? process.cwd()
    this.config = this.loader.config()

    if (this.config.theme != null) {
      const theme = this.loader.theme(this.config.theme)
      this.config = Object.assign(theme.config, this.config)
      this.globals.source = Object.assign(
        theme.globals.source,
        this.globals.source
      )
    }
    await Loader.plugins(this)
  }

  async render (context: Context) {
    const chain =
      Object.entries(this.config.pipeline)
        .find(([pattern]) => minimatch(context.path, pattern))?.[1]
        .map((pipeline: string) => this.renderer[pipeline]) ?? []
    for (const step of chain) {
      await step(context)
    }
  }
}

export default Vivia
