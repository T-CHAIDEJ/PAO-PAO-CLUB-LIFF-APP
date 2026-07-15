import React, { useState, useEffect, useRef } from 'react';
import { Scale, ChevronRight, Ruler, ShoppingCart, Baby, Camera } from 'lucide-react';
import { Card } from '../components/index.jsx';
import { SkyDeco, SectionTitle } from '../shared/index.jsx';
import { GrowthPanel } from './BabyTrackerScreen.jsx';
import { supabase } from '../lib/supabase.js';
import { recommendSize } from '../lib/diaperSize.js';
import { uploadChildAvatar } from '../lib/avatar.js';
export { recommendSize };

const inputStyle = {
  width: '100%', minWidth: 0, maxWidth: '100%', height: 46, padding: '0 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)', font: 'var(--type-body)', color: 'var(--text-body)',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
};

// 011_shop_links.platform codes → display treatment. Order here also sets
// display order (DB has no sort_order column of its own).
const PLATFORM_ORDER = ['SHP', 'TT', 'LiShop', 'LZD'];
const PLATFORM_META = {
  SHP: {
    label: 'Shopee', bg: '#fff3f0', accent: '#EE4D2D',
    icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flex: 'none' }}>
      <rect width="28" height="28" rx="8" fill="#EE4D2D"/>
      <path d="M14 5C11.5 5 9.5 7 9.5 9.5H8L7 21H21L20 9.5H18.5C18.5 7 16.5 5 14 5ZM14 7C15.4 7 16.5 8.1 16.5 9.5H11.5C11.5 8.1 12.6 7 14 7Z" fill="white"/>
    </svg>,
  },
  TT: {
    label: 'TikTok Shop', bg: '#f5f5f5', accent: '#010101',
    icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flex: 'none' }}>
      <rect width="28" height="28" rx="8" fill="#010101"/>
      <path d="M19.5 7h-2.3c.1.6.4 1.2.9 1.6.4.4 1 .7 1.6.8v2.2c-.9 0-1.8-.3-2.5-.8v5.5c0 2.4-2 4.3-4.4 4.3S8.5 18.7 8.5 16.3s2-4.3 4.4-4.3c.2 0 .4 0 .6.1v2.3c-.2-.1-.4-.1-.6-.1-1.2 0-2.1.9-2.1 2.1s.9 2.1 2.1 2.1 2.1-.9 2.1-2.1V7h2.2c.1.7.4 1.3.8 1.8.5.5 1.1.8 1.8.9L19.5 7z" fill="white"/>
      <path d="M20.5 11.3c-.7-.1-1.3-.4-1.8-.9-.4-.5-.7-1.1-.8-1.8h-.3v9.7c0 1.2-.9 2.1-2.1 2.1s-2.1-.9-2.1-2.1.9-2.1 2.1-2.1c.2 0 .4 0 .6.1V14c-.2 0-.4-.1-.6-.1-2.4 0-4.4 1.9-4.4 4.3s2 4.3 4.4 4.3 4.4-1.9 4.4-4.3v-5.5c.7.5 1.6.8 2.5.8v-2.2h-.2c-.6-.1-1.2-.4-1.7-1z" fill="#69C9D0"/>
    </svg>,
  },
  LiShop: {
    label: 'LINE MYSHOP', bg: '#f0fdf4', accent: '#06C755',
    icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flex: 'none' }}>
      <rect width="28" height="28" rx="8" fill="#06C755"/>
      <path d="M14 6C9.6 6 6 9.1 6 12.9c0 2.5 1.6 4.7 4 5.9-.2.6-.6 2.2-.7 2.5-.1.4.2.4.4.3.2-.1 3-2 4.2-2.8.4.1.7.1 1.1.1 4.4 0 8-3.1 8-6.9C22 9.1 18.4 6 14 6z" fill="white"/>
    </svg>,
  },
  LZD: {
    label: 'Lazada', bg: '#eef1ff', accent: '#0F146D',
    icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flex: 'none' }}>
      <rect width="28" height="28" rx="8" fill="#0F146D"/>
      <path d="M14 6l7 4v8l-7 4-7-4v-8l7-4z" fill="#FF6A00"/>
      <path d="M14 6l7 4-7 4-7-4 7-4z" fill="white" opacity=".9"/>
    </svg>,
  },
};

