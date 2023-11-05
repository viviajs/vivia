class Config {
  site: Record<string, any> = {}
  plugins: Record<string, any> = {}
  pipeline: Record<string, any> = {}
  theme?: string
  outdir = 'public'
  debug = process.env.NODE_ENV !== 'production'
  port = 3722
}

export default Config
