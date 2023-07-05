import fs from 'fs'
import path from 'path'
import yaml from 'yaml'

export function readFile (...paths: string[]): string {
  try {
    return fs.readFileSync(path.join(...paths), 'utf8')
  } catch {
    return ''
  }
}

export function readJSON (...paths: string[]): any {
  return JSON.parse(readFile(...paths))
}

export function readYAML (...paths: string[]): any {
  return yaml.parse(readFile(...paths))
}

export function readDir (...paths: string[]): any {
  const dir: any = {}
  try {
    fs.readdirSync(path.join(...paths)).forEach(f => {
      const p = path.join(...paths, f)
      if (fs.statSync(p).isFile()) {
        dir[f.slice(0, f.lastIndexOf('.'))] = readFile(p)
      }
      if (fs.statSync(p).isDirectory()) {
        dir[f] = readDir(p)
      }
    })
  } catch {}
  return dir
}

export function findTemplate (path: string, template: any) {
  // template matching rule:
  // 1. find template matching the path
  // 2. find default template in the same directory
  // 3. turn to parent directory and repeat 1 and 2

  let t = template
  let d
  for (const p of path.slice(1).split('/')) {
    try {
      d = t[Object.keys(t).find(t => t.startsWith('default.')) as string]
    } catch {}
    try {
      t = t[p]
    } catch {
      if (d == null) throw new Error('no template matched')
      return d
    }
  }
  if (t == null) throw new Error('no template matched')
  return t
}