function DiaperPanel({ go, child }) {
  const [latestKg, setLatestKg] = useState(null);
  const [latestMeasurements, setLatestMeasurements] = useState({ thigh: null, waist: null });
  const [loadingWeight, setLoadingWeight] = useState(true);
  const [shopLinks, setShopLinks] = useState(null); // null = loading, [] = none active

  useEffect(() => {
    supabase
      .from('011_shop_links')
      .select('platform, url')
      .eq('is_active', true)
      .is('diaper_id', null) // general links, not tied to a specific size
      .then(({ data }) => {
        const sorted = (data || []).slice().sort((a, b) =>
          PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform));
        setShopLinks(sorted);
      });
  }, []);

  useEffect(() => {
    if (!child?.child_id) { setLoadingWeight(false); return; }
    async function fetchLatest() {
      const { data } = await supabase
        .from('004_growth')
        .select('weight_kg, thigh_cm, waist_cm, recorded_date')
        .eq('child_id', child.child_id)
        .order('recorded_date', { ascending: false })
        .limit(1)
        .single();
      setLatestKg(data?.weight_kg ?? null);
      setLatestMeasurements({ thigh: data?.thigh_cm ?? null, waist: data?.waist_cm ?? null });
      setLoadingWeight(false);
    }
    fetchLatest();
  }, [child?.id]);

  // NOTE: 003_children only has birth_weight (birth-time), not a "current
  // weight" cache — so there's no sensible fallback if no growth record exists yet.
  const kg = latestKg;
  const size = kg ? recommendSize(kg) : null;

  function calcAge(birthdate) {
    if (!birthdate) return null;
    const ms = Date.now() - new Date(birthdate).getTime();
    const totalMonths = Math.floor(ms / (1000 * 60 * 60 * 24 * 30.4375));
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (totalMonths < 1) return 'แรกเกิด';
    if (years === 0) return `${months} เดือน`;
    return months === 0 ? `${years} ปี` : `${years} ปี ${months} เดือน`;
  }
  const ageLabel = calcAge(child?.birth_date);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Weight + Thigh/Waist — combined card */}
      <Card>
        {/* Weight row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--blue-100)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Scale width={21} height={21} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>น้ำหนักล่าสุด</div>
            {loadingWeight ? (
              <div style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-muted)' }}>กำลังโหลด...</div>
            ) : kg ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ font: '800 32px var(--font-display)', color: 'var(--text-heading)' }}>{kg.toFixed(1)}</span>
                <span style={{ font: 'var(--weight-semibold) 14px var(--font-base)', color: 'var(--text-muted)' }}>กก.</span>
              </div>
            ) : (
              <div style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-muted)' }}>ยังไม่มีข้อมูล</div>
            )}
          </div>
          {ageLabel && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>อายุ</div>
              <div style={{ font: 'var(--weight-semibold) 13px var(--font-base)', color: 'var(--text-muted)' }}>{ageLabel}</div>
            </div>
          )}
        </div>

        {/* Thigh & Waist — secondary */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Ruler width={14} height={14} style={{ color: 'var(--text-faint)' }} />
            <span style={{ font: 'var(--weight-medium) 12px var(--font-base)', color: 'var(--text-muted)' }}>เช็คความพอดี (รอบขา / รอบเอว)</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'รอบขา', value: latestMeasurements.thigh },
              { label: 'รอบเอว', value: latestMeasurements.waist },
            ].map(({ label, value }) => (
              <div key={label} style={{ flex: 1, background: 'var(--surface-soft)', borderRadius: 'var(--radius-md)', padding: '8px 10px' }}>
                <div style={{ font: '11px var(--font-base)', color: 'var(--text-faint)', marginBottom: 2 }}>{label}</div>
                {loadingWeight ? (
                  <span style={{ font: '13px var(--font-base)', color: 'var(--text-faint)' }}>...</span>
                ) : value ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <span style={{ font: 'var(--weight-bold) 16px var(--font-display)', color: 'var(--text-title)' }}>{value.toFixed(1)}</span>
                    <span style={{ font: '11px var(--font-base)', color: 'var(--text-faint)' }}>ซม.</span>
                  </div>
                ) : (
                  <span style={{ font: '12px var(--font-base)', color: 'var(--text-faint)' }}>—</span>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
            บันทึกผ่านหน้า พัฒนาการ → บันทึกข้อมูลใหม่
          </div>
        </div>
      </Card>

      {/* Recommended size detail */}
      {size && (
        <Card tone="green" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--color-secondary)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: 'var(--shadow-green)' }}>
            <span style={{ font: '800 26px var(--font-display)', lineHeight: 1 }}>{size.code}</span>
            <span style={{ font: 'var(--weight-semibold) 9px var(--font-base)', letterSpacing: '.06em', opacity: .9 }}>SIZE</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: 'var(--type-caption)', color: 'var(--green-700)' }}>ไซส์ที่แนะนำจากน้ำหนัก</div>
            <div style={{ font: 'var(--weight-bold) 19px var(--font-display)', color: 'var(--text-heading)' }}>Size {size.code}</div>
            <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>สำหรับน้ำหนัก {size.min}–{size.max} กก.</div>
          </div>
          <button onClick={() => go('size')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--green-700)', display: 'flex' }}>
            <ChevronRight width={22} height={22} />
          </button>
        </Card>
      )}

      {/* Buy CTA */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <ShoppingCart width={20} height={20} />
          </span>
          <div>
            <div style={{ font: 'var(--weight-bold) 15px var(--font-display)', color: 'var(--text-heading)' }}>สั่งซื้อผ้าอ้อม PAO PAO</div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>เลือกช่องทางที่สะดวก</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shopLinks === null ? (
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'center', padding: '8px 0' }}>กำลังโหลด...</div>
          ) : shopLinks.length === 0 ? (
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', textAlign: 'center', padding: '8px 0' }}>ยังไม่มีลิงก์ร้านค้าตอนนี้</div>
          ) : shopLinks.map((link) => {
            const meta = PLATFORM_META[link.platform] || { label: link.platform, bg: 'var(--surface-soft)', accent: 'var(--color-primary)', icon: <ShoppingCart width={28} height={28} style={{ flex: 'none' }} /> };
            return (
              <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: meta.bg, borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
                {meta.icon}
                <span style={{ flex: 1, font: 'var(--weight-semibold) 15px var(--font-base)', color: 'var(--text-heading)' }}>{meta.label}</span>
                <span style={{ font: 'var(--weight-bold) 13px var(--font-base)', color: meta.accent, background: `${meta.accent}18`, padding: '4px 12px', borderRadius: 20 }}>ซื้อเลย</span>
              </a>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export function DiaperScreen({ go, child, onChildUpdate }) {
  const childName = child?.name || 'ลูกน้อย';
  const genderLabel = child?.gender === 'male' ? '👦 ชาย' : child?.gender === 'female' ? '👧 หญิง' : null;
  const birthdateLabel = formatBirthdate(child?.birth_date);
  const ageLabel = calcAge(child?.birth_date);

  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ position: 'relative', background: 'var(--gradient-hero)', padding: '20px 20px 28px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        <div style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <ChildAvatarUpload child={child} onChildUpdate={onChildUpdate} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .8 }}>ผ้าอ้อม</div>
            <div style={{ font: '800 24px var(--font-display)', marginTop: 2, marginBottom: 10 }}>{childName}</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {genderLabel && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ font: 'var(--weight-medium) 10px var(--font-base)', opacity: .7, textTransform: 'uppercase', letterSpacing: '.06em' }}>เพศ</div>
                  <div style={{ font: 'var(--weight-semibold) 13px var(--font-base)' }}>{genderLabel}</div>
                </div>
              )}
              {birthdateLabel && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ font: 'var(--weight-medium) 10px var(--font-base)', opacity: .7, textTransform: 'uppercase', letterSpacing: '.06em' }}>วันเกิด</div>
                  <div style={{ font: 'var(--weight-semibold) 13px var(--font-base)' }}>{birthdateLabel}</div>
                </div>
              )}
              {ageLabel && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ font: 'var(--weight-medium) 10px var(--font-base)', opacity: .7, textTransform: 'uppercase', letterSpacing: '.06em' }}>อายุ</div>
                  <div style={{ font: '800 13px var(--font-display)' }}>{ageLabel}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 16px 0' }}>
        <DiaperPanel go={go} child={child} />
      </div>
    </div>
  );
}

