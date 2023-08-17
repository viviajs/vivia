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
const socket = new WebSocket(\`ws://\${location.host}\${location.pathname}\`)
socket.onopen = () => { console.info('Connected to hot reload server') }
socket.onmessage = () => { location.reload() }
</script>`

const vivia = new Vivia()
await vivia.load()

function hotreloadInject () {
  vivia.plugins['hotreload'] = (context: any) => {
    if (path.extname(context.path) == '.html') {
      context.body += hotreloadScript
    }
  }
  Object.keys(vivia.config.render).forEach(key => {
    vivia.config.render[key].push('hotreload')
  })
}

hotreloadInject()
await vivia.buildAll()

// start hotreload server
const { app } = expressWs(express())
const clients: WebSocket[] = []
app.use(express.static(vivia.config.outdir))
app.ws('*', (ws, req) => {
  clients.push(ws)
  ws.onclose = () => clients.splice(clients.indexOf(ws), 1)
})

fs.watch('.', { recursive: true }, async (event, pathname) => {
  if (pathname == undefined) return
  if (pathname.startsWith(vivia.config.outdir)) return
  pathname = path.posix.join(...pathname.split('\\'))
  switch (pathname.split('/')[0]) {
    case 'content':
      console.clear()
      console.info(`Detected change on ${pathname}, rebuilding...`)
      await vivia.rebuild(pathname.replace('content/', ''))
      break
    case 'data':
    case 'template':
      console.clear()
      console.info(`Detected change on ${pathname}, rebuilding all...`)
      await vivia.rebuildAll()
      break
    case 'vivia.yml':
      console.clear()
      console.info(`Detected change on ${pathname}, restarting...`)
      await vivia.load()
      hotreloadInject()
      await vivia.buildAll()
      break
  }
  clients.forEach(client => client.send('reload'))
})

app.listen(vivia.config.port)
console.info(chalk.cyan(`Listening at http://localhost:${vivia.config.port}`))
