import React, { useState, useRef } from 'react';
import { Baby, Camera } from 'lucide-react';
import { Button } from '../components/index.jsx';
import { supabase } from '../lib/supabase.js';
import { insertPregnantChild, insertBornChild, graduatePregnantChild, updateChildInfo } from '../lib/children.js';

const inputStyle = {
  width: '100%', minWidth: 0, maxWidth: '100%', height: 46, padding: '0 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)', font: 'var(--type-body)', color: 'var(--text-body)',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
};
const dateInputStyle = { ...inputStyle, WebkitAppearance: 'none', appearance: 'none' };

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ font: 'var(--type-label)', color: 'var(--text-title)', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function PhotoPicker({ preview, onPick }) {
  const ref = useRef(null);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
      <div style={{ position: 'relative', width: 84, height: 84 }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-default)' }}>
          {preview
            ? <img src={preview} alt="รูปลูกน้อย" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Baby width={36} height={36} style={{ color: 'var(--text-faint)' }} />}
        </div>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          aria-label="เลือกรูปโปรไฟล์ลูก"
          style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: '50%', background: 'var(--color-secondary)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
        >
          <Camera width={15} height={15} />
        </button>
        <input ref={ref} type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 22px 32px' }}>
        <div style={{ font: '800 20px var(--font-display)', color: 'var(--text-heading)', marginBottom: 4 }}>{title}</div>
        {subtitle && <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginBottom: 18 }}>{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}

