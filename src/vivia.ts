import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import yaml from 'yaml'

class Vivia {
  fetchers: Record<string, any> = {}
  renderers: Record<string, any> = {}
  presenters: Record<string, any> = {}
  argv: string[]
  config: object
  context: any
  constructor (argv: string[]) {
    this.argv = argv

    // load config
    this.config = fs.existsSync('vivia.yml')
      ? yaml.parse(fs.readFileSync('vivia.yml', 'utf8'))
      : fs.existsSync('vivia.yaml')
      ? yaml.parse(fs.readFileSync('vivia.yaml', 'utf8'))
      : fs.existsSync('vivia.json')
      ? JSON.parse(fs.readFileSync('vivia.json', 'utf8'))
      : {}
  }
  async load () {
    const deps = Object.keys(
      JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies
    ).filter((dep: string) => dep.startsWith('vivia-'))
    for (const dep of deps) {
      try {
        await import('../../' + dep + '/index.js')
        console.log(chalk.green(`Loaded ${dep}`))
      } catch (e) {
        console.error(chalk.red(`Failed to load ${dep}`))
      }
    }
  }
}

export default Vivia
