import React, { useState, useEffect, useRef } from 'react';
import { Baby, Ruler, Gift, ScanLine, Bell, ChevronRight, Star, Package, TicketPercent, UserPlus, UserCircle2, Mars, Venus, Flame, Camera } from 'lucide-react';
import { Card, Badge, Button, ProgressBar } from '../components/index.jsx';
import { Wordmark, SectionTitle, ProfileButton } from '../shared/index.jsx';
import { recommendSize } from './TrackerScreen.jsx';
import { supabase } from '../lib/supabase.js';
import { STREAK_POINTS } from '../lib/points.js';
import { fetchRewardsCatalog, nextUnlockedReward } from '../lib/rewards.js';
import { computeStage } from '../lib/stage.js';
import { uploadChildAvatar } from '../lib/avatar.js';

const inputStyle = {
  width: '100%', minWidth: 0, maxWidth: '100%', height: 46, padding: '0 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)', font: 'var(--type-body)', color: 'var(--text-body)',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
};

// Safari on iOS can render <input type="date"> with a native calendar
// control that ignores width:100% and bleeds past its own box — turning
// off native appearance hands rendering fully to our CSS instead.
const dateInputStyle = { ...inputStyle, WebkitAppearance: 'none', appearance: 'none' };

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

const ACTIONS = [
  { id: 'tracker', Icon: Baby,      label: 'พัฒนาการ',      tone: 'var(--blue-100)',  fg: 'var(--blue-600)'  },
  { id: 'diaper',  Icon: Ruler,     label: 'ผ้าอ้อม',       tone: 'var(--green-100)', fg: 'var(--green-700)' },
  { id: 'rewards', Icon: Gift,      label: 'แลกของรางวัล',  tone: 'var(--blue-100)',  fg: 'var(--blue-600)'  },
  { id: 'scan',    Icon: ScanLine,  label: 'สแกนรับแต้ม',  tone: 'var(--green-100)', fg: 'var(--green-700)' },
];

function greetingByTime() {
  const h = new Date().getHours();
  if (h < 12) return 'สวัสดีตอนเช้าค่ะ';
  if (h < 17) return 'สวัสดีตอนบ่ายค่ะ';
  return 'สวัสดีตอนเย็นค่ะ';
}

function GuestHero({ user }) {
  const suffix = user?.line_uid
    ? user.line_uid.slice(-5).toUpperCase()
    : Math.random().toString(36).slice(-5).toUpperCase();
  return (
    <div style={{ position: 'relative', marginTop: 4 }}>
      <div style={{ font: 'var(--weight-semibold) 13px var(--font-base)', color: 'rgba(255,255,255,0.7)', letterSpacing: '.08em' }}>GUEST #{suffix}</div>
      <div style={{ font: '800 20px var(--font-display)', marginTop: 2 }}>คุณยังไม่เป็นสมาชิก</div>
      <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .85, marginTop: 4, lineHeight: 1.5 }}>
        กดสมัครเพื่อไม่ให้พลาดสิทธิ์และประโยชน์ต่างๆ จากเรา
      </div>
    </div>
  );
}

