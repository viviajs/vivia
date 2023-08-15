import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
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

export function readDir (...paths: string[]) {
  const dir: Record<string, Buffer> = {}
  const prefix = pathToFileURL(path.resolve(...paths)).pathname

  const read = (...paths: string[]) => {
    for (const file of fs.readdirSync(path.join(...paths))) {
      const stat = fs.statSync(path.join(...paths, file))
      if (stat.isFile()) {
        dir[
          pathToFileURL(path.resolve(...paths, file)).pathname.replace(
            prefix,
            ''
          )
        ] = readFile(...paths, file)
      }
      if (stat.isDirectory()) read(...paths, file)
    }
  }

  try {
    read(...paths)
  } catch {}
  return dir
}

export function writeFile (file: string, data: any) {
  const folder = path.dirname(file)
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(file, data)
}
