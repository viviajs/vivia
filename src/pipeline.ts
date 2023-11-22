import Context from './context.js'

class Pipeline {
  router: string
  renderers: Function[]
  globals: any

  constructor (router: string, renderers: Function[], globals: any) {
    this.router = router
    this.renderers = renderers
    this.globals = globals
  }

  async render (context: Context) {
    Object.assign(context, this.globals)
    for (const renderer of this.renderers) {
      await renderer(context)
    }
    return context
  }
}

export default Pipeline
