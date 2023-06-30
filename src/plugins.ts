import { marked } from 'marked'

// Vivia built-in plugins

export default function (config: any) {
  const markedConfig = config?.plugins?.marked
  marked.use({
    breaks: markedConfig?.breaks ?? false,
    gfm: markedConfig?.gfm ?? true,
    pedantic: markedConfig?.pedantic ?? false
  })

  return {
    renderer: {
      marked: (ctx: any) => {
        console.log('you see marked')
        ctx.type = 'html'
        ctx.content = marked.parse(ctx.content)
      },
      admonition: (ctx: { content: string }) => {
        ctx.content = ctx.content.replace(
          /!!! ([a-z]+)\s*(.*)\n([\s\S]*)\n!!!/g,
          (_, type, title, content) => {
            return `<div class="admonition admonition-${type}">${
              title != '' ? `<p class="admonition-title">${title}</p>` : ''
            }<p>${content}</p></div>`
          }
        )
      }
    }
  }
}
