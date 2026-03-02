'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/* ══════════════════════════════════════════════════════════════
   أنواع الوثائق — مغربية + دولية + كلاسيكية
   ══════════════════════════════════════════════════════════════ */
const DOC_CATEGORIES = [
  {
    id: 'morocco',
    label: '🇲🇦 المغرب',
    types: [
      { value: 'cin',      label: 'CIN — بطاقة التعريف',  size: '35×45mm' },
      { value: 'passport', label: 'جواز السفر المغربي',     size: '35×45mm' },
      { value: 'permis',   label: 'رخصة القيادة',           size: '35×45mm' },
    ],
  },
  {
    id: 'international',
    label: '🌍 دولي',
    types: [
      { value: 'visa_us',       label: 'تأشيرة أمريكية',    size: '51×51mm (2×2")' },
      { value: 'visa_schengen', label: 'تأشيرة شنغن',       size: '35×45mm' },
      { value: 'visa_uk',       label: 'تأشيرة بريطانيا',   size: '35×45mm' },
      { value: 'visa_canada',   label: 'تأشيرة كندا',       size: '50×70mm' },
    ],
  },
  {
    id: 'classic',
    label: '🖼️ صيغ كلاسيكية',
    types: [
      { value: 'photo_3x4', label: 'صورة 3×4 cm',          size: '30×40mm' },
      { value: 'photo_5x5', label: 'صورة 5×5 cm (مربعة)',  size: '50×50mm' },
      { value: 'photo_4x6', label: 'صورة 4×6 (10×15 cm)',  size: '102×152mm' },
    ],
  },
]

const BG_OPTIONS = [
  { value: 'gray',       label: 'رمادي',     swatch: '#d2d2d2', border: '' },
  { value: 'white',      label: 'أبيض',      swatch: '#ffffff', border: '1px solid #555' },
  { value: 'blue',       label: 'أزرق',      swatch: '#add8e6', border: '' },
  { value: 'light_blue', label: 'أزرق فاتح', swatch: '#c8dcf0', border: '' },
]

const LAYOUT_OPTIONS = [
  { value: '4x2', label: '4×2',  sub: '8 صور',     cols: 4, rows: 2 },
  { value: '3x3', label: '3×3',  sub: '9 صور',     cols: 3, rows: 3 },
  { value: '2x2', label: '2×2',  sub: '4 صور',     cols: 2, rows: 2 },
  { value: '6x4', label: '6×4',  sub: '24 صورة',   cols: 6, rows: 4 },
  { value: '1x1', label: '1×1',  sub: 'صورة واحدة', cols: 1, rows: 1 },
]

const FORMAT_OPTIONS = [
  { value: 'jpeg', label: 'JPG',  icon: '🖼️', desc: 'الأصغر حجماً' },
  { value: 'png',  label: 'PNG',  icon: '🎨', desc: 'جودة عالية' },
  { value: 'pdf',  label: 'PDF',  icon: '📄', desc: 'جاهز للطباعة' },
]

const STEPS = [
  { label: 'رفع الصورة',              icon: '📤' },
  { label: 'إزالة الخلفية (AI)',      icon: '🤖' },
  { label: 'قص ذكي + تحسين الجودة',   icon: '✂️' },
  { label: 'توليد لوحة الطباعة',      icon: '🖨️' },
]

/* ══════════════════════════════════════════════════════════════
   Styles
   ══════════════════════════════════════════════════════════════ */
