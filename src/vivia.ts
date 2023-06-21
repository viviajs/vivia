import loadConfig from './config.js'

class Vivia {
  renderers: Record<string, any> = {}
  config = loadConfig('vivia.yml')
}

export default Vivia
