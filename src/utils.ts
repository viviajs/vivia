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

export function readDir (...paths: string[]) {
  const dir: Record<string, Buffer> = {}
  const prefix = path.posix.join(...paths) + '/'

  const read = (...paths: string[]) => {
    for (const filename of fs.readdirSync(path.join(...paths))) {
      const stat = fs.statSync(path.join(...paths, filename))
      if (stat.isFile()) {
        const pathname = path.posix.join(...paths, filename).replace(prefix, '')
        dir[pathname] = readFile(...paths, filename)
      }
      if (stat.isDirectory()) read(...paths, filename)
    }
  }

  try {
    read(...paths)
  } catch {}
  return dir
}

export function writeFile (filename: string, data: any) {
  const folder = path.dirname(filename)
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(filename, data)
}
