import { useState } from 'react';
import { Card, Button } from '../components/index.jsx';
import { PDPA_TEXT_FALLBACK } from '../lib/consent.js';

// Shown to a member whose accepted consent_version has fallen behind the
// currently active 008_consent row — not a hard block (they can still
// close this and keep viewing existing data), just the re-consent prompt
// itself. What actually gets gated (adding/editing data, earning points)
// lives at each individual write action, driven by the same needsConsent
// flag this modal is shown for.
export function ConsentUpdateModal({ activeConsent, saving, error, onAccept, onClose }) {
  const [checked, setChecked] = useState(false);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 20, padding: '24px 22px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ font: '800 20px var(--font-display)', color: 'var(--text-heading)', textAlign: 'center' }}>นโยบายความเป็นส่วนตัวมีการปรับปรุง</div>
        <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
          กรุณาอ่านและกดยอมรับเงื่อนไขใหม่ ({activeConsent?.consent_version}) เพื่อใช้งานฟีเจอร์บันทึกข้อมูล/สะสมแต้มต่อได้
        </div>

        <Card style={{ marginTop: 16 }}>
          <p style={{ font: 'var(--type-body)', color: 'var(--text-body)', lineHeight: 1.7, margin: 0 }}>
            {activeConsent?.pdpa_text || PDPA_TEXT_FALLBACK}
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: 'var(--color-primary)', cursor: 'pointer', flex: 'none' }}
            />
            <span style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>
              ฉันยอมรับเงื่อนไขและนโยบายความเป็นส่วนตัวฉบับใหม่
            </span>
          </label>
        </Card>

        {error && <div style={{ font: 'var(--type-caption)', color: '#dc2626', marginTop: 10 }}>{error}</div>}

        <div style={{ marginTop: 16 }}>
          <Button variant="primary" fullWidth disabled={!checked} loading={saving} onClick={onAccept}>ยืนยัน</Button>
        </div>
        <button
          onClick={onClose}
          style={{ marginTop: 10, width: '100%', border: 'none', background: 'transparent', font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 0' }}
        >
          ไว้ทีหลัง (ยังดูข้อมูลเดิมได้ แต่บันทึก/สะสมแต้มใหม่ไม่ได้)
        </button>
      </div>
    </div>
  );
}
