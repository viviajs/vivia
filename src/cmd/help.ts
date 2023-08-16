import chalk from 'chalk'

const help = {
  'vivia build': 'Build the website',
  'vivia serve': 'Start a server',
  'vivia clean': 'Clean build output',
  'vivia help': 'Print this help message'
}

console.info(
  'Usage: vivia <commend>\n' +
    Object.entries(help)
      .map(([cmd, desc]) => `  ${chalk.cyan(cmd)}\t\t${desc}`)
      .join('\n')
)
