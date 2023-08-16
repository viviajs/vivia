import fs from 'fs'

import Vivia from '../vivia.js'
import chalk from 'chalk'

const vivia = new Vivia()
fs.rmSync(vivia.config.outdir, { recursive: true, force: true })
console.log(chalk.cyan(`folder '${vivia.config.outdir}' cleaned`))
