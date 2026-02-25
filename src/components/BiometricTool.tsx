'use client'
import { useState, useRef, useCallback } from 'react'
import { processPhoto } from '@/lib/api'

// ── Types ────────────────────────────────────────────────────────────────────
type Step = { id: number; label: string; state: 'idle'|'active'|'done' }
type BgColor  = 'gray'|'white'|'blue'
type Layout   = '4x2'|'3x3'|'2x2'

const DOC_TYPES = [
  { value: 'cin',      label: 'بطاقة التعريف الوطنية (CIN)', size: '35×45 mm' },
  { value: 'passport', label: 'جواز السفر',                   size: '35×45 mm' },
  { value: 'visa',     label: 'التأشيرة',                     size: '35×45 mm' },
  { value: 'permis',   label: 'رخصة القيادة',                 size: '35×45 mm' },
]

const BG_OPTIONS: { value: BgColor; label: string; swatch: string }[] = [
  { value: 'gray',  label: 'رمادي فاتح', swatch: '#d2d2d2' },
  { value: 'white', label: 'أبيض',       swatch: '#ffffff' },
  { value: 'blue',  label: 'أزرق فاتح', swatch: '#add8e6' },
]

const LAYOUT_OPTIONS: { value: Layout; label: string; cols: number; rows: number }[] = [
  { value: '4x2', label: '4 × 2', cols: 4, rows: 2 },
  { value: '3x3', label: '3 × 3', cols: 3, rows: 3 },
  { value: '2x2', label: '2 × 2', cols: 2, rows: 2 },
]

const INIT_STEPS: Step[] = [
  { id: 1, label: 'رفع الصورة إلى الخادم',                    state: 'idle' },
  { id: 2, label: 'معالجة الخلفية بالذكاء الاصطناعي (Fal.ai)', state: 'idle' },
  { id: 3, label: 'إضافة الخلفية وضبط الأبعاد',               state: 'idle' },
  { id: 4, label: 'توليد لوحة الصور للطباعة',                 state: 'idle' },
]

