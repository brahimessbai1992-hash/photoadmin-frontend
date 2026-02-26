'use client'
import { useState, useRef } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const FIELDS_HUSBAND = [
  { key: 'husband_name_ar',     label: 'الاسم الكامل بالعربية',  placeholder: 'محمد السباعي',              dir: 'rtl' },
  { key: 'husband_name_fr',     label: 'NOM COMPLET',             placeholder: 'MOHAMED ES-SBAI',           dir: 'ltr' },
  { key: 'husband_cnie',        label: 'رقم البطاقة الوطنية',     placeholder: 'ZT204383',                  dir: 'ltr' },
  { key: 'husband_birth_date',  label: 'تاريخ الازدياد',          placeholder: '25/06/1985',                dir: 'ltr' },
  { key: 'husband_birth_place', label: 'مكان الازدياد',           placeholder: 'فناسة باب الحيط تاونات',   dir: 'rtl' },
  { key: 'husband_reg_num',     label: 'رقم التسجيل',             placeholder: '80',                        dir: 'ltr' },
]

const FIELDS_WIFE = [
  { key: 'wife_name_ar',     label: 'الاسم الكامل بالعربية',  placeholder: 'كريمة احميطوش',            dir: 'rtl' },
  { key: 'wife_name_fr',     label: 'NOM COMPLET',             placeholder: 'KARIMA HMITOUCH',           dir: 'ltr' },
  { key: 'wife_cnie',        label: 'رقم البطاقة الوطنية',     placeholder: 'ZT304054',                  dir: 'ltr' },
  { key: 'wife_birth_date',  label: 'تاريخ الازدياد',          placeholder: '24/09/1990',                dir: 'ltr' },
  { key: 'wife_birth_place', label: 'مكان الازدياد',           placeholder: 'فناسة باب الحيط تاونات',   dir: 'rtl' },
  { key: 'wife_reg_num',     label: 'رقم التسجيل',             placeholder: '296',                       dir: 'ltr' },
]

const FIELDS_COMMON = [
  { key: 'phone',            label: 'رقم الهاتف',              placeholder: '0660550825',                dir: 'ltr' },
  { key: 'address_ar',       label: 'العنوان بالعربية',         placeholder: 'دوار مشروان فناسة باب الحيط تاونات', dir: 'rtl' },
  { key: 'address_fr',       label: 'Adresse',                  placeholder: 'DR MECHROUANE TAOUNATE',    dir: 'ltr' },
  { key: 'reg_num_1',        label: 'رقم التسجيل 1',            placeholder: '997191918',                 dir: 'ltr' },
  { key: 'reg_num_2',        label: 'رقم التسجيل 2',            placeholder: '012345678',                 dir: 'ltr' },
  { key: 'card_ref',         label: 'مرجع البطاقة',             placeholder: 'BES-BCP25',                 dir: 'ltr' },
  { key: 'google_drive_url', label: 'رابط Google Drive (QR)',   placeholder: 'https://drive.google.com/...', dir: 'ltr' },
]

const STEPS = [
  'رفع البيانات',
  'معالجة الصورة البيومترية',
  'توليد QR Code',
  'كتابة البيانات على البطاقة',
  'تصدير JPG',
]

