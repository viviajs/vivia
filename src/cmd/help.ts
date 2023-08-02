import chalk from 'chalk'

const help = {
  'vivia build': 'Build the website',
  'vivia watch': 'Start a development server',
  'vivia help': 'Print this help message'
}

console.log(
  'Usage: vivia <commend>\n' +
    Object.entries(help)
      .map(([cmd, desc]) => `  ${chalk.cyan(cmd)}\t\t${desc}`)
      .join('\n')
)
