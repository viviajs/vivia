#!/usr/bin/env node

import fs from 'fs'
import yaml from 'yaml'
import express from 'express'

import Vivia from './vivia.js'
import chalk from 'chalk'

const vivia = new Vivia(yaml.parse(fs.readFileSync('vivia.yml', 'utf8')))
await vivia.load()

console.log(vivia)

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
    console.log(`GET ${path}`)

    try {
      let context: any = {
        type: 'md',
        config: vivia.config,
        content: fs.readFileSync(`content${path}`, 'utf8')
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
