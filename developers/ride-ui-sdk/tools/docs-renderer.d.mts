export interface DocumentHeading { id: string; title: string; depth: number }
export function escapeHtml(value: unknown): string
export function renderDocument(markdown: string, resolveLink?: (href: string) => string | null): { html: string; headings: DocumentHeading[] }
