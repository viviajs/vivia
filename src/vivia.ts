import Config from './config.js'

class Vivia {
  config: Config
  plugins: Record<string, Function> = {}
  data: Record<string, any> = {}
  source: Record<string, any> = {}
  i18n: Record<string, any> = {}

  constructor (dir: string) {
    this.config = new Config(dir)
  }

  static parse () {}
}

export default Vivia