function BornChildFields({ name, setName, gender, setGender, birthdate, setBirthdate, weightKg, setWeightKg, heightCm, setHeightCm, photoPreview, onPhotoPick }) {
  return (
    <>
      <PhotoPicker preview={photoPreview} onPick={onPhotoPick} />
      <Field label="ชื่อลูกน้อย">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="ชื่อเล่น" />
      </Field>
      <Field label="เพศลูก">
        <div style={{ display: 'flex', gap: 12 }}>
          {[{ val: 'male', label: '👦 ชาย' }, { val: 'female', label: '👧 หญิง' }].map(({ val, label }) => (
            <label key={val} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: `2px solid ${gender === val ? 'var(--color-primary)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', background: gender === val ? 'var(--surface-soft)' : '#fff' }}>
              <input type="radio" name="child-gender" value={val} checked={gender === val} onChange={() => setGender(val)} style={{ accentColor: 'var(--color-primary)' }} />
              <span style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>{label}</span>
            </label>
          ))}
        </div>
      </Field>
      <Field label="วันเกิดลูก">
        <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} style={dateInputStyle} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="น้ำหนัก (กก.)">
          <input type="number" step="0.1" placeholder="เช่น 3.5" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="ส่วนสูง (ซม.)">
          <input type="number" step="0.1" placeholder="เช่น 50.0" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} style={inputStyle} />
        </Field>
      </div>
    </>
  );
}

// ─── Add a new child (pregnant or born) ────────────────────────────────────

export function AddChildModal({ onClose, onSaved, lineUid }) {
  const [kind, setKind] = useState(null); // null | 'pregnant' | 'born'
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onPhotoPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const canSavePregnant = !!dueDate;
  const canSaveBorn = name && gender && birthdate && weightKg && heightCm;

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      if (kind === 'pregnant') {
        await insertPregnantChild(supabase, lineUid, { name, dueDate });
      } else {
        await insertBornChild(supabase, lineUid, {
          name, gender, birthdate,
          weightKg: parseFloat(weightKg), heightCm: parseFloat(heightCm), photoFile,
        });
      }
      onSaved();
    } catch (e) {
      console.warn('[add-child] save failed:', e?.message);
      setError('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  if (!kind) {
    return (
      <ModalShell title="เพิ่มลูก" onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setKind('pregnant')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 30 }}>🤰</span>
            <div>
              <div style={{ font: 'var(--weight-bold) 15px var(--font-display)', color: 'var(--text-heading)' }}>กำลังตั้งครรภ์</div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>ยังไม่คลอด</div>
            </div>
          </button>
          <button onClick={() => setKind('born')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 30 }}>👶</span>
            <div>
              <div style={{ font: 'var(--weight-bold) 15px var(--font-display)', color: 'var(--text-heading)' }}>มีลูกแล้ว</div>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>เกิดแล้ว</div>
            </div>
          </button>
        </div>
        <button onClick={onClose} style={{ marginTop: 14, width: '100%', border: 'none', background: 'transparent', font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 0' }}>
          ยกเลิก
        </button>
      </ModalShell>
    );
  }

  return (
    <ModalShell title={kind === 'pregnant' ? '🤰 เพิ่มการตั้งครรภ์' : '👶 เพิ่มลูก'} onClose={onClose}>
      {kind === 'pregnant' ? (
        <Field label="กำหนดคลอด (EDD)">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={dateInputStyle} />
        </Field>
      ) : (
        <BornChildFields
          name={name} setName={setName} gender={gender} setGender={setGender}
          birthdate={birthdate} setBirthdate={setBirthdate}
          weightKg={weightKg} setWeightKg={setWeightKg} heightCm={heightCm} setHeightCm={setHeightCm}
          photoPreview={photoPreview} onPhotoPick={onPhotoPick}
        />
      )}
      {error && <div style={{ font: 'var(--type-caption)', color: '#dc2626', marginBottom: 8 }}>{error}</div>}
      <div style={{ marginTop: 8 }}>
        <Button variant="primary" fullWidth disabled={kind === 'pregnant' ? !canSavePregnant : !canSaveBorn} loading={saving} onClick={handleSave}>
          บันทึก
        </Button>
      </div>
      <button onClick={() => setKind(null)} style={{ marginTop: 10, width: '100%', border: 'none', background: 'transparent', font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 0' }}>
        ย้อนกลับ
      </button>
    </ModalShell>
  );
}

// ─── Edit an existing child (name/details, or "graduate" a pregnancy) ─────

export function EditChildModal({ child, onClose, onSaved, startGraduating = false }) {
  const [graduating, setGraduating] = useState(startGraduating);
  const [name, setName] = useState(child?.name || '');
  const [gender, setGender] = useState(child?.gender || '');
  const [birthdate, setBirthdate] = useState(child?.birth_date || '');
  const [weightKg, setWeightKg] = useState(child?.birth_weight ?? '');
  const [heightCm, setHeightCm] = useState(child?.birth_height ?? '');
  const [dueDate, setDueDate] = useState(child?.due_date || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(child?.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onPhotoPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const isPregnant = child?.is_pregnant && !graduating;
  const canSave = isPregnant ? true : (name && gender && birthdate && weightKg && heightCm);

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      if (graduating) {
        await graduatePregnantChild(supabase, child, {
          name, gender, birthdate, weightKg: parseFloat(weightKg), heightCm: parseFloat(heightCm), photoFile,
        });
      } else if (child.is_pregnant) {
        await updateChildInfo(supabase, child, { name: name || null, due_date: dueDate || null }, photoFile);
      } else {
        await updateChildInfo(supabase, child, {
          name, gender, birth_date: birthdate,
          birth_weight: parseFloat(weightKg), birth_height: parseFloat(heightCm),
        }, photoFile);
      }
      onSaved();
    } catch (e) {
      console.warn('[edit-child] save failed:', e?.message);
      setError('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={graduating ? '🎉 ลูกเกิดแล้ว' : 'แก้ไขข้อมูลลูก'} onClose={onClose}>
      {isPregnant ? (
        <>
          <Field label="ชื่อ (ถ้ามี)">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="ชื่อเล่น (ไม่บังคับ)" />
          </Field>
          <Field label="กำหนดคลอด (EDD)">
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={dateInputStyle} />
          </Field>
          <div style={{ marginBottom: 14 }}>
            <Button variant="soft" fullWidth onClick={() => setGraduating(true)}>ลูกเกิดแล้ว 🎉</Button>
          </div>
        </>
      ) : (
        <BornChildFields
          name={name} setName={setName} gender={gender} setGender={setGender}
          birthdate={birthdate} setBirthdate={setBirthdate}
          weightKg={weightKg} setWeightKg={setWeightKg} heightCm={heightCm} setHeightCm={setHeightCm}
          photoPreview={photoPreview} onPhotoPick={onPhotoPick}
        />
      )}
      {error && <div style={{ font: 'var(--type-caption)', color: '#dc2626', marginBottom: 8 }}>{error}</div>}
      <div style={{ marginTop: 8 }}>
        <Button variant="primary" fullWidth disabled={!canSave} loading={saving} onClick={handleSave}>บันทึก</Button>
      </div>
      {graduating && (
        <button onClick={() => setGraduating(false)} style={{ marginTop: 10, width: '100%', border: 'none', background: 'transparent', font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 0' }}>
          ย้อนกลับ
        </button>
      )}
    </ModalShell>
  );
}
