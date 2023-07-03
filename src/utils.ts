import fs from 'fs'
import path from 'path'
import yaml from 'yaml'

export function readFile (...paths: string[]): string {
  return fs.readFileSync(path.join(...paths), 'utf8')
}

export function readJSON (...paths: string[]): any {
  return JSON.parse(readFile(...paths))
}

export function readYAML (...paths: string[]): any {
  return yaml.parse(readFile(...paths))
}
