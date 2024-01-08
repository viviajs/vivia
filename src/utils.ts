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
}

export default Utils
