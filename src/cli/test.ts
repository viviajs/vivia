import Vivia from '../vivia.js'

const vivia = new Vivia()
await vivia.load()
console.dir(vivia, { maxStringLength: 50,maxArrayLength: 10 })
