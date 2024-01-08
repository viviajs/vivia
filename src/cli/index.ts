import { globSync } from 'glob'
import Vivia from '../vivia.js'

// ;(async () => {
//   console.log(globSync('**/*.md', { cwd: 'source' }))
// })()
const vivia = new Vivia(process.cwd())
// // await vivia.init()
await vivia.render()
