import Config from './config.js'
import Context from './context.js'
import Loader from './loader.js'

class Vivia {
  workdir: string
  config: Config
  source: Context[]
  data: Record<string, any>
  global: Record<string, any> = {}
  renderer: Record<string, Function[]> = {}

  constructor (workdir: string) {
    this.workdir = workdir
    this.config = Loader.config(workdir)
    this.source = Loader.source(workdir)
    this.data = Loader.data(workdir)
    if (this.config.theme != null) {
      const theme = Loader.theme(this.config.theme)
      this.config = Object.assign(theme.config, this.config)
      this.source = theme.source.concat(this.source)
      this.data = Object.assign(theme.data, this.data)
    }
  }

  async render (source: string) {}
}

export default Vivia
