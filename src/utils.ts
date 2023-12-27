import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import toml from 'toml'
import Config from './config.js'

class Utils {
  /**
   * Read a text file and attempt to automatically detect and parse its contents.
   * @param paths The path to the file.
   * @returns The parsed data.
   */
  static parse (...paths: string[]) {
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
      default:
        throw new Error(`Unsupported file format: ${filename}`)
    }
  }

  static deepAssign (target: any, source: any) {
    for (const key in source) {
      if (!source.hasOwnProperty(key)) continue
      if (
        source[key] instanceof Object &&
        !(source[key] instanceof Array) &&
        target[key] != null &&
        target[key] instanceof Object
      ) {
        this.deepAssign(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }

  static loadConfig (dir: string) {
    const filename = fs
      .readdirSync(dir)
      .find(file => path.basename(file, path.extname(file)) === 'vivia')
    if (filename == null) {
      throw new Error(`No vivia config file found in ${dir}`)
    }
    return Object.assign(new Config(), this.parse(dir, filename))
  }
}

export default Utils