// ── Styles helpers ────────────────────────────────────────────────────────────
const s = {
  card: {
    background: '#111318',
    border: '1px solid #252a35',
    borderRadius: 20,
    padding: 28,
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#9ca3af',
    marginBottom: 8,
    letterSpacing: 0.5,
  } as React.CSSProperties,
  select: {
    width: '100%',
    background: '#181c24',
    border: '1px solid #2e3545',
    color: '#e8eaf0',
    padding: '10px 14px',
    borderRadius: 12,
    fontFamily: 'Cairo,sans-serif',
    fontSize: 14,
    outline: 'none',
    appearance: 'none' as const,
  } as React.CSSProperties,
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BiometricTool() {
  const [file,      setFile]      = useState<File|null>(null)
  const [preview,   setPreview]   = useState<string|null>(null)
  const [docType,   setDocType]   = useState('cin')
  const [bgColor,   setBgColor]   = useState<BgColor>('gray')
  const [layout,    setLayout]    = useState<Layout>('4x2')
  const [dpi,       setDpi]       = useState(300)
  const [loading,   setLoading]   = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [steps,     setSteps]     = useState<Step[]>(INIT_STEPS)
  const [result,    setResult]    = useState<string|null>(null)
  const [resultBlob,setResultBlob]= useState<Blob|null>(null)
  const [error,     setError]     = useState<string|null>(null)
  const [dragover,  setDragover]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { setError('الرجاء اختيار صورة صحيحة'); return }
    if (f.size > 10 * 1024 * 1024)   { setError('حجم الصورة أكبر من 10MB');  return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
    setResult(null)
  }, [])

  const onInputChange  = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }
  const onDrop         = (e: React.DragEvent) => { e.preventDefault(); setDragover(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]) }
  const onDragOver     = (e: React.DragEvent) => { e.preventDefault(); setDragover(true)  }
  const onDragLeave    = () => setDragover(false)

  // ── Step helpers ───────────────────────────────────────────────────────────
  const setStep = (id: number, state: Step['state']) =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, state } : s))

  // ── Process ────────────────────────────────────────────────────────────────
  const handleProcess = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    setSteps(INIT_STEPS)
    setProgress(10)

    try {
      setStep(1, 'active')
      await new Promise(r => setTimeout(r, 300))
      setStep(1, 'done'); setStep(2, 'active'); setProgress(25)

      const blob = await processPhoto({ file, docType, bgColor, layout, dpi })

      setStep(2, 'done'); setStep(3, 'active'); setProgress(70)
      await new Promise(r => setTimeout(r, 200))

      setStep(3, 'done'); setStep(4, 'active'); setProgress(90)
      await new Promise(r => setTimeout(r, 200))

      setStep(4, 'done'); setProgress(100)

      const url = URL.createObjectURL(blob)
      setResultBlob(blob)
      setResult(url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطأ غير متوقع')
      setSteps(INIT_STEPS)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null); setPreview(null); setResult(null)
    setError(null); setSteps(INIT_STEPS); setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  const downloadResult = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `biometric_${docType}_${layout}.jpg`
    a.click()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>

      {/* ─── Left: Upload ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={s.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📤</div>
            رفع الصورة الأصلية
          </div>

          {/* Upload Zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            style={{
              border: `2px dashed ${dragover ? '#3b82f6' : '#2e3545'}`,
              borderRadius: 12,
              padding: '32px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragover ? 'rgba(59,130,246,0.05)' : 'transparent',
              transition: 'all 0.3s',
            }}
          >
            <input ref={inputRef} type="file" accept="image/*" onChange={onInputChange} style={{ display: 'none' }} />

            {preview ? (
              <div>
                <img src={preview} alt="معاينة" style={{ maxHeight: 200, borderRadius: 8, border: '2px solid #2e3545', objectFit: 'cover', maxWidth: '100%' }} />
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>{file?.name}</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 42, marginBottom: 10 }}>🖼️</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>اسحب الصورة هنا أو انقر للاختيار</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>PNG, JPG, WEBP — حد أقصى 10MB</div>
              </>
            )}
          </div>
        </div>

        {/* Tips */}
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>💡 نصائح للحصول على أفضل نتيجة</div>
          {['الوجه واضح ومضاء جيداً', 'تجنب النظارات الشمسية والقبعات', 'خلفية بسيطة تعطي دقة أعلى'].map((tip, i) => (
            <div key={i} style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>← {tip}</div>
          ))}
        </div>
      </div>

      {/* ─── Right: Settings + Action ──────────────────────────────────────── */}
      <div>
        <div style={s.card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</div>
            إعدادات المعالجة
          </div>

          {/* Doc Type */}
          <div style={{ marginBottom: 18 }}>
            <label style={s.label}>نوع الوثيقة</label>
            <div style={{ position: 'relative' }}>
              <select value={docType} onChange={e => setDocType(e.target.value)} style={s.select}>
                {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label} — {d.size}</option>)}
              </select>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>▼</div>
            </div>
          </div>

          {/* BG Color */}
          <div style={{ marginBottom: 18 }}>
            <label style={s.label}>لون الخلفية</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {BG_OPTIONS.map(opt => (
                <div key={opt.value}
                  onClick={() => setBgColor(opt.value)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${bgColor === opt.value ? '#3b82f6' : '#2e3545'}`,
                    background: bgColor === opt.value ? 'rgba(59,130,246,0.1)' : '#181c24',
                    color: bgColor === opt.value ? '#60a5fa' : '#9ca3af',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: opt.swatch, border: '1px solid rgba(255,255,255,0.15)' }} />
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          {/* Layout */}
          <div style={{ marginBottom: 18 }}>
            <label style={s.label}>تخطيط لوحة الصور</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {LAYOUT_OPTIONS.map(opt => (
                <div key={opt.value}
                  onClick={() => setLayout(opt.value)}
                  style={{
                    padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${layout === opt.value ? '#3b82f6' : '#2e3545'}`,
                    background: layout === opt.value ? 'rgba(59,130,246,0.1)' : '#181c24',
                    color: layout === opt.value ? '#60a5fa' : '#9ca3af',
                    fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
                  }}>
                  {/* Mini grid preview */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${opt.cols},1fr)`, gap: 2, width: 32, margin: '0 auto 6px' }}>
                    {Array.from({ length: opt.cols * opt.rows }).map((_, i) => (
                      <div key={i} style={{ background: 'currentColor', opacity: 0.4, borderRadius: 2, aspectRatio: '35/45' }} />
                    ))}
                  </div>
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          {/* DPI */}
          <div style={{ marginBottom: 24 }}>
            <label style={s.label}>دقة الطباعة (DPI)</label>
            <div style={{ position: 'relative' }}>
              <select value={dpi} onChange={e => setDpi(Number(e.target.value))} style={s.select}>
                <option value={300}>300 DPI — معيار الطباعة الاحترافية</option>
                <option value={600}>600 DPI — دقة عالية جداً</option>
                <option value={150}>150 DPI — معاينة سريعة</option>
              </select>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>▼</div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleProcess}
            disabled={!file || loading}
            style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none', cursor: file && !loading ? 'pointer' : 'not-allowed',
              background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
              color: 'white', fontFamily: 'Cairo,sans-serif', fontSize: 15, fontWeight: 700,
              opacity: !file || loading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
              transition: 'all 0.3s',
            }}>
            {loading ? <><span className="spinner" />جاري المعالجة...</> : '✨ معالجة الصورة'}
          </button>

          {/* Progress */}
          {loading && (
            <div style={{ marginTop: 20, animation: 'fadeIn 0.3s ease' }}>
              <div style={{ height: 4, background: '#252a35', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', borderRadius: 999, transition: 'width 0.5s ease' }} />
              </div>
              {steps.map(step => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, marginBottom: 8,
                  color: step.state === 'done' ? '#10b981' : step.state === 'active' ? '#60a5fa' : '#4b5563' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>
                    {step.state === 'done' ? '✓' : step.id}
                  </div>
                  {step.label}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: 12, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      {/* ─── Result (full width) ─────────────────────────────────────────────── */}
      {result && (
        <div style={{ ...s.card, gridColumn: '1 / -1', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
              ✅ تم التوليد بنجاح — جاهز للطباعة
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[`${dpi} DPI`, `${layout} صور`, DOC_TYPES.find(d=>d.value===docType)?.label.split(' ')[0]].map((chip, i) => (
                <span key={i} style={{ background: '#181c24', border: '1px solid #2e3545', padding: '3px 12px', borderRadius: 999, fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: '#9ca3af' }}>{chip}</span>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #2e3545', background: '#fff', marginBottom: 16 }}>
            <img src={result} alt="لوحة الصور" style={{ width: '100%', display: 'block' }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={downloadResult} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: '#10b981', color: 'white', fontFamily: 'Cairo,sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              ⬇️ تحميل لوحة الصور (JPEG عالي الجودة)
            </button>
            <button onClick={reset} style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid #2e3545', background: 'transparent', color: '#9ca3af', fontFamily: 'Cairo,sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              🔄 صورة جديدة
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
