import fs from 'fs'
import { basenameWithoutExt, parse } from './utils.js'
import path from 'path'
import Context from './context.js'
import Config from './config.js'
import Vivia from './vivia.js'
import Pipeline from './pipeline.js'

class Loader {
  vivia: Vivia
  workdir: string

  constructor (vivia: Vivia) {
    this.vivia = vivia
    this.workdir = vivia.workdir
  }

  config () {
    const filename = fs
      .readdirSync(this.workdir)
      .find(filename => basenameWithoutExt(filename) === 'vivia')
    if (filename == null) {
      throw new Error(`No vivia config file found in ${this.workdir}`)
    }
    return Object.assign(new Config(), parse(this.workdir, filename))
  }

  source () {
    return fs
      .readdirSync(this.workdir, { encoding: 'utf8', recursive: true })
      .map(filename => {
        return new Context(
          path.join(filename).split(path.sep).join(path.posix.sep),
          fs.readFileSync(path.join(this.workdir, filename), 'utf8')
        )
      })
  }

  data (dirname?: string) {
    const workdir = dirname ?? this.workdir
    const data: any = {}
    fs.readdirSync(workdir).forEach(filename => {
      const stat = fs.statSync(path.join(workdir, filename))
      if (stat.isFile()) {
        const name = basenameWithoutExt(filename)
        data[name] = parse(workdir, filename)
      }
      if (stat.isDirectory()) {
        data[filename] = this.data(path.join(workdir, filename))
      }
    })
    return data
  }

  theme (name: string) {
    return new Vivia(
      path.join(process.cwd(), 'node_modules', `vivia-theme-${name}`)
    )
  }

  async plugins () {
    const deps = parse(this.workdir, 'package.json').dependencies.filter(
      (dep: string) =>
        dep.startsWith('vivia-') && !dep.startsWith('vivia-theme-')
    )
    for (const dep of deps) {
      const name = dep.replace('vivia-', '')
      const module = await import(path.join(process.cwd(), 'node_modules', dep))
      await module.default(this.vivia.config.plugins[name], this.vivia)
    }
  }

  pipeline () {
    const pipelines = []
    this.vivia.config.pipelines.map((pipeline: any) => {
      const renderers = pipeline.renderers.map((renderer: string) => {
        return this.vivia.renderers[renderer]
      })
      return new Pipeline(pipeline.router, renderers, pipeline)
    })
  }
}

export default Loader