function formatBirthdate(dateStr) {
  if (!dateStr) return null;
  const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const d = new Date(dateStr);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function calcAge(birthdate) {
  if (!birthdate) return null;
  const ms = Date.now() - new Date(birthdate).getTime();
  const totalMonths = Math.floor(ms / (1000 * 60 * 60 * 24 * 30.4375));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (totalMonths < 1) return 'แรกเกิด';
  if (years === 0) return `${months} เดือน`;
  return months === 0 ? `${years} ปี` : `${years} ปี ${months} เดือน`;
}

function ChildAvatarUpload({ child, onChildUpdate }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !child?.child_id) return;
    setErr('');
    setUploading(true);
    try {
      const url = await uploadChildAvatar(supabase, child.child_id, file);
      onChildUpdate && onChildUpdate({ avatar_url: url });
    } catch (e2) {
      console.warn('[avatar] upload failed:', e2?.message);
      setErr('อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ position: 'relative', width: 64, height: 64, flex: 'none' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {child?.avatar_url
            ? <img src={child.avatar_url} alt={child?.name || 'ลูกน้อย'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Baby width={28} height={28} style={{ opacity: .85 }} />}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="เปลี่ยนรูปโปรไฟล์ลูก"
          style={{ position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: '50%', background: 'var(--color-secondary)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
        >
          <Camera width={13} height={13} />
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9 }}>
            กำลังอัป...
          </div>
        )}
      </div>
      {err && <div style={{ font: 'var(--type-caption)', color: '#FFCDD2', marginTop: 4, maxWidth: 100 }}>{err}</div>}
    </div>
  );
}

