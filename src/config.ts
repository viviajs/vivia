class Config {
  globals: Record<string, any> = {}
  plugins: Record<string, any> = {}
  pipelines: Record<string, any> = {}
  theme = ''
  outdir = 'public'
  debug = process.env.NODE_ENV === 'development'
  port = 3722
}

export default Config
