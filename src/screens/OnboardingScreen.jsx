import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/index.jsx';
import { supabase } from '../lib/supabase.js';
import { recommendSize } from './TrackerScreen.jsx';
import { computeStage, PREGNANCY_STAGE } from '../lib/stage.js';

const inputStyle = {
  width: '100%', height: 46, padding: '0 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)', font: 'var(--type-body)', color: 'var(--text-body)',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
};

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ font: 'var(--type-label)', color: 'var(--text-title)', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function StepWelcome({ onNext }) {
  const BULLETS = [
    'ติดตามพัฒนาการลูก',
    'แนะนำไซส์ผ้าอ้อม',
    'สะสมแต้มและรางวัล',
    'โปรโมชันเฉพาะสมาชิก',
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 32px', gap: 24 }}>
      <img src="/paopao-logo.png" alt="PAO PAO CLUB" style={{ width: 140, height: 140, objectFit: 'contain' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ font: '800 28px var(--font-display)', color: 'var(--text-heading)' }}>PAO PAO CLUB</div>
        <div style={{ font: 'var(--weight-medium) 15px var(--font-base)', color: 'var(--text-muted)', marginTop: 6 }}>แอปคู่ใจคุณแม่มือใหม่</div>
      </div>
      <Card style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {BULLETS.map((b) => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 13px var(--font-base)', flex: 'none' }}>✓</span>
              <span style={{ font: 'var(--weight-medium) 15px var(--font-base)', color: 'var(--text-body)' }}>{b}</span>
            </div>
          ))}
        </div>
      </Card>
      <Button variant="primary" fullWidth size="lg" onClick={onNext}>เริ่มต้น</Button>
    </div>
  );
}

const PDPA_VERSION_FALLBACK = 'v1';
const PDPA_TEXT_FALLBACK = 'เราจะเก็บข้อมูลของคุณเพื่อให้บริการที่ดีขึ้น ข้อมูลจะไม่ถูกเปิดเผยต่อบุคคลที่สาม และจะถูกจัดเก็บอย่างปลอดภัยตามมาตรฐาน PDPA';

function StepPDPA({ onAccept, pdpaText, version }) {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '32px 24px', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ font: '800 22px var(--font-display)', color: 'var(--text-heading)' }}>นโยบายความเป็นส่วนตัว</div>
      </div>
      <Card>
        <p style={{ font: 'var(--type-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
          {pdpaText || PDPA_TEXT_FALLBACK}
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{ width: 20, height: 20, accentColor: 'var(--color-primary)', cursor: 'pointer', flex: 'none' }}
          />
          <span style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>
            ฉันยอมรับเงื่อนไขและนโยบายความเป็นส่วนตัว
          </span>
        </label>
      </Card>
      <Button variant="primary" fullWidth disabled={!checked} onClick={() => onAccept({ accepted: true, at: new Date().toISOString(), version: version || PDPA_VERSION_FALLBACK })}>ยืนยัน</Button>
    </div>
  );
}

function SegmentPicker({ onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '32px 24px', gap: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ font: '800 22px var(--font-display)', color: 'var(--text-heading)' }}>เลือกสถานะ</div>
        <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginTop: 6 }}>เพื่อให้เปาเปาดูแลคุณและลูกน้อยได้ตรงจุดขึ้น</div>
      </div>
      <Card interactive onClick={() => onPick('A')} style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
        <span style={{ fontSize: 36 }}>🤰</span>
        <div>
          <div style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>เตรียมต้อนรับลูกน้อย</div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 3 }}>ติดตามข้อมูลการตั้งครรภ์และเตรียมความพร้อมสำหรับคุณพ่อคุณแม่</div>
        </div>
      </Card>
      <Card interactive onClick={() => onPick('B')} style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
        <span style={{ fontSize: 36 }}>👶</span>
        <div>
          <div style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>มีลูกแล้ว</div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 3 }}>ติดตามพัฒนาการและการดูแลลูกน้อย</div>
        </div>
      </Card>
      <button
        onClick={() => onPick('C')}
        style={{ border: 'none', background: 'transparent', font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px 0', textDecoration: 'underline' }}
      >
        ข้าม ลงทะเบียนภายหลัง
      </button>
    </div>
  );
}

