import fs from 'fs'
import path from 'path'
import yaml from 'yaml'

export function readFile (...paths: string[]) {
  return fs.readFileSync(path.join(...paths))
}

export function readJSON (...paths: string[]) {
  return JSON.parse(readFile(...paths).toString())
}

export function readYAML (...paths: string[]) {
  return yaml.parse(readFile(...paths).toString())
}

export function writeFile (filename: string, data: any) {
  const folder = path.dirname(filename)
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(filename, data)
}
