import React, { useState } from 'react';
import { Card, Button } from '../components/index.jsx';
import { supabase } from '../lib/supabase.js';

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
      <div style={{ fontSize: 72 }}>🐣</div>
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

function StepPDPA({ onNext }) {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '32px 24px', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ font: '800 22px var(--font-display)', color: 'var(--text-heading)' }}>นโยบายความเป็นส่วนตัว</div>
      </div>
      <Card>
        <p style={{ font: 'var(--type-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
          เราจะเก็บข้อมูลของคุณเพื่อให้บริการที่ดีขึ้น ข้อมูลจะไม่ถูกเปิดเผยต่อบุคคลที่สาม
          และจะถูกจัดเก็บอย่างปลอดภัยตามมาตรฐาน PDPA
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
      <Button variant="primary" fullWidth disabled={!checked} onClick={onNext}>ยืนยัน</Button>
    </div>
  );
}

function SegmentPicker({ onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '32px 24px', gap: 16 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ font: '800 22px var(--font-display)', color: 'var(--text-heading)' }}>คุณอยู่ในช่วงไหน?</div>
        <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginTop: 6 }}>เพื่อให้เราดูแลคุณได้ตรงจุดขึ้น</div>
      </div>
      <Card interactive onClick={() => onPick('A')} style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
        <span style={{ fontSize: 36 }}>🤰</span>
        <div>
          <div style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>กำลังตั้งครรภ์</div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 3 }}>เตรียมพร้อมก่อนลูกมา</div>
        </div>
      </Card>
      <Card interactive onClick={() => onPick('B')} style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
        <span style={{ fontSize: 36 }}>👶</span>
        <div>
          <div style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>มีลูกแล้ว</div>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 3 }}>ติดตามพัฒนาการและไซส์ผ้าอ้อม</div>
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
  const [step, setStep] = useState(initialSegment ? 'form' : 'welcome');
  const [segment, setSegment] = useState(initialSegment ?? null);
  const [loading, setLoading] = useState(false);

  const handlePickSegment = (seg) => {
    setSegment(seg);
    setStep('form');
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const lineUserId = lineProfile?.userId ?? 'dev_user_001';

      const userPayload = {
        line_user_id: lineUserId,
        display_name: lineProfile?.displayName ?? '',
        email: lineProfile?.email ?? null,
        segment,
        mother_name: formData.motherName ?? null,
        edd: formData.edd ?? null,
      };

      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert(userPayload, { onConflict: 'line_user_id' })
        .select()
        .single();

      if (userError) throw userError;

      if (segment === 'B' && formData.childName) {
        const childPayload = {
          user_id: userData.id,
          name: formData.childName,
          gender: formData.childGender,
          birthdate: formData.birthdate,
          weight_kg: formData.weightKg,
          height_cm: formData.heightCm,
        };
        const { error: childError } = await supabase.from('children').insert(childPayload);
        if (childError) throw childError;
      }

      onComplete(userData);
    } catch (err) {
      console.error('[onboarding] save error:', err);
      onComplete({ line_user_id: lineProfile?.userId, segment, mother_name: formData.motherName ?? null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: 'var(--gradient-sky)' }}>
      {step === 'welcome' && <StepWelcome onNext={() => setStep('pdpa')} />}
      {step === 'pdpa' && <StepPDPA onNext={() => setStep('segment')} />}
      {step === 'segment' && <SegmentPicker onPick={handlePickSegment} />}
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
