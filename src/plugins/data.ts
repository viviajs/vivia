import fs from 'fs'
import path from 'path'
import Vivia from '../vivia.js'
import Utils from '../utils.js'

function load (dirname: string) {
  const data: any = {}
  fs.readdirSync(dirname).forEach(filename => {
    const stat = fs.statSync(path.join(dirname, filename))
    if (stat.isFile()) {
      const name = path.basename(filename, path.extname(filename))
      data[name] = Utils.parse(dirname, filename)
    }
    if (stat.isDirectory()) {
      data[filename] = load(path.join(dirname, filename))
    }
  })
  return data
}

export default function (options: any, vivia: Vivia) {
  vivia.globals.data = load(vivia.workdir)
}
