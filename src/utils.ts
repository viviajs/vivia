import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import toml from 'toml'

export function writeFile (filename: string, data: any) {
  const folder = path.dirname(filename)
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(filename, data)
}

class Utils {
  static read (...paths: string[]) {
    const filename = path.join(...paths)
    const content = fs.readFileSync(filename, 'utf8')
    switch (path.extname(filename)) {
      case '.yml':
      case '.yaml':
        return yaml.parse(content)
      case '.json':
        return JSON.parse(content)
      case '.toml':
        return toml.parse(content)
      case '.txt':
      case '.md':
    }
  }
}
