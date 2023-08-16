#!/usr/bin/env node

import chalk from 'chalk'

try {
  await import(`./cmd/${process.argv[2] ?? 'help'}.js`)
} catch (e: any) {
  if (!e.code?.includes('MODULE_NOT_FOUND')) throw e
  console.log(chalk.red(`Unknown command '${process.argv[2]}'`))
  import('./cmd/help.js')
}
