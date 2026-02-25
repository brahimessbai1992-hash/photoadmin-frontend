import Header from '@/components/Header'
import BiometricTool from '@/components/BiometricTool'

const COMING_SOON = [
  { icon: '👨‍👩‍👧', title: 'بطاقة العائلة', desc: 'Illustrator → SVG → PDF جاهز للطباعة' },
  { icon: '🏥',      title: 'بطاقة CNSS',   desc: 'Photoshop PSD → معالجة تلقائية → طباعة PVC' },
]

export default function Home() {
  return (
    <>
      <Header />

      <main style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

          {/* ── Hero ────────────────────────────────────────────────────── */}
          <section style={{ padding: '60px 0 44px', textAlign: 'center' }}>
            <div className="animate-fade-down" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', padding: '6px 16px', borderRadius: 999, fontSize: 13, marginBottom: 24 }}>
              ✨ مدعوم بـ Fal.ai BiRefNet Portrait AI
            </div>

            <h1 className="animate-fade-down" style={{ fontSize: 'clamp(26px,5vw,50px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 14 }}>
              أتمتة البطاقات الإدارية<br />
              <span style={{ background: 'linear-gradient(135deg,#3b82f6,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                بسرعة وبجودة احترافية
              </span>
            </h1>

            <p className="animate-fade-down" style={{ fontSize: 16, color: '#9ca3af', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
              منصة متكاملة لمعالجة الصور البيومترية، بطاقات العائلة، وبطاقات CNSS في ثوانٍ معدودة.
            </p>
          </section>

          {/* ── Tabs ────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32, background: '#111318', border: '1px solid #252a35', padding: 6, borderRadius: 20, width: 'fit-content', margin: '0 auto 32px' }}>
            {/* Active tab */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 14, background: '#3b82f6', color: 'white', fontSize: 14, fontWeight: 600, boxShadow: '0 4px 16px rgba(59,130,246,0.4)' }}>
              📸 الصور البيومترية
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 7px', borderRadius: 999, fontSize: 10 }}>متاح</span>
            </div>
            {COMING_SOON.map(cs => (
              <div key={cs.title} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 14, color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'default' }}>
                {cs.icon} {cs.title}
                <span style={{ background: '#181c24', border: '1px solid #252a35', padding: '1px 7px', borderRadius: 999, fontSize: 10 }}>قريباً</span>
              </div>
            ))}
          </div>

          {/* ── Biometric Tool ──────────────────────────────────────────── */}
          <BiometricTool />

          {/* ── Coming Soon Cards ───────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 64 }}>
            {COMING_SOON.map(cs => (
              <div key={cs.title} style={{ background: '#111318', border: '1px solid #252a35', borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.4 }}>{cs.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{cs.title} — قريباً</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{cs.desc}</div>
              </div>
            ))}
          </div>

        </div>
      </main>

      <footer style={{ borderTop: '1px solid #252a35', padding: 24, textAlign: 'center', fontSize: 12, color: '#4b5563', fontFamily: 'JetBrains Mono,monospace' }}>
        PhotoAdmin Platform © 2025 — Powered by Fal.ai BiRefNet AI
      </footer>
    </>
  )
}
