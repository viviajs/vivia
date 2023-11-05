import fs from 'fs'
import { basenameWithoutExt, parse } from './utils.js'
import path from 'path'
import Context from './context.js'
import Config from './config.js'
import Vivia from './vivia.js'

class Loader {
  /**
   * Load the config file.
   * @param dirname The working directory.
   * @returns The config object.
   */
  static config (dirname: string) {
    const filename = fs
      .readdirSync(dirname)
      .find(filename => basenameWithoutExt(filename) === 'vivia')
    if (filename == null) {
      throw new Error(`No vivia config file found in ${dirname}`)
    }
    return Object.assign(new Config(), parse(dirname, filename))
  }

  /**
   * Load all source files.
   * @param dirname The working directory.
   * @returns The source contexts.
   */
  static source (dirname: string) {
    return fs
      .readdirSync(dirname, { encoding: 'utf8', recursive: true })
      .map(filename => {
        return new Context(
          path.join(filename).split(path.sep).join(path.posix.sep),
          fs.readFileSync(path.join(dirname, filename), 'utf8')
        )
      })
  }

  /**
   * Load all data files.
   * @param dirname The working directory.
   * @returns The data object.
   */
  static data (dirname: string) {
    const data: any = {}
    fs.readdirSync(dirname).forEach(filename => {
      const stat = fs.statSync(path.join(dirname, filename))
      if (stat.isFile()) {
        const name = basenameWithoutExt(filename)
        data[name] = parse(dirname, filename)
      }
      if (stat.isDirectory()) {
        data[filename] = Loader.data(path.join(dirname, filename))
      }
    })
    return data
  }

  /**
   * Load all plugin paths.
   * @param dirname The working directory.
   * @returns The plugin paths.
   */
  static async plugins (vivia: Vivia) {
    const deps = parse(vivia.workdir, 'package.json').dependencies.filter(
      (dep: string) =>
        dep.startsWith('vivia-') && !dep.startsWith('vivia-theme-')
    )
    for (const dep of deps) {
      const name = dep.replace('vivia-', '')
      const module = await import(path.join(process.cwd(), 'node_modules', dep))
      await module.default(vivia.config.plugins[name], vivia)
    }
  }

  /**
   * Load a theme.
   * @param name The theme name.
   * @returns The theme instance.
   */
  static theme (name: string) {
    return new Vivia(
      path.join(process.cwd(), 'node_modules', `vivia-theme-${name}`)
    )
  }
}

export default Loader