const s: Record<string, React.CSSProperties> = {
  wrap:     { maxWidth: 960, margin: '0 auto', padding: 24, fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
  title:    { fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6b7280', marginBottom: 28 },
  grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  section:  { background: '#111318', border: '1px solid #1e2330', borderRadius: 16, padding: 20, marginBottom: 16 },
  secTitle: { fontSize: 12, fontWeight: 800, color: '#6b7280', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' },
  label:    { display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 5 },
  input:    { width: '100%', background: '#181c24', border: '1px solid #252a35', borderRadius: 10, padding: '9px 12px',
              color: '#f3f4f6', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const },
  photoBox: { border: '2px dashed #252a35', borderRadius: 14, padding: 20, textAlign: 'center' as const,
              cursor: 'pointer', transition: 'all 0.2s' },
  btn:      { width: '100%', padding: 15, borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 800,
              fontFamily: 'Cairo, sans-serif', cursor: 'pointer', marginTop: 8 },
  result:   { background: '#0d1117', border: '1px solid #10b981', borderRadius: 16, padding: 20, textAlign: 'center' as const },
  error:    { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 12 },
}

export default function FamilyCardTool() {
  const [photo,    setPhoto]    = useState<File | null>(null)
  const [preview,  setPreview]  = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [stepIdx,  setStepIdx]  = useState(-1)
  const [result,   setResult]   = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [data,     setData]     = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: string) => setData(d => ({ ...d, [k]: v }))

  const handlePhoto = (f: File) => {
    setPhoto(f); setPreview(URL.createObjectURL(f)); setError(null)
  }

  const handleSubmit = async () => {
    if (!photo) { setError('الرجاء رفع صورة الزوج'); return }
    setLoading(true); setError(null); setResult(null); setStepIdx(0)
    try {
      const form = new FormData()
      form.append('photo', photo)
      for (const k of [...FIELDS_HUSBAND, ...FIELDS_WIFE, ...FIELDS_COMMON])
        form.append(k.key, data[k.key] || '')

      setStepIdx(1)
      const res = await fetch(`${API}/api/family-card`, { method: 'POST', body: form })
      setStepIdx(3)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      setStepIdx(4)
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

  const InputField = ({ field }: { field: typeof FIELDS_HUSBAND[0] }) => (
    <div>
      <label style={s.label}>{field.label}</label>
      <input
        style={{ ...s.input, direction: field.dir as 'rtl' | 'ltr', textAlign: field.dir === 'rtl' ? 'right' : 'left' }}
        placeholder={field.placeholder}
        value={data[field.key] || ''}
        onChange={e => set(field.key, e.target.value)}
      />
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.title}>🪪 البطاقة العائلية</div>
      <div style={s.subtitle}>أدخل البيانات وارفع صورة الزوج لتوليد البطاقة تلقائياً</div>

      {error && <div style={s.error}>⚠️ {error}</div>}

      {/* صورة الزوج */}
      <div style={s.section}>
        <div style={s.secTitle}>📷 صورة الزوج الشخصية</div>
        <div
          style={{ ...s.photoBox, borderColor: preview ? '#3b82f6' : '#252a35' }}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); e.dataTransfer.files?.[0] && handlePhoto(e.dataTransfer.files[0]) }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
          {preview
            ? <img src={preview} alt="preview" style={{ maxHeight: 140, borderRadius: 10, objectFit: 'contain' }} />
            : <div>
                <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>👤</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>اسحب الصورة أو انقر للاختيار</div>
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>ستُعالَج بيومترياً تلقائياً</div>
              </div>}
        </div>
      </div>

      {/* بيانات الزوج */}
      <div style={s.section}>
        <div style={s.secTitle}>👨 بيانات الزوج — Époux</div>
        <div style={s.grid2}>
          {FIELDS_HUSBAND.map(f => <InputField key={f.key} field={f} />)}
        </div>
      </div>

      {/* بيانات الزوجة */}
      <div style={s.section}>
        <div style={s.secTitle}>👩 بيانات الزوجة — Épouse</div>
        <div style={s.grid2}>
          {FIELDS_WIFE.map(f => <InputField key={f.key} field={f} />)}
        </div>
      </div>

      {/* بيانات مشتركة */}
      <div style={s.section}>
        <div style={s.secTitle}>📋 بيانات مشتركة — Informations communes</div>
        <div style={s.grid2}>
          {FIELDS_COMMON.map(f => <InputField key={f.key} field={f} />)}
        </div>
      </div>

      {/* زر التوليد */}
      {loading ? (
        <div style={{ ...s.section, padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
                color: i < stepIdx ? '#10b981' : i === stepIdx ? '#60a5fa' : '#4b5563' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid currentColor',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                {step}
                {i === stepIdx && (
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #3b82f6',
                    borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', marginRight: 'auto' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button onClick={handleSubmit}
          style={{ ...s.btn, background: photo ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : '#1e2330',
            color: photo ? 'white' : '#4b5563',
            boxShadow: photo ? '0 4px 20px rgba(59,130,246,0.3)' : 'none' }}>
          ✨ توليد البطاقة العائلية
        </button>
      )}

      {/* النتيجة */}
      {result && (
        <div style={{ ...s.result, marginTop: 16 }}>
          <img src={result} alt="البطاقة العائلية" style={{ width: '100%', borderRadius: 12, marginBottom: 16 }} />
          <a href={result} download="بطاقة_عائلية.jpg"
            style={{ display: 'inline-block', padding: '12px 32px', background: '#10b981', color: 'white',
              borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            ⬇️ تحميل البطاقة
          </a>
        </div>
      )}
    </div>
  )
}
