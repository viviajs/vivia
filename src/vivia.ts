import Config from './config.js'
import { loadData, loadPlugins, loadSource } from './loader.js'
import Plugin from './plugin.js'

class Vivia {
  workdir: string
  config: Config
  source?: Map<string, any>
  data?: Record<string, any>
  plugins?: Record<string, Plugin>
  global?: Record<string, any>

  constructor (workdir: string) {
    this.workdir = workdir
    this.config = Config.from(workdir)
  }

  async load () {
    this.source = loadSource(this.workdir)
    this.data = loadData(this.workdir)
    this.plugins = await loadPlugins(this.workdir)
    Object.entries(this.plugins).map(([name, plugin]) =>
      plugin.load(this.config.plugins[name], this)
    )
  }
}

export default Vivia
