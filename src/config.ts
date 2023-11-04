import chalk from 'chalk'
import fs from 'fs'
import { basenameWithoutExt, parse } from './utils.js'

class Config {
  site: Record<string, any> = {}
  plugins: Record<string, Function> = {}
  theme: Record<string, Function> = {}
  pipeline: Record<string, any> = {}
  build: Record<string, any> = {
    outdir: 'public'
  }
  serve: Record<string, any> = {
    debug: process.env.NODE_ENV !== 'production',
    port: 3722
  }
  deploy: Record<string, any> = {}

  /**
   * Load config from a vivia project directory.
   * @param dirname The path to the directory.
   * @returns The config of the project.
   */
  static from (dirname: string) {
    const filenames = fs.readdirSync(dirname)
    if (!filenames.some(filename => basenameWithoutExt(filename) === 'vivia')) {
      throw new Error(`No vivia config file found in ${dirname}`)
    }

    const config = new Config()
    const duplicated: any = []
    filenames.forEach(filename => {
      const basename = basenameWithoutExt(filename)
      if (!(basename === 'vivia' || basename in config)) {
        return
      }
      if (duplicated.includes(basename)) {
        console.warn(chalk.yellow(`Duplicate config file found: ${filename}`))
      }
      duplicated.push(basename)

      const key = basename as keyof Config | 'vivia'
      const content = parse(dirname, filename)
      if (key === 'vivia') {
        Object.assign(config, content)
      } else {
        Object.assign(config[key], content)
      }
    })
    return config
  }
}

export default Config
