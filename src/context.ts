class Context {
  [key: string]: any
  path: string
  content: string

  constructor (path: string, content: string) {
    this.path = path
    this.content = content
  }
}
export default Context
