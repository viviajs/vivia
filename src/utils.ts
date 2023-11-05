import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import toml from 'toml'

export function basenameWithoutExt (filename: string) {
  return path.basename(filename, path.extname(filename))
}

/**
 * Read a text file and attempt to automatically detect and parse its contents.
 * @param paths The path to the file.
 * @returns The parsed data.
 */
export function parse (...paths: string[]) {
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
      throw new Error(`Unknown file extension: ${filename}`)
  }
}
