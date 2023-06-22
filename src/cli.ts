#!/usr/bin/env node

import Vivia from './vivia.js'
const vivia = new Vivia(process.argv.slice(2))
await vivia.load()
