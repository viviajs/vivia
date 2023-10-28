import fs from 'fs'

import Vivia from '../vivia.js'
import chalk from 'chalk'

const vivia = new Vivia()
await vivia.loadConfig()
fs.rmSync(vivia.config.outdir, { recursive: true, force: true })
console.info(chalk.cyan(`folder '${vivia.config.outdir}' cleaned`))
