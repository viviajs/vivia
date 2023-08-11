import path from 'path'

import { writeFile } from '../utils.js'
import Vivia from '../vivia.js'

const vivia = new Vivia()
await vivia.load()

Object.entries(vivia.content).forEach(async ([href, text]) => {
  const context = await vivia.render({
    type: 'md',
    path: href,
    content: text,
    template: '{{@ content }}'
  })
  writeFile(path.resolve('public', href), context.content)
})
