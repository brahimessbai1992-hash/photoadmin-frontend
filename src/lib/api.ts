const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ProcessOptions {
  file:     File
  docType:  string
  bgColor:  string
  layout:   string
  dpi:      number
}

export async function checkHealth() {
  const res = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error('API offline')
  return res.json()
}

export async function processPhoto(opts: ProcessOptions): Promise<Blob> {
  const form = new FormData()
  form.append('file',      opts.file)
  form.append('doc_type',  opts.docType)
  form.append('bg_color',  opts.bgColor)
  form.append('layout',    opts.layout)
  form.append('dpi',       String(opts.dpi))

  const res = await fetch(`${API}/api/biometric-photo`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.blob()
}
