import chalk from 'chalk'
import express from 'express'

import Vivia from '../vivia.js'

const vivia = new Vivia()
await vivia.load()
const app = express()
app.get('*', async (req, res, next) => {})
app.use(express.static('static'))

const port = vivia.config.port ?? 3210
app.listen(port)
console.log(chalk.cyan(`Listening at http://localhost:${port}`))