function MemberHero({ user, child }) {
  const name = user?.parent_name || user?.display_name || 'คุณแม่';
  const streak = user?.login_streak ?? 0;
  const childAge = calcAge(child?.birth_date);

  const parts = [];
  parts.push(streak > 0 ? `streak วันที่ ${streak}` : null);
  if (child?.name) parts.push(childAge ? `${child.name} อายุ ${childAge}` : child.name);
  else if (childAge) parts.push(`อายุ ${childAge}`);
  const subLine = parts.filter(Boolean).join(' · ') || null;

  return (
    <div style={{ position: 'relative', marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', overflow: 'hidden' }}>
        {user?.picture_url
          ? <img src={user.picture_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <UserCircle2 width={28} height={28} style={{ opacity: .9 }} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .9 }}>{greetingByTime()}</div>
        <div style={{ font: '800 20px var(--font-display)', marginTop: 1 }}>{name}</div>
        {subLine && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, font: 'var(--weight-medium) 11px var(--font-base)', opacity: .9 }}>
            <Flame width={13} height={13} />
            <span>{subLine}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, unit, bg, valueColor }) {
  return (
    <div style={{ background: bg ?? 'var(--surface-soft)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
      <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</div>
      {value != null ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
          <span style={{ font: '800 20px var(--font-display)', color: valueColor ?? 'var(--text-heading)' }}>{value}</span>
          {unit && <span style={{ font: 'var(--weight-medium) 11px var(--font-base)', color: 'var(--text-muted)' }}>{unit}</span>}
        </div>
      ) : (
        <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', color: 'var(--text-faint)', marginTop: 2 }}>—</div>
      )}
    </div>
  );
}

function BabyInfoCard({ child, latestKg, latestCm, go, onBabyArrived }) {
  const isMale = child?.gender === 'male';
  const isFemale = child?.gender === 'female';
  const GenderIcon = isMale ? Mars : isFemale ? Venus : null;
  const genderAccent = isMale ? 'var(--blue-100)' : isFemale ? '#fce7f3' : 'var(--surface-soft)';
  const genderSymbolColor = isMale ? 'var(--blue-600)' : isFemale ? '#be185d' : 'var(--text-muted)';
  const statBg = isMale ? 'var(--blue-100)' : isFemale ? '#fce7f3' : 'var(--surface-soft)';
  const statColor = isMale ? 'var(--blue-600)' : isFemale ? '#be185d' : 'var(--text-heading)';

  const childAge = calcAge(child?.birth_date);

  const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const birthdateLabel = child?.birth_date ? (() => {
    const d = new Date(child.birth_date);
    return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
  })() : null;

  const daysSince = child?._recordedAt
    ? Math.floor((Date.now() - new Date(child._recordedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const needsNudge = daysSince !== null && daysSince >= 14;

  if (child?.is_pregnant) {
    const dueDateLabel = child?.due_date ? (() => {
      const d = new Date(child.due_date);
      return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
    })() : null;
    const daysLeft = child?.due_date
      ? Math.ceil((new Date(child.due_date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <Card style={{ boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: 20 }}>🤰</span>
          <div>
            <div style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>{child?.name || 'ลูกน้อยในท้อง'}</div>
            {dueDateLabel && (
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 2 }}>กำหนดคลอด {dueDateLabel}</div>
            )}
          </div>
        </div>

        {daysLeft != null && (
          <div style={{ marginTop: 14, background: 'var(--surface-soft)', borderRadius: 'var(--radius-md)', padding: '14px 16px', textAlign: 'center' }}>
            {daysLeft > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                  <span style={{ font: '800 32px var(--font-display)', color: 'var(--color-secondary)' }}>{daysLeft}</span>
                  <span style={{ font: 'var(--weight-semibold) 14px var(--font-base)', color: 'var(--text-muted)' }}>วัน</span>
                </div>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 2 }}>ก่อนถึงกำหนดคลอด นับถอยหลังรอเจอลูกน้อย 💛</div>
              </>
            ) : (
              <div style={{ font: 'var(--weight-bold) 15px var(--font-display)', color: 'var(--color-secondary)' }}>ถึงกำหนดคลอดแล้ว! เตรียมพร้อมต้อนรับลูกน้อยได้เลย</div>
            )}
          </div>
        )}

        <button
          onClick={onBabyArrived}
          style={{ marginTop: 12, width: '100%', border: 'none', background: 'var(--color-secondary)', color: '#fff', borderRadius: 'var(--radius-md)', padding: '12px 16px', font: 'var(--weight-bold) 14px var(--font-base)', cursor: 'pointer' }}
        >
          ลูกเกิดแล้ว 🎉 กดเพื่อลงทะเบียน
        </button>
      </Card>
    );
  }

  return (
    <Card interactive onClick={() => go('tracker')} style={{ boxShadow: 'var(--shadow-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {child?.avatar_url ? (
            <img src={child.avatar_url} alt={child?.name || 'ลูกน้อย'} style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', flex: 'none' }} />
          ) : GenderIcon && (
            <span style={{ width: 40, height: 40, borderRadius: 12, background: genderAccent, color: genderSymbolColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <GenderIcon width={22} height={22} strokeWidth={2.5} />
            </span>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>
                {child?.name || 'ลูกน้อย'}
              </span>
            </div>
            {(childAge || birthdateLabel) && (
              <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 2 }}>
                {childAge}{birthdateLabel ? ` · ${birthdateLabel}` : ''}
              </div>
            )}
          </div>
        </div>
        <ChevronRight width={20} height={20} style={{ color: 'var(--text-faint)' }} />
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatBox label="น้ำหนัก" value={latestKg != null ? latestKg.toFixed(1) : null} unit="กก." bg={statBg} valueColor={statColor} />
        <StatBox label="ส่วนสูง" value={latestCm != null ? latestCm.toFixed(1) : null} unit="ซม." bg={statBg} valueColor={statColor} />
      </div>

      {needsNudge && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--blue-100)', borderRadius: 'var(--radius-md)', font: 'var(--weight-medium) 12px var(--font-base)', color: 'var(--blue-600)' }}>
          ⏰ ยังไม่ได้บันทึกข้อมูลมา {daysSince} วัน — กดเพื่ออัพเดต
        </div>
      )}
    </Card>
  );
}

function SizeRecommendCard({ sizeRec, go }) {
  if (!sizeRec) return null;
  return (
    <Card tone="green" interactive onClick={() => go('diaper')} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--color-secondary)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: 'var(--shadow-green)' }}>
        <span style={{ font: '800 24px var(--font-display)', lineHeight: 1 }}>{sizeRec.code}</span>
        <span style={{ font: 'var(--weight-semibold) 9px var(--font-base)', letterSpacing: '.06em', opacity: .9 }}>SIZE</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ font: 'var(--type-caption)', color: 'var(--green-700)' }}>ไซส์ผ้าอ้อมแนะนำ</div>
        <div style={{ font: 'var(--weight-bold) 19px var(--font-display)', color: 'var(--text-heading)' }}>Size {sizeRec.code}</div>
        <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)' }}>สำหรับน้ำหนัก {sizeRec.min}–{sizeRec.max} กก.</div>
      </div>
      <ChevronRight width={22} height={22} style={{ color: 'var(--green-700)' }} />
    </Card>
  );
}

