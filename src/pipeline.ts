import fs from 'fs'
import Context from './context.js'
import path from 'path'

class Pipeline {
  pattern: string
  chain: Function[]

  constructor (pattern: string, chain: Function[]) {
    this.pattern = pattern
    this.chain = chain
  }

  async run (context: Context) {
    for (const step of this.chain) {
      await step(context)
    }
    const folder = path.dirname(context.path)
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
    fs.writeFileSync(context.path, context.content)
  }
}

export default Pipeline