export default function TrackerScreen({ child, onChildUpdate }) {
  const childName  = child?.name     || 'ลูกน้อย';
  const genderLabel = child?.gender === 'male' ? '👦 ชาย' : child?.gender === 'female' ? '👧 หญิง' : null;
  const birthdateLabel = formatBirthdate(child?.birth_date);
  const ageLabel = calcAge(child?.birth_date);

  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ position: 'relative', background: 'var(--gradient-hero)', padding: '20px 20px 28px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        <div style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <ChildAvatarUpload child={child} onChildUpdate={onChildUpdate} />
          <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .8 }}>พัฒนาการ</div>
          <div style={{ font: '800 24px var(--font-display)', marginTop: 2, marginBottom: 10 }}>{childName}</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {genderLabel && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ font: 'var(--weight-medium) 10px var(--font-base)', opacity: .7, textTransform: 'uppercase', letterSpacing: '.06em' }}>เพศ</div>
                <div style={{ font: 'var(--weight-semibold) 13px var(--font-base)' }}>{genderLabel}</div>
              </div>
            )}
            {birthdateLabel && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ font: 'var(--weight-medium) 10px var(--font-base)', opacity: .7, textTransform: 'uppercase', letterSpacing: '.06em' }}>วันเกิด</div>
                <div style={{ font: 'var(--weight-semibold) 13px var(--font-base)' }}>{birthdateLabel}</div>
              </div>
            )}
            {ageLabel && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ font: 'var(--weight-medium) 10px var(--font-base)', opacity: .7, textTransform: 'uppercase', letterSpacing: '.06em' }}>อายุ</div>
                <div style={{ font: '800 13px var(--font-display)' }}>{ageLabel}</div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 16px 0' }}>
        <GrowthPanel child={child} />
      </div>
    </div>
  );
}
