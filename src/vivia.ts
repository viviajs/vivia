import Config from './config.js'

class Vivia {
  private config: Config
  private plugins: Record<string, Function> = {}
  private data: Record<string, any> = {}
  private source: Record<string, any> = {}
  private i18n: Record<string, any> = {}

  constructor (dirname: string) {
    this.config = Config.from(dirname)
  }

  register (name: string, func: (config: any) => Function) {
    this.plugins[name] = func(this.config.plugins[name] ?? {})
  }
}

export default Vivia
