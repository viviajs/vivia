#!/usr/bin/env node

import express from 'express'
import chalk from 'chalk'
import path from 'path'

import Vivia from './vivia.js'
import { readDir, readFile, readYAML } from './utils.js'

const vivia = new Vivia(readYAML('vivia.yml'))

const help = `vivia <command>
Usage:
  vivia build\t\tBuild the website
  vivia watch\t\tStart a development server
  vivia config\t\tPrint the config
  vivia help\t\tPrint this help message`

switch (process.argv[2]) {
  case 'build':
    await vivia.load()
    break

  case 'watch':
    await vivia.load()

    const data = readDir('data')
    const template = readDir('template')

    const app = express()
    app.get('*', async (req, res, next) => {
      if (!['.md', ''].includes(path.extname(req.path))) {
        next()
        return
      }
      const filepath = req.path.endsWith('/')
        ? req.path + 'index.md'
        : req.path + '.md'
      let context: any = {
        path: req.path,
        type: 'md',
        config: vivia.config,
        data,
        template: (() => {
          // template matching rule:
          // 1. find template matching the path
          // 2. find default template in the same directory
          // 3. turn to parent directory and repeat 1 and 2

          let t = template
          let d

          // /a/b/c.md
          // this will slice the first slash and the last .md
          for (const p of filepath.slice(0, -3).slice(1).split('/')) {
            try {
              d = t[Object.keys(t).find(t => t.startsWith('default')) as string]
            } catch {}
            try {
              t = t[Object.keys(t).find(t => t.startsWith(p)) as string]
              if (t == null) throw new Error()
            } catch {
              if (d == null) console.error(`no template matched ${req.path}`)
              return d ?? ''
            }
          }
          if (t == null) console.error(`no template matched ${req.path}`)
          return t ?? ''
        })(),
        content: readFile(`content${filepath}`)
      }
      await vivia.render(context)

      res.type(context.type).send(context.content)
    })
    app.use(express.static('static'))

    const port = vivia.config.port ?? 3210
    app.listen(port)
    console.log(chalk.cyan(`Listening at http://localhost:${port}`))
    break

  case 'config':
    console.log(vivia)
    break

  case 'help':
  default:
    console.log(help)
    break
}