const S = {
  panel: {
    background: '#0c0e14',
    border: '1px solid #1a1f2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  } as React.CSSProperties,
  panelTitle: {
    fontSize: 11,
    fontWeight: 800,
    color: '#4a5568',
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  } as React.CSSProperties,
  chip: (active: boolean) => ({
    padding: '7px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    border: `1.5px solid ${active ? '#3b82f6' : '#1a1f2e'}`,
    background: active ? 'rgba(59,130,246,0.12)' : '#0f1119',
    color: active ? '#60a5fa' : '#6b7280',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  }),
}

export default function BiometricTool() {
  /* ── State ── */
  const [file,       setFile]       = useState<File | null>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [docType,    setDocType]    = useState('cin')
  const [bgColor,    setBgColor]   = useState('gray')
  const [layout,     setLayout]     = useState('4x2')
  const [dpi,        setDpi]        = useState(300)
  const [zoom,       setZoom]       = useState(1.0)
  const [upscale,    setUpscale]    = useState(false)
  const [format,     setFormat]     = useState('jpeg')
  const [cutGuides,  setCutGuides]  = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [stepIdx,    setStepIdx]    = useState(-1)
  const [result,     setResult]     = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [dragover,   setDragover]   = useState(false)

  // تعديل يدوي لموضع الوجه
  const [offsetX,    setOffsetX]    = useState(0)
  const [offsetY,    setOffsetY]    = useState(0)

  // معاينة فورية
  const [previewResult, setPreviewResult] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null)

  // فتح الأقسام
  const [openCategory, setOpenCategory] = useState('morocco')

  const inputRef = useRef<HTMLInputElement>(null)

  /* ── File handling ── */
  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { setError('اختر صورة صحيحة'); return }
    if (f.size > 15 * 1024 * 1024)   { setError('حجم الصورة أكبر من 15MB'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
    setResult(null)
    setPreviewResult(null)
    setOffsetX(0)
    setOffsetY(0)
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragover(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  /* ── معاينة فورية (debounced) ── */
  const triggerPreview = useCallback(() => {
    if (!file) return
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    previewTimerRef.current = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('doc_type', docType)
        fd.append('bg_color', bgColor)
        fd.append('zoom', String(zoom))
        fd.append('offset_x', String(offsetX))
        fd.append('offset_y', String(offsetY))
        const res = await fetch(`${API}/api/biometric-photo/preview`, {
          method: 'POST',
          body: fd,
        })
        if (res.ok) {
          const blob = await res.blob()
          setPreviewResult(URL.createObjectURL(blob))
        }
      } catch {
        // المعاينة اختيارية — لا نعرض خطأ
      } finally {
        setPreviewLoading(false)
      }
    }, 600)
  }, [file, docType, bgColor, zoom, offsetX, offsetY])

  // إعادة المعاينة عند تغيير الإعدادات
  useEffect(() => {
    if (file && !result) triggerPreview()
  }, [docType, bgColor, zoom, offsetX, offsetY])

  /* ── المعالجة النهائية ── */
  const handleProcess = async () => {
    if (!file) return
    setLoading(true); setError(null); setResult(null); setStepIdx(0)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('doc_type', docType)
      form.append('bg_color', bgColor)
      form.append('layout', layout)
      form.append('dpi', String(dpi))
      form.append('zoom', String(zoom))
      form.append('upscale', String(upscale))
      form.append('offset_x', String(offsetX))
      form.append('offset_y', String(offsetY))
      form.append('format', format)
      form.append('cut_guides', String(cutGuides))

      setStepIdx(1)
      const res = await fetch(`${API}/api/biometric-photo`, {
        method: 'POST',
        body: form,
      })
      setStepIdx(2)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).detail || `HTTP ${res.status}`)
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
    setFile(null); setPreview(null); setResult(null); setPreviewResult(null)
    setError(null); setStepIdx(-1); setOffsetX(0); setOffsetY(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  /* ── اسم الوثيقة الحالية ── */
  const currentDocLabel = DOC_CATEGORIES
    .flatMap(c => c.types)
    .find(t => t.value === docType)?.label || docType

  const currentFormatInfo = FORMAT_OPTIONS.find(f => f.value === format)
  const downloadExt = format === 'jpeg' ? 'jpg' : format

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 360px',
      gap: 16,
      alignItems: 'start',
      fontFamily: 'Cairo, sans-serif',
    }}>

      {/* ══════════════════════════════════════════════════════
          القسم الأيسر — منطقة العرض
          ══════════════════════════════════════════════════════ */}
      <div style={{
        background: '#0c0e14',
        border: '1px solid #1a1f2e',
        borderRadius: 20,
        overflow: 'hidden',
      }}>
        {/* شريط المعلومات */}
        <div style={{
          padding: '10px 18px',
          borderBottom: '1px solid #1a1f2e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: file ? '#10b981' : '#4b5563',
            }} />
            <span style={{ color: '#6b7280', fontWeight: 600 }}>
              {result ? '✅ جاهز للتحميل' : file ? `📋 ${currentDocLabel}` : 'في انتظار الصورة'}
            </span>
          </div>
          {file && !result && (
            <span style={{
              color: previewLoading ? '#f59e0b' : '#3b82f6',
              fontSize: 11,
              fontWeight: 600,
            }}>
              {previewLoading ? '⏳ جاري المعاينة...' : '● معاينة مباشرة'}
            </span>
          )}
        </div>

        {/* منطقة الصورة */}
        <div
          onClick={() => !result && !loading && inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragover(true) }}
          onDragLeave={() => setDragover(false)}
          style={{
            minHeight: 440,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: result || loading ? 'default' : 'pointer',
            background: dragover ? 'rgba(59,130,246,0.06)' : 'transparent',
            border: dragover ? '2px dashed #3b82f6' : '2px dashed transparent',
            borderRadius: 16,
            transition: 'all 0.3s',
            position: 'relative',
            margin: 8,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{ display: 'none' }}
          />

          {result ? (
            /* ── النتيجة النهائية ── */
            <img
              src={result}
              alt="النتيجة"
              style={{
                width: '100%',
                borderRadius: 14,
                display: 'block',
              }}
            />
          ) : file ? (
            /* ── المعاينة: الأصلية + المعاينة البيومترية ── */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              padding: 24,
              width: '100%',
              flexWrap: 'wrap',
            }}>
              {/* الصورة الأصلية */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 11, color: '#4b5563', marginBottom: 8,
                  fontWeight: 700, letterSpacing: 0.5,
                }}>
                  الصورة الأصلية
                </div>
                <img
                  src={preview!}
                  alt="الأصلية"
                  style={{
                    maxHeight: 300,
                    maxWidth: 240,
                    borderRadius: 12,
                    objectFit: 'contain',
                    border: '1px solid #1a1f2e',
                  }}
                />
                <div
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                  style={{
                    fontSize: 11, color: '#3b82f6', marginTop: 8,
                    cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  🔄 تغيير الصورة
                </div>
              </div>

              {/* سهم */}
              <div style={{ fontSize: 28, color: '#2a3040', flexShrink: 0 }}>→</div>

              {/* المعاينة البيومترية */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 11, color: '#4b5563', marginBottom: 8,
                  fontWeight: 700, letterSpacing: 0.5,
                }}>
                  المعاينة البيومترية
                </div>
                {previewResult ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={previewResult}
                      alt="معاينة"
                      style={{
                        height: 300,
                        borderRadius: 12,
                        objectFit: 'contain',
                        border: '2px solid #3b82f6',
                        boxShadow: '0 0 30px rgba(59,130,246,0.15)',
                      }}
                    />
                    {previewLoading && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: 28, height: 28,
                          border: '3px solid rgba(59,130,246,0.3)',
                          borderTopColor: '#3b82f6',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    width: 180, height: 230,
                    background: '#111318',
                    border: '2px dashed #1a1f2e',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <div style={{
                      width: 28, height: 28,
                      border: '3px solid rgba(59,130,246,0.3)',
                      borderTopColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <div style={{ fontSize: 11, color: '#4b5563' }}>جاري التحليل...</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── منطقة الرفع ── */
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{
                width: 80, height: 80,
                borderRadius: 20,
                background: 'rgba(59,130,246,0.08)',
                border: '2px dashed rgba(59,130,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: 36,
              }}>
                📸
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
                اسحب الصورة هنا
              </div>
              <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>
                أو انقر للاختيار — PNG, JPG حتى 15MB
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(8,10,16,0.9)',
              borderRadius: 14,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 24,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                width: 52, height: 52,
                border: '3px solid rgba(59,130,246,0.2)',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
                {STEPS.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    fontSize: 13, fontWeight: 600,
                    color: i < stepIdx ? '#10b981' : i === stepIdx ? '#60a5fa' : '#2a3040',
                    transition: 'color 0.3s',
                  }}>
                    <div style={{
                      width: 28, height: 28,
                      borderRadius: '50%',
                      border: `2px solid ${i < stepIdx ? '#10b981' : i === stepIdx ? '#3b82f6' : '#1a1f2e'}`,
                      background: i < stepIdx ? 'rgba(16,185,129,0.1)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, flexShrink: 0,
                      transition: 'all 0.3s',
                    }}>
                      {i < stepIdx ? '✓' : s.icon}
                    </div>
                    {s.label}
                    {i === stepIdx && (
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%',
                        border: '2px solid #3b82f6', borderTopColor: 'transparent',
                        animation: 'spin 0.6s linear infinite',
                        marginRight: 'auto',
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* أزرار النتيجة */}
        {result && (
          <div style={{
            padding: '14px 18px',
            borderTop: '1px solid #1a1f2e',
            display: 'flex', gap: 10,
          }}>
            <a
              href={result}
              download={`biometric_${docType}_${layout}.${downloadExt}`}
              style={{
                flex: 1, padding: '12px 0',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', borderRadius: 12,
                textAlign: 'center', textDecoration: 'none',
                fontSize: 14, fontWeight: 700,
                fontFamily: 'Cairo,sans-serif',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              }}
            >
              ⬇️ تحميل {currentFormatInfo?.label || 'الصورة'}
            </a>
            <button
              onClick={reset}
              style={{
                padding: '12px 18px',
                background: 'transparent',
                border: '1px solid #1a1f2e',
                color: '#6b7280', borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'Cairo,sans-serif',
                fontSize: 13, fontWeight: 600,
              }}
            >
              🔄 جديد
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          القسم الأيمن — لوحة التحكم
          ══════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── نوع الوثيقة (Accordion) ── */}
        <div style={S.panel}>
          <div style={S.panelTitle}>📋 نوع الوثيقة</div>
          {DOC_CATEGORIES.map(cat => (
            <div key={cat.id} style={{ marginBottom: 6 }}>
              <div
                onClick={() => setOpenCategory(openCategory === cat.id ? '' : cat.id)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: openCategory === cat.id ? 'rgba(59,130,246,0.06)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: openCategory === cat.id ? '#60a5fa' : '#6b7280',
                }}>
                  {cat.label}
                </span>
                <span style={{
                  fontSize: 10, color: '#4b5563',
                  transform: openCategory === cat.id ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s',
                }}>
                  ▼
                </span>
              </div>
              {openCategory === cat.id && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 4,
                  paddingRight: 8, marginTop: 4,
                }}>
                  {cat.types.map(d => (
                    <div
                      key={d.value}
                      onClick={() => setDocType(d.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: docType === d.value ? 'rgba(59,130,246,0.12)' : 'transparent',
                        border: `1.5px solid ${docType === d.value ? '#3b82f6' : 'transparent'}`,
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: docType === d.value ? '#60a5fa' : '#9ca3af',
                      }}>
                        {d.label}
                      </span>
                      <span style={{
                        fontSize: 10, color: '#4b5563',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}>
                        {d.size}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── لون الخلفية ── */}
        <div style={S.panel}>
          <div style={S.panelTitle}>🎨 لون الخلفية</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {BG_OPTIONS.map(o => (
              <div
                key={o.value}
                onClick={() => setBgColor(o.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: `1.5px solid ${bgColor === o.value ? '#3b82f6' : '#1a1f2e'}`,
                  background: bgColor === o.value ? 'rgba(59,130,246,0.08)' : '#0f1119',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 20, height: 20,
                  borderRadius: 6,
                  background: o.swatch,
                  border: o.border || '1px solid rgba(255,255,255,0.08)',
                  flexShrink: 0,
                  boxShadow: bgColor === o.value ? `0 0 8px ${o.swatch}40` : 'none',
                }} />
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: bgColor === o.value ? '#60a5fa' : '#6b7280',
                }}>
                  {o.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── تقريب الوجه (Zoom) ── */}
        <div style={S.panel}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 10,
          }}>
            <div style={S.panelTitle}>🔍 تقريب الوجه</div>
            <div style={{
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              color: '#60a5fa',
              fontWeight: 700,
            }}>
              {zoom.toFixed(1)}×
            </div>
          </div>
          <input
            type="range" min="0.5" max="1.8" step="0.1"
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#3b82f6' }}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 10, color: '#4b5563', marginTop: 4,
          }}>
            <span>أبعد</span>
            <span style={{ color: zoom === 1.0 ? '#3b82f6' : '#4b5563' }}>تلقائي ICAO</span>
            <span>أقرب</span>
          </div>
        </div>

        {/* ── تعديل يدوي لموضع الوجه ── */}
        {file && (
          <div style={S.panel}>
            <div style={S.panelTitle}>✋ تعديل موضع الوجه</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 40px 1fr',
              gridTemplateRows: 'auto 40px auto',
              gap: 4,
              width: 160,
              margin: '0 auto',
            }}>
              {/* أعلى */}
              <div />
              <button
                onClick={() => setOffsetY(prev => prev + 15)}
                style={arrowBtnStyle}
                title="تحريك لأعلى"
              >
                ▲
              </button>
              <div />
              {/* وسط */}
              <button
                onClick={() => setOffsetX(prev => prev + 15)}
                style={arrowBtnStyle}
                title="تحريك لليمين"
              >
                ◀
              </button>
              <button
                onClick={() => { setOffsetX(0); setOffsetY(0) }}
                style={{
                  ...arrowBtnStyle,
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  fontSize: 10,
                }}
                title="إعادة تعيين"
              >
                ↺
              </button>
              <button
                onClick={() => setOffsetX(prev => prev - 15)}
                style={arrowBtnStyle}
                title="تحريك لليسار"
              >
                ▶
              </button>
              {/* أسفل */}
              <div />
              <button
                onClick={() => setOffsetY(prev => prev - 15)}
                style={arrowBtnStyle}
                title="تحريك لأسفل"
              >
                ▼
              </button>
              <div />
            </div>
            <div style={{
              fontSize: 10, color: '#4b5563', textAlign: 'center', marginTop: 8,
            }}>
              X: {offsetX} | Y: {offsetY}
            </div>
          </div>
        )}

        {/* ── لوحة الطباعة ── */}
        <div style={S.panel}>
          <div style={S.panelTitle}>🖨️ لوحة الطباعة</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            marginBottom: 14,
          }}>
            {LAYOUT_OPTIONS.map(o => (
              <div
                key={o.value}
                onClick={() => setLayout(o.value)}
                style={{
                  padding: '8px 4px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: `1.5px solid ${layout === o.value ? '#3b82f6' : '#1a1f2e'}`,
                  background: layout === o.value ? 'rgba(59,130,246,0.08)' : '#0f1119',
                  transition: 'all 0.2s',
                }}
              >
                {/* Mini grid preview */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(o.cols, 4)}, 1fr)`,
                  gap: 1.5,
                  width: 28, margin: '0 auto 5px',
                }}>
                  {Array.from({ length: Math.min(o.cols * o.rows, 12) }).map((_, i) => (
                    <div key={i} style={{
                      background: layout === o.value ? '#3b82f6' : '#2a3040',
                      borderRadius: 1,
                      aspectRatio: '35/45',
                      opacity: 0.7,
                    }} />
                  ))}
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700,
                  color: layout === o.value ? '#60a5fa' : '#4b5563',
                }}>
                  {o.label}
                </div>
                <div style={{
                  fontSize: 9, color: '#4b5563', marginTop: 1,
                }}>
                  {o.sub}
                </div>
              </div>
            ))}
          </div>

          {/* DPI */}
          <div style={{ ...S.panelTitle, marginTop: 4 }}>📐 دقة الطباعة (DPI)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[150, 300, 600].map(d => (
              <div
                key={d}
                onClick={() => setDpi(d)}
                style={{
                  flex: 1, padding: '7px 0',
                  borderRadius: 8, cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: 12, fontWeight: 700,
                  border: `1.5px solid ${dpi === d ? '#3b82f6' : '#1a1f2e'}`,
                  background: dpi === d ? 'rgba(59,130,246,0.08)' : '#0f1119',
                  color: dpi === d ? '#60a5fa' : '#4b5563',
                  fontFamily: 'JetBrains Mono, monospace',
                  transition: 'all 0.2s',
                }}
              >
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* ── صيغة التحميل ── */}
        <div style={S.panel}>
          <div style={S.panelTitle}>💾 صيغة التحميل</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {FORMAT_OPTIONS.map(f => (
              <div
                key={f.value}
                onClick={() => setFormat(f.value)}
                style={{
                  flex: 1,
                  padding: '10px 6px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: `1.5px solid ${format === f.value ? '#3b82f6' : '#1a1f2e'}`,
                  background: format === f.value ? 'rgba(59,130,246,0.08)' : '#0f1119',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 4 }}>{f.icon}</div>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: format === f.value ? '#60a5fa' : '#6b7280',
                }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 9, color: '#4b5563', marginTop: 2 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── خيارات إضافية ── */}
        <div style={S.panel}>
          {/* 4K Upscale */}
          <div
            onClick={() => setUpscale(!upscale)}
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: upscale ? '#f59e0b' : '#6b7280',
              }}>
                ✨ تحسين الجودة 4K
              </div>
              <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>
                يضيف ~20 ثانية للمعالجة
              </div>
            </div>
            <ToggleSwitch active={upscale} color="#f59e0b" />
          </div>

          {/* خطوط القص */}
          <div
            onClick={() => setCutGuides(!cutGuides)}
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', cursor: 'pointer',
            }}
          >
            <div>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: cutGuides ? '#10b981' : '#6b7280',
              }}>
                ✂️ خطوط القص
              </div>
              <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>
                علامات لتسهيل القص بالمقص
              </div>
            </div>
            <ToggleSwitch active={cutGuides} color="#10b981" />
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5',
            padding: '12px 14px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── زر المعالجة ── */}
        <button
          onClick={handleProcess}
          disabled={!file || loading}
          style={{
            width: '100%',
            padding: 15,
            borderRadius: 14,
            border: 'none',
            background: !file || loading
              ? '#111318'
              : 'linear-gradient(135deg, #3b82f6, #6366f1)',
            color: !file || loading ? '#2a3040' : 'white',
            fontFamily: 'Cairo, sans-serif',
            fontSize: 15,
            fontWeight: 800,
            cursor: !file || loading ? 'not-allowed' : 'pointer',
            boxShadow: !file || loading
              ? 'none'
              : '0 4px 24px rgba(59,130,246,0.35)',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 18, height: 18,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              جاري المعالجة...
            </>
          ) : (
            '✨ معالجة الصورة'
          )}
        </button>

      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/* ── مكونات مساعدة ── */

function ToggleSwitch({ active, color }: { active: boolean; color: string }) {
  return (
    <div style={{
      width: 42, height: 24,
      borderRadius: 12,
      background: active ? color : '#1a1f2e',
      position: 'relative',
      transition: 'all 0.3s',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute',
        top: 3, width: 18, height: 18,
        borderRadius: '50%',
        background: 'white',
        transition: 'left 0.3s',
        left: active ? 21 : 3,
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </div>
  )
}

const arrowBtnStyle: React.CSSProperties = {
  width: 40, height: 40,
  borderRadius: 10,
  border: '1px solid #1a1f2e',
  background: '#0f1119',
  color: '#6b7280',
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'inherit',
  transition: 'all 0.15s',
}
