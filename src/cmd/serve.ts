import chalk from 'chalk'
import express from 'express'
import fs from 'fs'
import { pathToFileURL } from 'url'
import path from 'path'

import Vivia from '../vivia.js'

const vivia = new Vivia()
await vivia.load()
await vivia.buildAll()

const app = express()
console.log(vivia.config.outdir)

app.use(express.static(vivia.config.outdir))

fs.watch('content', { recursive: true }, (event, pathname) => {
  if (pathname == undefined) return
  pathname = path.join('content', pathname)
  if (!fs.statSync(pathname).isFile()) return
  const prefix = pathToFileURL('content').pathname + '/'
  pathname = pathToFileURL(pathname).pathname.replace(prefix, '')

  vivia.rebuild(pathname)
})

app.listen(vivia.config.port)
console.log(chalk.cyan(`Listening at http://localhost:${vivia.config.port}`))
