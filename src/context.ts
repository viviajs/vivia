class Context {
  [key: string]: any
  path: string
  permalink: string
  content: string

  constructor (path: string, content: string) {
    this.path = path
    this.permalink = path
    this.content = content
  }
}

export default Context
