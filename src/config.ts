import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import toml from 'toml'

class Config {
  meta: {
    [key: string]: any
    title?: string
    subtitle?: string
    description?: string
    keywords?: string[]
    author?: string[]
    language?: string
    timezone?: string
    icon?: string
    url?: string
  } = {}
  plugins: Record<string, Function> = {}
  theme: Record<string, Function> = {}
  render: Record<string, string[]> = {}
  build: Record<string, any> = {
    outdir: 'public',
    debug: false
  }
  deploy: Record<string, any> = {}

  static from (dir: string) {
    fs.readdirSync(dir).forEach(filename => {

    })

    const content = fs.readFileSync(filename, 'utf8')
    switch (path.extname(filename)) {
      case '.yml':
      case '.yaml':
        return yaml.parse(content)
      case '.json':
        return JSON.parse(content)
      case '.toml':
        return toml.parse(content)
      case '.js':
        return
      default:
        throw new Error(`Unsupported config file: ${filename}`)
    }
  }
}

export default Config
