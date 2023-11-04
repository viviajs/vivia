import fs from 'fs'
import { basenameWithoutExt, importModule, parse, posix } from './utils.js'
import path from 'path'
import Plugin from './plugin.js'
import chalk from 'chalk'

export function loadSource (dirname: string) {
  const source = new Map()
  fs.readdirSync(dirname, { recursive: true }).forEach(filename => {
    source.set(
      posix(filename as string),
      fs.readFileSync(path.join(dirname, filename as string), 'utf8')
    )
  })
  return source
}

export function loadData (dirname: string) {
  const data: any = {}
  fs.readdirSync(dirname).forEach(filename => {
    const stat = fs.statSync(path.join(dirname, filename))
    if (stat.isFile()) {
      const name = basenameWithoutExt(filename)
      data[name] = parse(dirname, filename)
    }
    if (stat.isDirectory()) {
      data[filename] = loadData(path.join(dirname, filename))
    }
  })
  return data
}

export async function loadPlugins (dirname: string) {
  const plugins: Record<string, Plugin> = {}
  const tasks = parse(dirname, 'package.json')
    .dependencies.filter((dep: string) => {
      dep.startsWith('vivia-') && !dep.startsWith('vivia-theme-')
    })
    .map(async (dep: string) => {
      try {
        const name = dep.replace('vivia-', '')
        const plugin = await importModule(process.cwd(), 'node_modules', dep)
        plugins[name] = plugin
        console.info(chalk.blue(`Loaded plugin ${dep}`))
      } catch (e) {
        console.error(chalk.red(`Failed to load plugin ${dep}`))
        console.error(e)
      }
    })
  await Promise.all(tasks)
  return plugins
}
