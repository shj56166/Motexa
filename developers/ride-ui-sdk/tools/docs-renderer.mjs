import { Marked, Renderer } from 'marked'

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

// The source is maintained Markdown, never user-supplied HTML. Still disable
// embedded HTML/images and unsafe link schemes in both website consumers.
export function renderDocument(markdown, resolveLink = href => href) {
  const headings = []
  const ids = new Map()
  const renderer = new Renderer()
  const defaultTable = renderer.table
  renderer.html = ({ text }) => escapeHtml(text)
  renderer.image = ({ text }) => escapeHtml(text)
  renderer.link = function ({ href, title, tokens }) {
    const label = this.parser.parseInline(tokens)
    if (/^[\s\u0000-\u0020]*(?:javascript|data|vbscript):/i.test(href)) return label
    const target = resolveLink(href)
    if (!target || /[\u0000-\u0020\\]/.test(target) || target.startsWith('//') || (/^[a-z][a-z\d+.-]*:/i.test(target) && !/^https?:/i.test(target))) return label
    const external = /^https?:/i.test(target)
    return `<a href="${escapeHtml(target)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`
  }
  renderer.heading = function ({ tokens, depth, text }) {
    const plain = text.replace(/<[^>]*>/g, '').replace(/[`*_]/g, '')
    const base = plain.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-') || 'section'
    const occurrence = ids.get(base) ?? 0
    ids.set(base, occurrence + 1)
    const id = occurrence ? `${base}-${occurrence}` : base
    if (depth === 2 || depth === 3) headings.push({ id, title: plain, depth })
    return `<h${depth} id="${escapeHtml(id)}">${this.parser.parseInline(tokens)}</h${depth}>\n`
  }
  renderer.table = function (token) {
    return `<div class="sdk-table" tabindex="0">${defaultTable.call(this, token)}</div>\n`
  }
  const parser = new Marked({ gfm: true, breaks: false, renderer, async: false })
  return { html: parser.parse(markdown), headings }
}
