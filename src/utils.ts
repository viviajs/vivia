import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import toml from 'toml'

export function posix (...paths: string[]) {
  return path
    .join(...paths)
    .split(path.sep)
    .join(path.posix.sep)
}

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

/**
 * Import a file or directory as a module.
 * @param paths The path to the file or directory.
 * @returns The module.
 */
export async function importModule (...paths: string[]) {
  const filename = path.join(...paths)
  const stat = fs.statSync(filename)
  if (stat.isFile()) {
    return await import(filename)
  }
  if (stat.isDirectory()) {
    const index = parse(filename, 'package.json').main ?? 'index.js'
    return await import(path.join(filename, index))
  }
}
