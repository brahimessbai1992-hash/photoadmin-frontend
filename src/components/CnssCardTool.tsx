'use client'
import { useState, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type FormData = {
  reg_num:    string
  nom_ar:     string
  prenom_ar:  string
  birth_date: string
  cin:        string
  reg_date:   string
  nom_fr:     string
  prenom_fr:  string
}

const INITIAL: FormData = {
  reg_num:    '',
  nom_ar:     '',
  prenom_ar:  '',
  birth_date: '',
  cin:        '',
  reg_date:   '',
  nom_fr:     '',
  prenom_fr:  '',
}

const FIELDS: { key: keyof FormData; label: string; label_fr: string; placeholder: string; dir: 'rtl' | 'ltr' }[] = [
  { key: 'reg_num',    label: 'رقم التسجيل',         label_fr: 'N° d\'immatriculation', placeholder: '906280021',    dir: 'ltr' },
  { key: 'nom_ar',     label: 'الاسم العائلي (عربي)', label_fr: 'Nom (arabe)',           placeholder: 'اكعبون',       dir: 'rtl' },
  { key: 'nom_fr',     label: 'Nom (français)',        label_fr: 'Nom',                   placeholder: 'AKAABOUNE',    dir: 'ltr' },
  { key: 'prenom_ar',  label: 'الاسم الشخصي (عربي)',  label_fr: 'Prénom (arabe)',         placeholder: 'علي',         dir: 'rtl' },
  { key: 'prenom_fr',  label: 'Prénom (français)',     label_fr: 'Prénom',                placeholder: 'ALI',          dir: 'ltr' },
  { key: 'birth_date', label: 'تاريخ الازدياد',        label_fr: 'Date de naissance',     placeholder: '01-01-1970',   dir: 'ltr' },
  { key: 'cin',        label: 'رقم ب.ت.و',             label_fr: 'C.I.N',                 placeholder: 'C297428',      dir: 'ltr' },
  { key: 'reg_date',   label: 'تاريخ التسجيل',         label_fr: 'Date d\'immatriculation', placeholder: '08-02-2026', dir: 'ltr' },
]

const css: Record<string, React.CSSProperties> = {
  wrap:    { maxWidth: 860, margin: '0 auto', padding: 24, fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
  title:   { fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 },
  sub:     { fontSize: 13, color: '#6b7280', marginBottom: 28 },
  grid2:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  section: { background: '#111318', border: '1px solid #1e2330', borderRadius: 16, padding: 20, marginBottom: 16 },
  secHdr:  { fontSize: 12, fontWeight: 800, color: '#6b7280', letterSpacing: 1, marginBottom: 14 },
  label:   { display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 5 },
  input:   {
    width: '100%', background: '#181c24', border: '1px solid #252a35', borderRadius: 10,
    padding: '9px 12px', color: '#f3f4f6', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  },
  btn:     {
    width: '100%', padding: 15, borderRadius: 14, border: 'none', fontSize: 15,
    fontWeight: 800, fontFamily: 'Cairo, sans-serif', cursor: 'pointer', marginTop: 8,
  },
  err:     {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5', padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 12,
  },
  result:  {
    background: '#0d1117', border: '1px solid #10b981', borderRadius: 16, padding: 20,
    textAlign: 'center' as const, marginTop: 16,
  },
  preview: {
    background: '#0a0e16', border: '1px solid #252a35', borderRadius: 14,
    padding: 20, marginBottom: 16,
  },
  previewCard: {
    background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)',
    borderRadius: 12, padding: '20px 28px', color: '#1a3c78', fontFamily: 'Cairo, sans-serif',
  },
}

export default function CnssCardTool() {
  const [form,    setForm]    = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [stepIdx, setStepIdx] = useState(-1)
  const [result,  setResult]  = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const handleChange = useCallback(
    (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
    []
  )

  const isReady = form.reg_num && form.nom_ar && form.prenom_ar && form.birth_date && form.cin && form.reg_date

  const handleSubmit = async () => {
    if (!isReady) { setError('الرجاء ملء جميع الحقول الإلزامية'); return }
    setLoading(true); setError(null); setResult(null); setStepIdx(0)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v as string))
      setStepIdx(1)
      const res = await fetch(`${API}/api/cnss-card`, { method: 'POST', body: fd })
      setStepIdx(2)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).detail || `HTTP ${res.status}`)
      }
      setStepIdx(3)
      const blob = await res.blob()
      setResult(URL.createObjectURL(blob))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطأ غير متوقع')
    } finally {
      setLoading(false); setStepIdx(-1)
    }
  }

  const STEPS = ['إرسال البيانات', 'توليد البطاقة', 'معالجة الصورة', 'تصدير JPEG']

  return (
    <div style={css.wrap}>
      <div style={css.title}>🏥 بطاقة CNSS — AMO TADAMON</div>
      <div style={css.sub}>أدخل بيانات المستفيد لتوليد شهادة التسجيل تلقائياً</div>

      {error && <div style={css.err}>⚠️ {error}</div>}

      {/* معاينة مباشرة */}
      {(form.reg_num || form.nom_ar) && (
        <div style={css.preview}>
          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 10, letterSpacing: 1 }}>معاينة مباشرة</div>
          <div style={css.previewCard}>
            <div style={{ fontSize: 11, color: '#1a3c78', fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
              AMO TADAMON
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#20b2aa', textAlign: 'center', letterSpacing: 3, marginBottom: 12 }}>
              {form.reg_num || '_ _ _ _ _ _ _ _ _'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12 }}>
              <span style={{ color: '#6b7280' }}>الاسم العائلي:</span>
              <span style={{ color: '#20b2aa', fontWeight: 700, direction: 'rtl' }}>{form.nom_ar || '—'}</span>
              <span style={{ color: '#6b7280' }}>الاسم الشخصي:</span>
              <span style={{ color: '#20b2aa', fontWeight: 700, direction: 'rtl' }}>{form.prenom_ar || '—'}</span>
              <span style={{ color: '#6b7280' }}>تاريخ الازدياد:</span>
              <span style={{ color: '#20b2aa', fontWeight: 700 }}>{form.birth_date || '—'}</span>
              <span style={{ color: '#6b7280' }}>ب.ت.و:</span>
              <span style={{ color: '#20b2aa', fontWeight: 700 }}>{form.cin || '—'}</span>
              <span style={{ color: '#6b7280' }}>تاريخ التسجيل:</span>
              <span style={{ color: '#20b2aa', fontWeight: 700 }}>{form.reg_date || '—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* الحقول */}
      <div style={css.section}>
        <div style={css.secHdr}>📋 بيانات المستفيد — Informations du bénéficiaire</div>
        <div style={css.grid2}>
          {FIELDS.map(f => (
            <div key={f.key}>
              <label style={css.label}>{f.label}</label>
              <input
                style={{
                  ...css.input,
                  direction: f.dir,
                  textAlign: f.dir === 'rtl' ? 'right' : 'left',
                }}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={handleChange(f.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* زر التوليد أو شريط التقدم */}
      {loading ? (
        <div style={{ ...css.section, padding: 24 }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, textAlign: 'center' }}>
            جاري توليد البطاقة...
          </div>
          {STEPS.map((step, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, marginBottom: 10,
              color: i < stepIdx ? '#10b981' : i === stepIdx ? '#60a5fa' : '#4b5563',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', border: '2px solid currentColor',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, flexShrink: 0,
              }}>
                {i < stepIdx ? '✓' : i + 1}
              </div>
              {step}
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          style={{
            ...css.btn,
            background: isReady
              ? 'linear-gradient(135deg, #0d9488, #0891b2)'
              : '#1e2330',
            color: isReady ? 'white' : '#4b5563',
            boxShadow: isReady ? '0 4px 20px rgba(13,148,136,0.35)' : 'none',
          }}
        >
          🏥 توليد بطاقة CNSS
        </button>
      )}

      {/* النتيجة */}
      {result && (
        <div style={css.result}>
          <div style={{ fontSize: 13, color: '#10b981', marginBottom: 12, fontWeight: 700 }}>
            ✅ تم توليد البطاقة بنجاح
          </div>
          <img
            src={result}
            alt="بطاقة CNSS"
            style={{ width: '100%', borderRadius: 12, marginBottom: 16, border: '1px solid #1e2330' }}
          />
          <a
            href={result}
            download="بطاقة_CNSS_AMO_TADAMON.jpg"
            style={{
              display: 'inline-block', padding: '12px 32px',
              background: '#0d9488', color: 'white', borderRadius: 10,
              textDecoration: 'none', fontWeight: 700, fontSize: 14,
            }}
          >
            ⬇️ تحميل البطاقة
          </a>
        </div>
      )}
    </div>
  )
}
