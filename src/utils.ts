import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import toml from 'toml'

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
        throw new Error(`Unsupported file type: ${filename}`)
    }
  }

  /**
   * Import a file or directory as a module.
   * @param paths The path to the file or directory.
   * @returns The module.
   */
  static async import (...paths: string[]) {
    const filename = path.join(...paths)
    const stat = fs.statSync(filename)
    if (stat.isFile()) {
      return await import(filename)
    }
    if (stat.isDirectory()) {
      const index = Utils.parse(filename, 'package.json').main ?? 'index.js'
      return await import(path.join(filename, index))
    }
  }
  /**
   * Read a file and return a binary stream.
   * @param paths The path to the file.
   * @returns The binary stream.
   */
  static read (...paths: string[]) {
    return fs.readFileSync(path.join(...paths))
  }

  static readdir (...paths: string[]) {
    // 递归读取文件夹
    const result: string[] = []
    const read = (...paths: string[]) => {
      for (const filename of fs.readdirSync(path.join(...paths))) {
        const stat = fs.statSync(path.join(...paths, filename))
        if (stat.isFile()) {
          result.push(path.join(...paths, filename))
        }
        if (stat.isDirectory()) {
          read(...paths, filename)
        }
      }
    }
    return result
  }

  /**
   * Write data to a file. If the folder does not exist, it will be automatically created.
   * @param data The data to write.
   * @param paths The path to the file.
   */
  static write (data: any, ...paths: string[]) {
    const filename = path.join(...paths)
    const folder = path.dirname(filename)
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
    fs.writeFileSync(filename, data)
  }

  /**
   * Read a directory and return a list of files and folders.
   * @param paths The path to the directory.
   * @returns The list of files and folders.
   */
  static dir (...paths: string[]) {
    return fs.readdirSync(path.join(...paths))
  }
}

export function basenameWithoutExt (filename: string) {
  return path.basename(filename, path.extname(filename))
}

export default Utils
