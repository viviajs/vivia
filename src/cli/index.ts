#!/usr/bin/env node

import chalk from 'chalk'

try {
  console.log(`./${process.argv[2] ?? 'help'}.js`)

  await import(`./${process.argv[2] ?? 'help'}.js`)
} catch (e: any) {
  if (!e.code?.includes('MODULE_NOT_FOUND')) throw e
  console.info(chalk.red(`Unknown command '${process.argv[2]}'`))
  import('./help.js')
}