function SegmentForm({ segment, lineProfile, onSubmit, loading }) {
  const [motherName, setMotherName] = useState(lineProfile?.displayName ?? '');
  const [edd, setEdd] = useState('');
  const [childName, setChildName] = useState('');
  const [childGender, setChildGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');

  const canSubmitA = motherName && edd;
  const canSubmitB = motherName && childName && childGender && birthdate && weightKg && heightCm;

  const handleSubmit = () => {
    if (segment === 'A') onSubmit({ motherName, edd });
    else if (segment === 'B') onSubmit({ motherName, childName, childGender, birthdate, weightKg: parseFloat(weightKg), heightCm: parseFloat(heightCm) });
    else onSubmit({});
  };

  if (segment === 'C') {
    return (
      <div style={{ padding: '32px 24px' }}>
        <Card style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐣</div>
          <div style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>ยินดีต้อนรับ!</div>
          <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>คุณสามารถสมัครเป็นสมาชิกเต็มรูปแบบ<br />ได้ในภายหลังที่หน้าโปรไฟล์</div>
        </Card>
        <div style={{ marginTop: 20 }}>
          <Button variant="primary" fullWidth onClick={handleSubmit} loading={loading}>เข้าสู่แอป</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 24px 32px', overflowY: 'auto' }}>
      <div style={{ font: '800 20px var(--font-display)', color: 'var(--text-heading)', marginBottom: 20 }}>
        {segment === 'A' ? '🤰 ข้อมูลของคุณแม่' : '👶 ข้อมูลลูกน้อย'}
      </div>

      <FormField label="ชื่อคุณแม่">
        <input type="text" value={motherName} onChange={(e) => setMotherName(e.target.value)} style={inputStyle} placeholder="ชื่อ-นามสกุล" />
      </FormField>

      {segment === 'A' && (
        <FormField label="กำหนดคลอด (EDD)">
          <input type="date" value={edd} onChange={(e) => setEdd(e.target.value)} style={inputStyle} />
        </FormField>
      )}

      {segment === 'B' && (
        <>
          <FormField label="ชื่อลูกน้อย">
            <input type="text" value={childName} onChange={(e) => setChildName(e.target.value)} style={inputStyle} placeholder="ชื่อเล่น" />
          </FormField>
          <FormField label="เพศลูก">
            <div style={{ display: 'flex', gap: 12 }}>
              {[{ val: 'male', label: '👦 ชาย' }, { val: 'female', label: '👧 หญิง' }].map(({ val, label }) => (
                <label key={val} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: `2px solid ${childGender === val ? 'var(--color-primary)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', background: childGender === val ? 'var(--surface-soft)' : '#fff' }}>
                  <input type="radio" name="gender" value={val} checked={childGender === val} onChange={() => setChildGender(val)} style={{ accentColor: 'var(--color-primary)' }} />
                  <span style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>{label}</span>
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="วันเกิดลูก">
            <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} style={inputStyle} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="น้ำหนัก (กก.)">
              <input type="number" step="0.1" placeholder="เช่น 3.5" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} style={inputStyle} />
            </FormField>
            <FormField label="ส่วนสูง (ซม.)">
              <input type="number" step="0.1" placeholder="เช่น 50.0" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} style={inputStyle} />
            </FormField>
          </div>
        </>
      )}

      <div style={{ marginTop: 8 }}>
        <Button
          variant="primary"
          fullWidth
          disabled={segment === 'A' ? !canSubmitA : !canSubmitB}
          loading={loading}
          onClick={handleSubmit}
        >
          บันทึกและเริ่มใช้งาน
        </Button>
      </div>
    </div>
  );
}

export default function OnboardingScreen({ lineProfile, initialSegment, onComplete }) {
  // PDPA consent is required regardless of entry point — even the Home-screen
  // shortcut buttons that pre-pick a segment must still pass through it.
  const [step, setStep] = useState(initialSegment ? 'pdpa' : 'welcome');
  const [segment, setSegment] = useState(initialSegment ?? null);
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(null);
  const [pdpaDoc, setPdpaDoc] = useState(null);

  // 008_consent is Dev B's catalog of policy versions (is_active flags the
  // current one). Falls back to the hardcoded text/version if empty/unset —
  // it's empty as of this writing, so this is untested against real rows.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('008_consent').select('consent_version, pdpa_text')
          .eq('is_active', true).limit(1).single();
        if (alive && data) setPdpaDoc(data);
      } catch (e) { /* fall back to hardcoded text/version */ }
    })();
    return () => { alive = false; };
  }, []);

  const handlePickSegment = (seg) => {
    setSegment(seg);
    // Guests (segment C) give us no personal data, so there's nothing to
    // consent to yet — skip PDPA and go straight to the "enter app" screen.
    // Segments A/B are about to submit real personal data, so they must
    // pass through PDPA first.
    setStep(seg === 'C' ? 'form' : 'pdpa');
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      // Use real LINE userId if available, otherwise generate a unique fallback
      const cachedUid = localStorage.getItem('pp_line_uid');
      const lineUserId = lineProfile?.userId
        ?? (cachedUid && cachedUid !== 'dev_user_001' ? cachedUid : null)
        ?? `anon_${Date.now()}`;

      // `role` on 001_users is an account privilege tier (guest/member/staff/admin),
      // NOT our onboarding segment. Segment C ("skip for now") stays a guest;
      // completing segment A or B makes them a member. Whether the account is
      // pregnant vs. already has a child is derived from children.is_pregnant,
      // not stored on the user at all — see ProfileScreen/HomeScreen.
      const userPayload = {
        line_uid: lineUserId,
        display_name: lineProfile?.displayName ?? '',
        picture_url: lineProfile?.pictureUrl ?? null,
        email: lineProfile?.email ?? null,
        role: segment === 'C' ? 'guest' : 'member',
        parent_name: formData.motherName ?? null,
        // Guests never see the PDPA screen (nothing to consent to yet), so
        // don't record consent for them — only segments A/B actually accepted it.
        is_consented: segment === 'C' ? false : true,
        consented_at: segment === 'C' ? null : (consent?.at ?? new Date().toISOString()),
        consent_version: segment === 'C' ? null : (consent?.version ?? PDPA_VERSION_FALLBACK),
      };

      const { data: userData, error: userError } = await supabase
        .from('001_users')
        .upsert(userPayload, { onConflict: 'line_uid' })
        .select()
        .single();

      if (userError) throw userError;

      // Cache the userId so future boots can find this user even if LIFF fails
      localStorage.setItem('pp_line_uid', userData.line_uid);

      // NOTE: 008_consent is a catalog of consent/policy VERSIONS (e.g. v1, v2
      // as the PDPA text changes over time) — not a per-user acceptance log.
      // Per-user acceptance lives on 001_users (is_consented/consented_at/
      // consent_version) above; we just also mirror it as an audit event.
      // Non-fatal: 002_user_logs currently rejects anon inserts (RLS gap),
      // flagged separately — this silently no-ops until that's opened.
      if (segment !== 'C') {
        try {
          await supabase.from('002_user_logs').insert({
            line_uid: userData.line_uid,
            action: 'consent_accept',
            new_value: consent?.version ?? PDPA_VERSION_FALLBACK,
          });
        } catch (e) { console.warn('[onboarding] consent log failed:', e?.message); }
      }

      // is_pregnant/due_date live on 003_children. `name` is nullable now
      // (Dev B confirmed pregnancies don't need a placeholder name anymore).
      // `stage` is a best-guess bucket pending Dev B confirming exact values
      // beyond 'pregnancy' (the one value we've actually seen documented).
      if (segment === 'A') {
        await supabase.from('003_children').insert({
          line_uid: userData.line_uid,
          is_pregnant: true,
          due_date: formData.edd ?? null,
          stage: PREGNANCY_STAGE,
        });
      } else if (segment === 'B' && formData.childName) {
        const childPayload = {
          line_uid: userData.line_uid,
          name: formData.childName,
          gender: formData.childGender,
          birth_date: formData.birthdate,
          birth_weight: formData.weightKg,
          birth_height: formData.heightCm,
          is_pregnant: false,
          stage: computeStage(formData.birthdate),
        };
        const { data: childData, error: childError } = await supabase
          .from('003_children').insert(childPayload).select().single();
        if (childError) throw childError;

        if (childData && formData.weightKg && formData.heightCm) {
          await supabase.from('004_growth').insert({
            child_id: childData.child_id,
            recorded_date: formData.birthdate,
            weight_kg: formData.weightKg,
            height_cm: formData.heightCm,
            diaper_size: recommendSize(formData.weightKg).code,
          });
        }
      }

      onComplete(userData);
    } catch (err) {
      console.error('[onboarding] save error:', err);
      onComplete({ line_uid: lineProfile?.userId, role: segment === 'C' ? 'guest' : 'member', parent_name: formData.motherName ?? null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: 'var(--gradient-sky)' }}>
      {step === 'welcome' && <StepWelcome onNext={() => setStep('segment')} />}
      {step === 'segment' && <SegmentPicker onPick={handlePickSegment} />}
      {step === 'pdpa' && (
        <StepPDPA
          pdpaText={pdpaDoc?.pdpa_text}
          version={pdpaDoc?.consent_version}
          onAccept={(c) => {
            setConsent(c);
            setStep('form');
          }}
        />
      )}
      {step === 'form' && (
        <SegmentForm
          segment={segment}
          lineProfile={lineProfile}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}
