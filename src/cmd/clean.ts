import fs from 'fs'

fs.rmSync('public', { recursive: true, force: true })
