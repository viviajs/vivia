import path from 'path'

import { writeFile } from '../utils.js'
import Vivia from '../vivia.js'

const vivia = new Vivia()
await vivia.load()

Object.keys(vivia.content).forEach(async pathname => {
  const context = await vivia.render(pathname)
  writeFile(path.resolve('public', pathname.slice(1)), context.content)
})
