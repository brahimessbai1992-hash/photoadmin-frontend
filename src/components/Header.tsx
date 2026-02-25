'use client'
import { useEffect, useState } from 'react'
import { checkHealth } from '@/lib/api'

export default function Header() {
  const [status, setStatus] = useState<'checking'|'online'|'offline'>('checking')

  useEffect(() => {
    checkHealth()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'))
  }, [])

  const dotColor = { checking: '#6b7280', online: '#10b981', offline: '#ef4444' }[status]
  const label    = { checking: 'جاري الفحص...', online: 'API متصل ✓', offline: 'API غير متاح' }[status]

  return (
    <header style={{ borderBottom: '1px solid #252a35', background: 'rgba(10,12,16,0.85)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🪪</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg,#e8eaf0,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PhotoAdmin</div>
            <div style={{ fontSize: 10, color: '#6b7280', fontFamily: 'JetBrains Mono,monospace', letterSpacing: 1 }}>BIOMETRIC PLATFORM v1.0</div>
          </div>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#9ca3af', background: '#111318', border: '1px solid #252a35', padding: '6px 14px', borderRadius: 999, fontFamily: 'JetBrains Mono,monospace' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, boxShadow: status === 'online' ? `0 0 6px ${dotColor}` : 'none', animation: status === 'online' ? 'pulse-dot 2s infinite' : 'none' }} />
          {label}
        </div>

      </div>
    </header>
  )
}
