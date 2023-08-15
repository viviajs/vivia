import chalk from 'chalk'
import express from 'express'

import Vivia from '../vivia.js'

const vivia = new Vivia()
await vivia.load()

const app = express()
app.get('*', async (req, res, next) => {
  let pathname = req.path
  if (pathname.endsWith('/')) pathname += 'index.md'
  const ctx = await vivia.render(pathname)
  if (ctx.content == null) next()
  else res.type(ctx.type).send(ctx.content)
})

const port = vivia.config.port
app.listen(port)
console.log(chalk.cyan(`Listening at http://localhost:${port}`))
