import Vivia from './vivia.js'

class Plugin {
  renderer: Function[] = []
  load: (options: any, vivia: Vivia) => any = () => {}
}

export default Plugin
