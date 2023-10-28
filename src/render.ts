import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import { minimatch } from 'minimatch'

import { readFile, readJSON, readYAML, writeFile } from './utils.js'


async function prerender (pathname: string, content: Buffer) {
  const root = this.config.root
  const context = {
    content,
    config: this.config,
    path: pathname,
    get link () {
      return path.posix.join(root, this.path)
    }
  }

  let key = Object.keys(this.config.prerender).find(glob =>
    minimatch(pathname, glob)
  )
  if (key == undefined) return context
  let renderers = this.config.prerender[key]
  if (renderers == undefined) return context
  if (!(renderers instanceof Array)) renderers = [renderers]

  for (const name of renderers) {
    try {
      if (this.plugins[name] == undefined)
        throw new Error(`Plugin 'vivia-${name}' not installed or loaded`)
      await this.plugins[name](context)
    } catch (e) {
      console.error(
        chalk.red(`Failed to prerender '${pathname}' at 'vivia-${name}':`)
      )
      console.error(e)
    }
  }
  return context
}

function findTemplate (pathname: string) {
  // first, try to find the template that matches perfectly
  const basepath = path.posix.join(
    path.dirname(pathname),
    path.basename(pathname, path.extname(pathname))
  )

  if (this.template.hasOwnProperty(basepath)) return this.template[basepath]

  // if not, try to find the template that matches the directory most
  let current = path.dirname(pathname)
  while (current != '.') {
    const temppath = path.posix.join(current, 'default')
    if (this.template.hasOwnProperty(temppath)) {
      return this.template[temppath]
    }
    // not matched, go to the parent directory
    current = path.dirname(current)
  }
  return this.template['default']
}

async function render (pathname: string) {
  const context = this.source[pathname]
  context.source = this.source
  context.data = this.data
  context.template = this.findTemplate(pathname)

  let key = Object.keys(this.config.render).find(glob =>
    minimatch(pathname, glob)
  )
  if (key == undefined) return context
  let renderers = this.config.render[key]
  if (renderers == undefined) return context
  if (!(renderers instanceof Array)) renderers = [renderers]

  for (const name of renderers) {
    try {
      if (this.plugins[name] == undefined)
        throw new Error(`Plugin 'vivia-${name}' not installed or loaded`)
      await this.plugins[name](context)
    } catch (e) {
      console.error(
        chalk.red(`Failed to render '${pathname}' at 'vivia-${name}':`)
      )
      console.error(e)
    }
  }
  return context
}
