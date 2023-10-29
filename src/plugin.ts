class Plugin {
  private name: string

  private renderer: Function[] = []
  private helper: any = {}

  load (a: (options: any) => null) {}

  unload () {}
}
export default Plugin