function StreakPopup({ checkin, onClose }) {
  const streakDay = checkin?.streakDay ?? 1;
  const awarded = checkin?.awarded ?? 0;
  const streak = checkin?.streak ?? streakDay;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'ppFade .2s ease' }}>
      <style>{`@keyframes ppFade{from{opacity:0}to{opacity:1}}@keyframes ppPop{from{transform:scale(.82);opacity:0}to{transform:scale(1);opacity:1}}@keyframes ppFlame{0%,100%{transform:scale(1)}50%{transform:scale(1.09)}}`}</style>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 340, background: '#fff', borderRadius: 24, overflow: 'hidden', animation: 'ppPop .32s cubic-bezier(.32,1.4,.5,1)' }}>
        <div style={{ background: 'var(--gradient-hero)', padding: '28px 20px 22px', textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 60, lineHeight: 1, animation: 'ppFlame 1.6s ease-in-out infinite' }}>🔥</div>
          <div style={{ font: '800 46px var(--font-display)', marginTop: 2 }}>{streak}</div>
          <div style={{ font: 'var(--weight-semibold) 15px var(--font-base)', opacity: .95 }}>วันติดต่อกัน!</div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 5, justifyContent: 'space-between' }}>
            {STREAK_POINTS.map((p, i) => {
              const day = i + 1;
              const done = day < streakDay;
              const today = day === streakDay;
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 42, borderRadius: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: today ? 'var(--color-secondary)' : done ? 'var(--surface-green)' : 'var(--surface-soft)',
                    color: today ? '#fff' : done ? 'var(--green-700)' : 'var(--text-faint)' }}>
                    <span style={{ fontSize: 13, lineHeight: 1 }}>{done ? '✓' : '🔥'}</span>
                    <span style={{ font: 'var(--weight-bold) 9px var(--font-base)', marginTop: 1 }}>{p}</span>
                  </div>
                  <div style={{ font: '9px var(--font-base)', color: today ? 'var(--green-700)' : 'var(--text-faint)', marginTop: 3 }}>ว.{day}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface-green)', color: 'var(--green-700)', padding: '8px 16px', borderRadius: 999, font: '800 16px var(--font-display)' }}>
              <Star width={18} height={18} fill="var(--color-secondary)" style={{ color: 'var(--color-secondary)' }} /> +{awarded} แต้มวันนี้
            </div>
            <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
              {streakDay < 7 ? `เข้าต่อเนื่องอีก ${7 - streakDay} วัน รับโบนัส 50 แต้ม!` : 'สุดยอด! ครบ 7 วัน รับโบนัสเต็ม 🎉'}
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <Button variant="primary" fullWidth size="lg" onClick={onClose}>เยี่ยมเลย!</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ title, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 320, background: '#fff', borderRadius: 20, padding: '28px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: 46 }}>🚧</div>
        <div style={{ font: 'var(--weight-bold) 18px var(--font-display)', color: 'var(--text-heading)', marginTop: 8 }}>{title}</div>
        <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginTop: 6 }}>ฟีเจอร์นี้กำลังพัฒนา เร็วๆ นี้</div>
        <div style={{ marginTop: 18 }}>
          <Button variant="primary" fullWidth onClick={onClose}>เข้าใจแล้ว</Button>
        </div>
      </div>
    </div>
  );
}

