'use client'
import { useState, useRef, useCallback } from 'react'
import { processPhoto } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const DOC_TYPES = [
  { value: 'cin',      label: 'CIN — بطاقة التعريف', size: '35×45mm' },
  { value: 'passport', label: 'جواز السفر',           size: '35×45mm' },
  { value: 'visa',     label: 'التأشيرة',              size: '35×45mm' },
  { value: 'permis',   label: 'رخصة القيادة',          size: '35×45mm' },
]

const BG_OPTIONS = [
  { value: 'gray',       label: 'رمادي',    swatch: '#d2d2d2', border: '' },
  { value: 'white',      label: 'أبيض',     swatch: '#ffffff', border: '1px solid #ccc' },
  { value: 'blue',       label: 'أزرق',     swatch: '#add8e6', border: '' },
  { value: 'light_blue', label: 'أزرق فاتح', swatch: '#c8dcf0', border: '' },
]

const LAYOUT_OPTIONS = [
  { value: '4x2', label: '4×2  (8 صور)', cols: 4, rows: 2 },
  { value: '3x3', label: '3×3  (9 صور)', cols: 3, rows: 3 },
  { value: '2x2', label: '2×2  (4 صور)', cols: 2, rows: 2 },
  { value: '1x1', label: '1×1  صورة واحدة', cols: 1, rows: 1 },
]

const STEPS = [
  'رفع الصورة',
  'إزالة الخلفية (AI)',
  'قص ذكي بالوجه',
  'توليد لوحة الطباعة',
]

