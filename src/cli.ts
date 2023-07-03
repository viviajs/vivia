#!/usr/bin/env node

import express from 'express'
import chalk from 'chalk'

import Vivia from './vivia.js'
import { readFile, readYAML } from './utils.js'

const vivia = new Vivia(readYAML('vivia.yml'))
await vivia.load()

switch (process.argv[2]) {
  case 'watch':
    watch()
    break
  case 'help':
  default:
    console.log('TODO: help')
    break
}

function watch () {
  const app = express()
  app.get('*', async (req, res) => {
    const path = req.path.endsWith('/') ? req.path + 'index.md' : req.path

    try {
      let context: any = {
        path,
        type: 'md',
        config: vivia.config,
        content: readFile(`content${path}`)
      }
      await vivia.render(context)

      res.type(context.type).send(context.content)
    } catch (e) {
      res.status(404).send(e)
    }
  })

  const port = vivia.config.port ?? 3210
  app.listen(port)
  console.log(chalk.cyan(`Listening at http://localhost:${port}`))
}