// Lets a pregnant (segment A) user "graduate" to segment B once the baby
// is born — updates the existing 003_children row (never inserts a new
// one) and logs an initial 004_growth record, same as segment B signup.
//
// Also doubles as a recovery form for members who somehow ended up with
// no 003_children row at all (e.g. onboarding's child insert failed
// silently in the past) — when there's no existing child to update,
// `lineUid` is used to insert a fresh row instead. Once 001_users
// exists the app never re-shows onboarding, so this is the only way
// back in for that state.
function BabyArrivedModal({ child, lineUid, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const photoInputRef = useRef(null);

  const isNewChild = !child?.child_id;
  const canSave = name && gender && birthdate && weightKg && heightCm;

  const handlePhotoPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!canSave) return;
    if (!isNewChild && !child?.child_id) return;
    if (isNewChild && !lineUid) return;
    setSaving(true); setError(null);
    try {
      const parsedWeight = parseFloat(weightKg);
      const parsedHeight = parseFloat(heightCm);
      if (!Number.isFinite(parsedWeight) || !Number.isFinite(parsedHeight)) {
        throw new Error('น้ำหนักหรือส่วนสูงไม่ถูกต้อง กรุณาใส่เป็นตัวเลข');
      }
      const fields = {
        name, gender, birth_date: birthdate,
        birth_weight: parsedWeight, birth_height: parsedHeight,
        is_pregnant: false, due_date: null,
        stage: computeStage(birthdate),
      };

      let childId = child?.child_id;
      if (isNewChild) {
        const { data, error: err } = await supabase.from('003_children').insert({ ...fields, line_uid: lineUid }).select().single();
        if (err) throw err;
        childId = data.child_id;
      } else {
        const { error: err } = await supabase.from('003_children').update(fields).eq('child_id', childId);
        if (err) throw err;
      }

      const patch = { ...fields, child_id: childId };
      if (photoFile) {
        patch.avatar_url = await uploadChildAvatar(supabase, childId, photoFile);
      }
      await supabase.from('004_growth').insert({
        child_id: childId, recorded_date: birthdate,
        weight_kg: parsedWeight, height_cm: parsedHeight,
        diaper_size: recommendSize(parsedWeight).code,
      });
      onSaved(patch);
    } catch (e) {
      console.warn('[baby-arrived] save failed:', e?.message);
      setError(e?.message?.includes('น้ำหนัก') ? e.message : 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 22px 32px' }}>
        <div style={{ font: '800 20px var(--font-display)', color: 'var(--text-heading)', marginBottom: 4 }}>{isNewChild ? '👶 ลงทะเบียนข้อมูลลูก' : '🎉 ยินดีด้วยค่ะ!'}</div>
        <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginBottom: 18 }}>กรอกข้อมูลลูกน้อยเพื่อเริ่มติดตามพัฒนาการ</div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ position: 'relative', width: 84, height: 84 }}>
            <div style={{ width: 84, height: 84, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-default)' }}>
              {photoPreview
                ? <img src={photoPreview} alt="รูปลูกน้อย" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Baby width={36} height={36} style={{ color: 'var(--text-faint)' }} />}
            </div>
            <button
              onClick={() => photoInputRef.current?.click()}
              aria-label="เลือกรูปโปรไฟล์ลูก"
              style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: '50%', background: 'var(--color-secondary)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
            >
              <Camera width={15} height={15} />
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoPick} style={{ display: 'none' }} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ font: 'var(--type-label)', color: 'var(--text-title)', marginBottom: 8 }}>ชื่อลูกน้อย</div>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="ชื่อเล่น" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ font: 'var(--type-label)', color: 'var(--text-title)', marginBottom: 8 }}>เพศลูก</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[{ val: 'male', label: '👦 ชาย' }, { val: 'female', label: '👧 หญิง' }].map(({ val, label }) => (
              <label key={val} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: `2px solid ${gender === val ? 'var(--color-primary)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', background: gender === val ? 'var(--surface-soft)' : '#fff' }}>
                <input type="radio" name="baby-arrived-gender" value={val} checked={gender === val} onChange={() => setGender(val)} style={{ accentColor: 'var(--color-primary)' }} />
                <span style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ font: 'var(--type-label)', color: 'var(--text-title)', marginBottom: 8 }}>วันเกิดลูก</div>
          <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} style={dateInputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
          <div>
            <div style={{ font: 'var(--type-label)', color: 'var(--text-title)', marginBottom: 8 }}>น้ำหนัก (กก.)</div>
            <input type="number" step="0.1" placeholder="เช่น 3.5" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={{ font: 'var(--type-label)', color: 'var(--text-title)', marginBottom: 8 }}>ส่วนสูง (ซม.)</div>
            <input type="number" step="0.1" placeholder="เช่น 50.0" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {error && <div style={{ font: 'var(--type-caption)', color: 'var(--red-600, #dc2626)', marginBottom: 8 }}>{error}</div>}

        <div style={{ marginTop: 12 }}>
          <Button variant="primary" fullWidth disabled={!canSave} loading={saving} onClick={handleSave}>บันทึกและเริ่มติดตาม</Button>
        </div>
        <button onClick={onClose} style={{ marginTop: 10, width: '100%', border: 'none', background: 'transparent', font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 0' }}>
          ยังก่อน
        </button>
      </div>
    </div>
  );
}

// Advertising / campaign banners — DB-driven (Admin manages via `banners` table).
// All slides sit side by side in one wide track; we translateX the whole
// track so it genuinely slides (old one sliding out, new one sliding in),
// not just swapping content in place. Auto-advances every 3s.
function BannerCarousel({ banners }) {
  const [index, setIndex] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef(null);
  const dragRef = useRef(null); // { startX }
  const movedRef = useRef(false);
  const count = banners?.length ?? 0;

  useEffect(() => {
    if (count <= 1 || dragging) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), 3000);
    return () => clearTimeout(t);
  }, [count, index, dragging]);

  useEffect(() => {
    if (!trackRef.current) return;
    const el = trackRef.current;
    const measure = () => setTrackWidth(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [count]);

  if (!banners || count === 0) return null;
  const safeIndex = index % count;

  const onPointerDown = (e) => {
    dragRef.current = { startX: e.clientX };
    movedRef.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const delta = e.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 4) movedRef.current = true;
    setDragOffset(delta);
  };
  const endDrag = () => {
    if (!dragRef.current) return;
    const delta = dragOffset;
    const threshold = trackWidth * 0.2;
    if (delta <= -threshold) setIndex((i) => (i + 1) % count);
    else if (delta >= threshold) setIndex((i) => (i - 1 + count) % count);
    dragRef.current = null;
    setDragging(false);
    setDragOffset(0);
  };
  const onClickCapture = (e) => {
    if (movedRef.current) {
      e.preventDefault();
      movedRef.current = false;
    }
  };

  return (
    <div style={{ padding: '18px 16px 0' }}>
      <div
        ref={trackRef}
        style={{ borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-md)', touchAction: 'pan-y', aspectRatio: '2 / 1' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        <div style={{ display: 'flex', height: '100%', transform: `translateX(${-safeIndex * trackWidth + dragOffset}px)`, transition: dragging ? 'none' : 'transform .45s cubic-bezier(.4,0,.2,1)' }}>
          {banners.map((b) => (
            <a
              key={b.id}
              href={b.link_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flex: `0 0 ${trackWidth}px`, height: '100%', textDecoration: 'none', position: 'relative', background: b.banner_img ? 'var(--surface-soft)' : 'var(--gradient-green)' }}
            >
              {b.banner_img ? (
                <img src={b.banner_img} alt={b.title || 'โปรโมชัน'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 22px', color: '#fff' }}>
                  <div style={{ font: '800 18px var(--font-display)' }}>{b.title}</div>
                  {b.subtitle && <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .95, marginTop: 4 }}>{b.subtitle}</div>}
                  {b.link_url && <div style={{ marginTop: 12, display: 'inline-block', background: 'rgba(255,255,255,.92)', color: 'var(--text-heading)', font: 'var(--weight-bold) 12px var(--font-base)', padding: '6px 14px', borderRadius: 999 }}>ดูเลย →</div>}
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
      {count > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`ไปที่แบนเนอร์ที่ ${i + 1}`}
              style={{ width: i === safeIndex ? 18 : 6, height: 6, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer', background: i === safeIndex ? 'var(--color-secondary)' : 'var(--gray-300)', transition: 'all .25s ease' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomeScreen({ go, user, child, goOnboarding, goProfile, checkin, onStreakSeen, onChildUpdate }) {
  const isGuest = !user || user.role === 'guest';
  const pts = user?.points ?? 0;
  const [latestRecord, setLatestRecord] = useState(null);
  const [showStreak, setShowStreak] = useState(false);
  const [comingSoon, setComingSoon] = useState(null);
  const [banners, setBanners] = useState([]);
  const [rewardsCatalog, setRewardsCatalog] = useState(null);
  const [showBabyArrived, setShowBabyArrived] = useState(false);

  useEffect(() => {
    if (checkin?.awarded != null) setShowStreak(true);
  }, [checkin]);

  useEffect(() => {
    fetchRewardsCatalog().then(setRewardsCatalog);
  }, []);
  const nextReward = rewardsCatalog ? nextUnlockedReward(rewardsCatalog, pts) : null;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('015_banners').select('*')
          .eq('is_active', true)
          .order('banner_no', { ascending: true });
        // target_stages: empty/null = show to everyone; otherwise only show
        // if it includes this child's stage.
        const stage = child?.stage ?? null;
        const filtered = (data || []).filter(b =>
          !b.target_stages || b.target_stages.length === 0 || (stage && b.target_stages.includes(stage)));
        if (alive) setBanners(filtered);
      } catch (e) { console.warn('[home] banners fetch failed:', e?.message); }
    })();
    return () => { alive = false; };
  }, [child?.stage]);

  const closeStreak = () => { setShowStreak(false); onStreakSeen && onStreakSeen(); };

  useEffect(() => {
    if (!child?.child_id) return;
    supabase
      .from('004_growth')
      .select('weight_kg, height_cm, recorded_date')
      .eq('child_id', child.child_id)
      .order('recorded_date', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setLatestRecord(data); });
  }, [child?.id]);

  // NOTE: 003_children only stores birth_weight/birth_height (birth-time stats),
  // not a "current weight" cache like the old schema did — so there's no
  // sensible fallback here anymore. If no growth record exists yet, this is null.
  const latestKg = latestRecord?.weight_kg ?? null;
  const latestCm = latestRecord?.height_cm ?? null;
  const sizeRec = latestKg ? recommendSize(latestKg) : null;
  const childWithRecord = child ? { ...child, _recordedAt: latestRecord?.recorded_date ?? null } : null;

  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%' }}>
      {showStreak && checkin && <StreakPopup checkin={checkin} onClose={closeStreak} />}
      {comingSoon && <ComingSoon title={comingSoon} onClose={() => setComingSoon(null)} />}
      {showBabyArrived && (
        <BabyArrivedModal
          child={child}
          lineUid={user?.line_uid}
          onClose={() => setShowBabyArrived(false)}
          onSaved={(patch) => { onChildUpdate && onChildUpdate(patch); setShowBabyArrived(false); }}
        />
      )}
      {/* Hero */}
      <div style={{
        position: 'relative',
        background: 'var(--gradient-hero)',
        backgroundImage: 'url(/home-hero-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'left top',
        padding: '12px 20px 42px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell width={20} height={20} />
            </span>
            <ProfileButton onClick={goProfile} />
          </div>
        </div>
        {isGuest
          ? <GuestHero user={user} />
          : <MemberHero user={user} child={child} />
        }
      </div>

      {/* Points card / Guest CTA card */}
      <div style={{ padding: '0 16px', marginTop: -30, position: 'relative' }}>
        {isGuest ? (
          <Card style={{ boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--surface-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <UserPlus width={26} height={26} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ font: 'var(--weight-bold) 16px var(--font-display)', color: 'var(--text-heading)' }}>สมัครสมาชิกฟรี!</div>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 2 }}>รับแต้มสะสมและสิทธิพิเศษมากมาย</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <Button variant="primary" size="sm" fullWidth onClick={() => goOnboarding('A')}>กำลังตั้งครรภ์</Button>
              <Button variant="primary" size="sm" fullWidth onClick={() => goOnboarding('B')}>มีลูกแล้ว</Button>
            </div>
          </Card>
        ) : (
          <Card style={{ boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>แต้มสะสม PAO PAO Club</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                  <span style={{ font: '800 30px var(--font-display)', color: 'var(--text-heading)' }}>{pts}</span>
                  <span style={{ font: 'var(--weight-semibold) 14px var(--font-base)', color: 'var(--text-muted)' }}>แต้ม</span>
                </div>
              </div>
              <Badge variant="solidGreen">สะสมไว้แลกของรางวัล</Badge>
            </div>
            {nextReward && (
              <div style={{ marginTop: 14 }}>
                <ProgressBar value={pts} max={nextReward.pts} tone="green" />
                <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 6 }}>อีก {nextReward.pts - pts} แต้ม แลก "{nextReward.name}" ได้เลย</div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {ACTIONS.map(({ id, Icon, label, tone, fg }) => (
            <button key={id} onClick={() => id === 'scan' ? setComingSoon('สแกนรับแต้ม') : go(id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: 0 }}>
              <span style={{ width: 56, height: 56, borderRadius: 18, background: tone, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-xs)' }}>
                <Icon width={24} height={24} />
              </span>
              <span style={{ font: 'var(--weight-medium) 11px var(--font-base)', color: 'var(--text-body)', textAlign: 'center', lineHeight: 1.25 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advertising / campaign banners (DB-driven, swipeable) */}
      <BannerCarousel banners={banners} />

      {/* Baby Info Card */}
      {!isGuest && childWithRecord && (
        <div style={{ padding: '20px 16px 0' }}>
          <BabyInfoCard child={childWithRecord} latestKg={latestKg} latestCm={latestCm} go={go} onBabyArrived={() => setShowBabyArrived(true)} />
        </div>
      )}

      {/* Recovery card — a member account with no children row at all
          (e.g. onboarding's child insert failed) has no other way back
          into this form, since the app never re-shows onboarding once
          001_users exists. */}
      {!isGuest && !child && (
        <div style={{ padding: '20px 16px 0' }}>
          <Card style={{ boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👶</div>
            <div style={{ font: 'var(--weight-bold) 16px var(--font-display)', color: 'var(--text-heading)' }}>ยังไม่มีข้อมูลลูกน้อย</div>
            <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', marginTop: 4 }}>กรอกข้อมูลลูกเพื่อเริ่มติดตามพัฒนาการและแนะนำไซส์ผ้าอ้อม</div>
            <div style={{ marginTop: 14 }}>
              <Button variant="primary" fullWidth onClick={() => setShowBabyArrived(true)}>ลงทะเบียนข้อมูลลูก</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Size Recommend Card */}
      {!isGuest && sizeRec && (
        <div style={{ padding: '12px 16px 0' }}>
          <SizeRecommendCard sizeRec={sizeRec} go={go} />
        </div>
      )}

      {/* Award banner — full-bleed like the hero, closing the page out the way it opened */}
      <div style={{ marginTop: 20 }}>
        <img
          src="/award-innovation-2025.jpg"
          alt="ผ้าอ้อมเปาเปาได้รับรางวัลสุดยอดนวัตกรรมด้านการซึมซับ Amarin Baby & Kids Awards 2025"
          style={{ width: '100%', display: 'block' }}
        />
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
