import chalk from 'chalk'
import express from 'express'
import expressWs from 'express-ws'
import fs from 'fs'
import { WebSocket } from 'ws'
import path from 'path'

import Vivia from '../vivia.js'

const hotreloadScript = `
<script>
// Generated by Vivia Hot Reload Plugin (Builtin)
const socket = new WebSocket(\`ws://\${location.host}\`)
socket.onopen = () => { console.info('Connected to hot reload server') }
socket.onmessage = () => { location.reload() }
</script>`

const vivia = new Vivia()
vivia.debug = true

await vivia.load()

function hotreloadInject () {
  vivia.plugins['hotreload'] = (context: any) => {
    if (path.extname(context.path) == '.html') {
      context.content += hotreloadScript
    }
  }
  Object.keys(vivia.config.pipeline).forEach(key => {
    vivia.config.pipeline[key].push('hotreload')
  })
}

hotreloadInject()
await vivia.buildAll()

// start hotreload server
const { app } = expressWs(express())
const clients: WebSocket[] = []
app.use(express.static(vivia.config.outdir))
app.ws('/', (ws, req) => {
  clients.push(ws)
  ws.onclose = () => clients.splice(clients.indexOf(ws), 1)
})

fs.watch('.', { recursive: true }, async (event, pathname) => {
  if (pathname == undefined) return
  pathname = path.posix.join(...pathname.split('\\'))
  switch (pathname.split('/')[0]) {
    case vivia.config.outdir:
      return
    case 'source':
      if (!fs.existsSync(pathname) || fs.statSync(pathname).isDirectory()) {
        console.clear()
        await vivia.rebuildAll()
        console.info(chalk.yellow(`${pathname} changed, all rebuilt`))
      } else if (fs.statSync(pathname).isFile()) {
        console.clear()
        await vivia.rebuild(pathname.replace('source/', ''))
        console.info(chalk.yellow(`${pathname} changed, rebuilt`))
      }
      break
    case 'data':
    case 'template':
    case 'static':
      console.clear()
      await vivia.rebuildAll()
      console.info(chalk.yellow(`${pathname} changed, all rebuilt`))
      break
    case 'vivia.yml':
      console.clear()
      await vivia.load()
      hotreloadInject()
      await vivia.buildAll()
      console.info(chalk.yellow(`${pathname} changed, restarted`))
      break
  }
  clients.forEach(client => client.send('reload'))
})

app.listen(vivia.config.port)
console.info(chalk.cyan(`Listening at http://localhost:${vivia.config.port}`))
