import Utils, { basenameWithoutExt } from './utils.js'

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

  /**
   * Load config from a vivia project directory.
   * @param dirname The path to the directory.
   * @returns The config of the project.
   */
  static from (dirname: string) {
    const filenames = Utils.dir(dirname)
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
        console.warn(`Duplicate config file found: ${filename}`)
      }
      duplicated.push(basename)

      const key = basename as keyof Config | 'vivia'
      const content = Utils.parse(dirname, filename)
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