export default function BiometricTool() {
  const [file,       setFile]       = useState<File | null>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [docType,    setDocType]    = useState('cin')
  const [bgColor,    setBgColor]    = useState('gray')
  const [layout,     setLayout]     = useState('4x2')
  const [dpi,        setDpi]        = useState(300)
  const [zoom,       setZoom]       = useState(1.0)
  const [upscale,    setUpscale]    = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [stepIdx,    setStepIdx]    = useState(-1)
  const [result,     setResult]     = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [dragover,   setDragover]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { setError('اختر صورة صحيحة'); return }
    if (f.size > 15 * 1024 * 1024)   { setError('حجم الصورة أكبر من 15MB'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null); setResult(null)
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragover(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleProcess = async () => {
    if (!file) return
    setLoading(true); setError(null); setResult(null); setStepIdx(0)

    try {
      const form = new FormData()
      form.append('file',     file)
      form.append('doc_type', docType)
      form.append('bg_color', bgColor)
      form.append('layout',   layout)
      form.append('dpi',      String(dpi))
      form.append('zoom',     String(zoom))
      form.append('upscale',  String(upscale))

      setStepIdx(1)
      const res = await fetch(`${API}/api/biometric-photo`, { method: 'POST', body: form })
      setStepIdx(2)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }

      setStepIdx(3)
      const blob = await res.blob()
      setResult(URL.createObjectURL(blob))
      setStepIdx(-1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطأ غير متوقع')
      setStepIdx(-1)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null); setPreview(null); setResult(null)
    setError(null); setStepIdx(-1)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

      {/* ── Canvas Area ──────────────────────────────────────────────────── */}
      <div style={{ background: '#111318', border: '1px solid #252a35', borderRadius: 20, overflow: 'hidden' }}>

        {/* Upload / Preview */}
        <div
          onClick={() => !result && inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragover(true) }}
          onDragLeave={() => setDragover(false)}
          style={{
            minHeight: 420,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: result ? 'default' : 'pointer',
            background: dragover ? 'rgba(59,130,246,0.08)' : 'transparent',
            border: dragover ? '2px dashed #3b82f6' : '2px dashed transparent',
            borderRadius: 18,
            transition: 'all 0.3s',
            position: 'relative',
          }}>
          <input ref={inputRef} type="file" accept="image/*"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{ display: 'none' }} />

          {result ? (
            <img src={result} alt="النتيجة" style={{ width: '100%', borderRadius: 16, display: 'block' }} />
          ) : preview ? (
            <div style={{ padding: 24, width: '100%', textAlign: 'center' }}>
              <img src={preview} alt="الأصلية" style={{ maxHeight: 360, maxWidth: '100%', borderRadius: 12, objectFit: 'contain' }} />
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>انقر للتغيير</div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>📸</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>اسحب الصورة هنا</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>أو انقر للاختيار — PNG, JPG حتى 15MB</div>
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,12,16,0.85)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <div style={{ width: 48, height: 48, border: '3px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
                {STEPS.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
                    color: i < stepIdx ? '#10b981' : i === stepIdx ? '#60a5fa' : '#4b5563' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>
                      {i < stepIdx ? '✓' : i + 1}
                    </div>
                    {s}
                    {i === stepIdx && <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite', marginRight: 'auto' }} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Result Actions */}
        {result && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #252a35', display: 'flex', gap: 10 }}>
            <a href={result} download={`biometric_${docType}_${layout}.jpg`}
              style={{ flex: 1, padding: '11px 0', background: '#10b981', color: 'white', borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontSize: 14, fontWeight: 700, fontFamily: 'Cairo,sans-serif' }}>
              ⬇️ تحميل لوحة الصور
            </a>
            <button onClick={reset}
              style={{ padding: '11px 16px', background: 'transparent', border: '1px solid #2e3545', color: '#9ca3af', borderRadius: 10, cursor: 'pointer', fontFamily: 'Cairo,sans-serif', fontSize: 13 }}>
              🔄 جديد
            </button>
          </div>
        )}
      </div>

      {/* ── Control Panel ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* نوع الوثيقة */}
        <div style={{ background: '#111318', border: '1px solid #252a35', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 10, letterSpacing: 1 }}>نوع الوثيقة</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DOC_TYPES.map(d => (
              <div key={d.value} onClick={() => setDocType(d.value)}
                style={{ padding: '9px 12px', borderRadius: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: docType === d.value ? 'rgba(59,130,246,0.15)' : 'transparent',
                  border: `1px solid ${docType === d.value ? '#3b82f6' : '#252a35'}`,
                  transition: 'all 0.2s' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: docType === d.value ? '#60a5fa' : '#9ca3af' }}>{d.label}</span>
                <span style={{ fontSize: 10, color: '#4b5563', fontFamily: 'JetBrains Mono,monospace' }}>{d.size}</span>
              </div>
            ))}
          </div>
        </div>

        {/* لون الخلفية */}
        <div style={{ background: '#111318', border: '1px solid #252a35', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 10, letterSpacing: 1 }}>لون الخلفية</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {BG_OPTIONS.map(o => (
              <div key={o.value} onClick={() => setBgColor(o.value)}
                style={{ padding: '8px 10px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  border: `2px solid ${bgColor === o.value ? '#3b82f6' : '#252a35'}`,
                  background: bgColor === o.value ? 'rgba(59,130,246,0.1)' : '#181c24',
                  transition: 'all 0.2s' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: o.swatch, border: o.border || '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: bgColor === o.value ? '#60a5fa' : '#9ca3af' }}>{o.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* تكبير الوجه */}
        <div style={{ background: '#111318', border: '1px solid #252a35', borderRadius: 16, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: 1 }}>تقريب الوجه (Zoom)</div>
            <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono,monospace', color: '#60a5fa' }}>{zoom.toFixed(1)}×</div>
          </div>
          <input type="range" min="0.6" max="1.6" step="0.1" value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#3b82f6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4b5563', marginTop: 4 }}>
            <span>أبعد</span><span>تلقائي</span><span>أقرب</span>
          </div>
        </div>

        {/* التخطيط والدقة */}
        <div style={{ background: '#111318', border: '1px solid #252a35', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 10, letterSpacing: 1 }}>لوحة الطباعة</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
            {LAYOUT_OPTIONS.map(o => (
              <div key={o.value} onClick={() => setLayout(o.value)}
                style={{ padding: '8px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${layout === o.value ? '#3b82f6' : '#252a35'}`,
                  background: layout === o.value ? 'rgba(59,130,246,0.1)' : '#181c24',
                  transition: 'all 0.2s' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${o.cols},1fr)`, gap: 2, width: 28, margin: '0 auto 5px' }}>
                  {Array.from({ length: o.cols * o.rows }).map((_, i) => (
                    <div key={i} style={{ background: layout === o.value ? '#3b82f6' : '#4b5563', borderRadius: 1, aspectRatio: '35/45', opacity: 0.6 }} />
                  ))}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: layout === o.value ? '#60a5fa' : '#6b7280' }}>{o.label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8, letterSpacing: 1 }}>دقة الطباعة</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[150, 300, 600].map(d => (
              <div key={d} onClick={() => setDpi(d)}
                style={{ flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 700,
                  border: `2px solid ${dpi === d ? '#3b82f6' : '#252a35'}`,
                  background: dpi === d ? 'rgba(59,130,246,0.1)' : '#181c24',
                  color: dpi === d ? '#60a5fa' : '#6b7280',
                  fontFamily: 'JetBrains Mono,monospace' }}>
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* خيار 4K */}
        <div style={{ background: '#111318', border: `1px solid ${upscale ? 'rgba(245,158,11,0.4)' : '#252a35'}`, borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setUpscale(!upscale)}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: upscale ? '#f59e0b' : '#9ca3af' }}>✨ تحسين الجودة 4K</div>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>يضيف ~20 ثانية للمعالجة</div>
            </div>
            <div style={{ width: 42, height: 24, borderRadius: 12, background: upscale ? '#f59e0b' : '#252a35', position: 'relative', transition: 'all 0.3s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.3s', left: upscale ? 21 : 3 }} />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 14px', borderRadius: 12, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleProcess} disabled={!file || loading}
          style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none',
            background: !file || loading ? '#1e2330' : 'linear-gradient(135deg,#3b82f6,#6366f1)',
            color: !file || loading ? '#4b5563' : 'white',
            fontFamily: 'Cairo,sans-serif', fontSize: 15, fontWeight: 700, cursor: !file || loading ? 'not-allowed' : 'pointer',
            boxShadow: !file || loading ? 'none' : '0 4px 20px rgba(59,130,246,0.35)',
            transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          {loading
            ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> جاري المعالجة...</>
            : '✨ معالجة الصورة'}
        </button>

      </div>
    </div>
  )
}
