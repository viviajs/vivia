import chalk from 'chalk'
import express from 'express'

const app = express()
app.get('*', (req, res) => {
  res.send('Hello World!')
})

app.listen(3210)
console.log(chalk.cyan('Server started in watch mode at http://localhost:3210'))
