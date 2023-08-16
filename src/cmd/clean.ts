import fs from 'fs'

import Vivia from '../vivia.js'

const vivia = new Vivia()
fs.rmSync(vivia.config.outdir, { recursive: true, force: true })
