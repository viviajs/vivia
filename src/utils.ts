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

export function readDir (...paths: string[]): any {
  const dir: any = {}
  for (const file of fs.readdirSync(path.join(...paths))) {
    if (fs.statSync(path.join(...paths, file)).isDirectory()) {
      dir[file] = readDir(...paths, file)
    } else {
      dir[file] = readFile(...paths, file)
    }
  }
  return dir
}
