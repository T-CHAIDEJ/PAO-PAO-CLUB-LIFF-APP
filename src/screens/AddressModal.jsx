import { useState } from 'react';
import { Button } from '../components/index.jsx';
import { supabase } from '../lib/supabase.js';
import { inputStyle } from '../lib/formStyles.js';
import { logAction, logError } from '../lib/userLogs.js';
import { ModalShell } from './ChildModals.jsx';

// Shipping contact lives on 001_users (parent_name / phone / address_no /
// subdistrict / district / province / postal_code — columns Dev B already
// provided but nothing collected until now). Used from two places: the
// Profile "ที่อยู่จัดส่ง" modal, and inline inside the reward-redemption
// confirm sheet so an order can never be placed without a way to ship it.

export function shippingFromUser(user) {
  return {
    name: user?.parent_name || user?.display_name || '',
    phone: user?.phone || '',
    addressNo: user?.address_no || '',
    subdistrict: user?.subdistrict || '',
    district: user?.district || '',
    province: user?.province || '',
    postalCode: user?.postal_code || '',
  };
}

export function hasShippingInfo(user) {
  const s = shippingFromUser(user);
  return !!(s.phone && s.addressNo && s.province && s.postalCode);
}

export function validateShipping(s) {
  if (!s.name.trim()) return 'กรุณาใส่ชื่อผู้รับ';
  if (!/^0\d{8,9}$/.test(s.phone.trim())) return 'เบอร์โทรไม่ถูกต้อง (ตัวเลข 9-10 หลัก ขึ้นต้นด้วย 0)';
  if (!s.addressNo.trim()) return 'กรุณาใส่ที่อยู่';
  if (!s.subdistrict.trim() || !s.district.trim() || !s.province.trim()) return 'กรุณาใส่ ตำบล/อำเภอ/จังหวัด ให้ครบ';
  if (!/^\d{5}$/.test(s.postalCode.trim())) return 'รหัสไปรษณีย์ไม่ถูกต้อง (ตัวเลข 5 หลัก)';
  return null;
}

// One-line snapshot stored on each redemption, so the order keeps the
// address it was actually placed with even if the profile changes later.
export function buildAddressText(s) {
  return `${s.addressNo.trim()} ต.${s.subdistrict.trim()} อ.${s.district.trim()} จ.${s.province.trim()} ${s.postalCode.trim()}`;
}

export async function saveShipping(lineUid, s) {
  const patch = {
    parent_name: s.name.trim(),
    phone: s.phone.trim(),
    address_no: s.addressNo.trim(),
    subdistrict: s.subdistrict.trim(),
    district: s.district.trim(),
    province: s.province.trim(),
    postal_code: s.postalCode.trim(),
  };
  const { error } = await supabase.from('001_users').update(patch).eq('line_uid', lineUid);
  if (error) throw error;
  logAction(lineUid, 'update_shipping_address');
  return patch;
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ font: 'var(--type-label)', color: 'var(--text-title)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

export function AddressFields({ values, onChange }) {
  const set = (key) => (e) => onChange({ ...values, [key]: e.target.value });
  return (
    <>
      <Field label="ชื่อผู้รับ *">
        <input type="text" value={values.name} onChange={set('name')} style={inputStyle} placeholder="ชื่อ-นามสกุล" />
      </Field>
      <Field label="เบอร์โทรศัพท์ *">
        <input type="tel" value={values.phone} onChange={set('phone')} style={inputStyle} placeholder="เช่น 0812345678" />
      </Field>
      <Field label="ที่อยู่ (บ้านเลขที่ / หมู่บ้าน / ถนน) *">
        <input type="text" value={values.addressNo} onChange={set('addressNo')} style={inputStyle} placeholder="เช่น 99/1 หมู่ 2 ถ.สุขุมวิท" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="ตำบล/แขวง *">
          <input type="text" value={values.subdistrict} onChange={set('subdistrict')} style={inputStyle} />
        </Field>
        <Field label="อำเภอ/เขต *">
          <input type="text" value={values.district} onChange={set('district')} style={inputStyle} />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="จังหวัด *">
          <input type="text" value={values.province} onChange={set('province')} style={inputStyle} />
        </Field>
        <Field label="รหัสไปรษณีย์ *">
          <input type="text" inputMode="numeric" maxLength={5} value={values.postalCode} onChange={set('postalCode')} style={inputStyle} placeholder="เช่น 10110" />
        </Field>
      </div>
    </>
  );
}

// Standalone editor opened from Profile — usable any time, not only at
// redemption (per spec: ใส่เองก่อนแลกของก็ได้ หรือกลับมาแก้ทีหลังก็ได้).
export function AddressModal({ user, onClose, onSaved }) {
  const [values, setValues] = useState(shippingFromUser(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    const msg = validateShipping(values);
    if (msg) { setError(msg); return; }
    setSaving(true); setError(null);
    try {
      const patch = await saveShipping(user.line_uid, values);
      onSaved(patch);
    } catch (e) {
      console.warn('[address] save failed:', e?.message);
      logError(user?.line_uid, 'update_shipping_address', e);
      setError('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
      setSaving(false);
    }
  };

  return (
    <ModalShell title="ที่อยู่จัดส่ง" subtitle="ใช้สำหรับจัดส่งของรางวัลที่แลก" onClose={onClose}>
      <AddressFields values={values} onChange={setValues} />
      {error && <div style={{ font: 'var(--type-caption)', color: '#dc2626', marginBottom: 8 }}>{error}</div>}
      <div style={{ marginTop: 8 }}>
        <Button variant="primary" fullWidth loading={saving} onClick={handleSave}>บันทึก</Button>
      </div>
    </ModalShell>
  );
}
