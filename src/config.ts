import fs from 'fs'
import yaml from 'yaml'

export default function loadConfig (filename: string): object {
  return yaml.parse(fs.readFileSync(filename, 'utf8'))
}
