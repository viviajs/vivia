import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import { minimatch } from 'minimatch'

import { readFile, readJSON, readYAML, writeFile } from './utils.js'

async function build (pathname: string) {
  const context = await this.render(pathname)
  writeFile(path.resolve(this.config.outdir, context.path), context.content)
}

async function buildAll () {
  fs.rmSync(this.config.outdir, { recursive: true, force: true })
  if (fs.existsSync('static')) {
    fs.cpSync('static', this.config.outdir, { recursive: true, force: true })
  }
  await Promise.all(Object.keys(this.source).map(this.build.bind(this)))
  console.info(chalk.cyan(`All successfully built`))
}

async function rebuild (pathname: string) {
  const context = await this.prerender(pathname, readFile('source', pathname))
  this.source[pathname] = context
  await this.build(pathname)
}

async function rebuildAll () {
  await this.loadData()
  await this.loadTemplate()
  await this.loadSource()
  await this.loadTheme()
  await this.buildAll()
}
