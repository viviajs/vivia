import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import yaml from 'yaml'

export function readFile (...paths: string[]) {
  return fs.readFileSync(path.join(...paths), 'utf8')
}

export function readJSON (...paths: string[]) {
  return JSON.parse(readFile(...paths))
}

export function readYAML (...paths: string[]) {
  return yaml.parse(readFile(...paths))
}

export function readDir (...paths: string[]) {
  const dir: any = {}
  const prefix = pathToFileURL(path.resolve(...paths)).href + '/'

  const read = (...paths: string[]) => {
    for (const file of fs.readdirSync(path.join(...paths))) {
      const stat = fs.statSync(path.join(...paths, file))
      if (stat.isFile()) {
        dir[pathToFileURL(path.resolve(...paths, file)).href.split(prefix)[1]] =
          readFile(...paths, file)
      }
      if (stat.isDirectory()) read(...paths, file)
    }
  }
  
  read(...paths)
  return dir
}

export function writeFile (filepath: string, content: string) {
  const folder = path.dirname(filepath)
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(filepath, content)
}
