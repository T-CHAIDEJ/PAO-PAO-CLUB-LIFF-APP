import { X, MoreHorizontal, UserCircle2, Plus, Pencil } from 'lucide-react';
import { calcAge } from '../lib/age.js';
import { Button } from '../components/index.jsx';

// Every screen's top header shares this exact background art + box ratio
// (width:height ≈ 2.3:1, matching Home's) so headers read as "the same
// header" everywhere instead of each screen inventing its own proportions.
// overflow:hidden makes the ratio strict — screens with more header content
// than Home's must fit their own layout within it, not grow past it.
export const HERO_BG = {
  backgroundImage: 'url(/home-hero-bg.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'right 35%',
  aspectRatio: '2.3',
  overflow: 'hidden',
};

// "Feature under construction" popup — shared by every screen that has a
// visible entry point for something not built yet (notifications, contact
// page, scan-to-earn), so nothing on screen is ever a silent dead button.
export function ComingSoon({ title, onClose }) {
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

// Shown next to any disabled save/redeem/upload button while the member's
// consent version is outdated — points them at where to actually fix it
// (the banner/modal lives on Home) instead of just leaving a mystery-disabled
// button.
export function ConsentGateNotice() {
  return (
    <div style={{ font: 'var(--type-caption)', color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)', padding: '8px 12px', marginBottom: 10 }}>
      ต้องกดยอมรับเงื่อนไขความเป็นส่วนตัวฉบับใหม่ก่อน (ที่หน้าแรก) จึงจะบันทึก/แก้ไขข้อมูลได้
    </div>
  );
}

// Shown alongside a size recommendation when the child's weight also
// already qualifies for the next size up (recommendSize() always resolves
// that overlap by keeping the smaller/current size) — gives parents
// something concrete to check for themselves instead of just a number.
export function SizeBoundaryNotice({ style }) {
  return (
    <div style={{ font: 'var(--type-caption)', color: 'var(--yellow-800, #F57F17)', background: 'var(--yellow-100, #FFFDE7)', border: '1px solid #FFF59D', borderRadius: 'var(--radius-md)', padding: '10px 12px', lineHeight: 1.6, ...style }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ น้ำหนักของเจ้าตัวเล็กใกล้เกินช่วงที่เหมาะกับไซซ์นี้แล้วน้า คุณแม่ลองเช็กสัญญาณเหล่านี้กัน</div>
      • มีรอยแดงหรือรอยรัดบริเวณขาและรอบเอว<br />
      • เจ้าตัวเล็กขยับตัวไม่คล่องหรือดูอึดอัด
      <div style={{ marginTop: 6 }}>ถ้าเจอสัญญาณเหล่านี้ ถึงเวลาขยับขึ้นอีกหนึ่งไซซ์ เพื่อให้เจ้าตัวเล็กสบายตัวมากขึ้นแล้วค่ะ 🤍</div>
    </div>
  );
}

export function SkyDeco() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', color: '#fff' }}>
      <span style={{ position: 'absolute', top: 14, left: 22, fontSize: 34, opacity: .22 }}>☁</span>
      <span style={{ position: 'absolute', top: 60, right: 30, fontSize: 22, opacity: .16 }}>☁</span>
      <span style={{ position: 'absolute', top: 30, right: 96, fontSize: 14, opacity: .4 }}>✦</span>
      <span style={{ position: 'absolute', top: 78, left: 120, fontSize: 11, opacity: .35 }}>✦</span>
      <span style={{ position: 'absolute', top: 100, left: 40, fontSize: 9, opacity: .3 }}>✦</span>
    </div>
  );
}

export function Wordmark({ scale = 1, dark = false }) {
  return (
    <div style={{ background: dark ? 'transparent' : '#fff', borderRadius: 999, padding: dark ? 0 : `${6 * scale}px ${16 * scale}px`, boxShadow: dark ? 'none' : 'var(--shadow-sm)', textAlign: 'center', lineHeight: .9, display: 'inline-block' }}>
      <div style={{ font: `800 ${20 * scale}px var(--font-display)`, color: dark ? '#fff' : 'var(--blue-500)', letterSpacing: '.01em' }}>PAO PAO</div>
      <div style={{ font: `700 ${11 * scale}px var(--font-thai)`, color: dark ? 'rgba(255,255,255,.85)' : 'var(--blue-700)' }}>เปา เปา คลับ</div>
    </div>
  );
}

export function LineChrome({ title }) {
  return (
    <div style={{ height: 44, background: '#fff', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flex: 'none' }}>
      <span style={{ position: 'absolute', left: 14, color: 'var(--gray-500)', display: 'flex' }}>
        <X width={22} height={22} />
      </span>
      <span style={{ font: 'var(--weight-semibold) 15px var(--font-base)', color: 'var(--gray-700)' }}>{title}</span>
      <span style={{ position: 'absolute', right: 14, color: 'var(--gray-500)', display: 'flex' }}>
        <MoreHorizontal width={22} height={22} />
      </span>
    </div>
  );
}

// Small pill button used in every screen's header to jump to Profile.
// Always a plain icon (never the user's photo) — showing their picture
// here duplicated/clashed with the avatar Home's greeting already shows.
export function ProfileButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'rgba(255,255,255,.18)', borderRadius: 999, padding: '5px 12px 5px 5px', cursor: 'pointer', color: '#fff', flex: 'none' }}
    >
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <UserCircle2 width={16} height={16} />
      </span>
      <span style={{ font: 'var(--weight-semibold) 12px var(--font-base)' }}>โปรไฟล์</span>
    </button>
  );
}

function ChildMiniStat({ label, value, unit }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ font: '10px var(--font-base)', color: 'var(--text-faint)' }}>{label}</div>
      {value != null ? (
        <div style={{ font: 'var(--weight-bold) 14px var(--font-display)', color: 'var(--text-heading)' }}>
          {value}<span style={{ fontSize: 10, marginLeft: 2, color: 'var(--text-muted)' }}>{unit}</span>
        </div>
      ) : (
        <div style={{ font: '12px var(--font-base)', color: 'var(--text-faint)' }}>—</div>
      )}
    </div>
  );
}

function ChildMiniCard({ c, active, latestKg, latestCm, onSelect, onEdit }) {
  const childAge = calcAge(c.birth_date);
  return (
    <div
      onClick={onSelect}
      style={{
        position: 'relative', flex: '0 0 152px', textAlign: 'left', cursor: 'pointer',
        border: active ? '2px solid var(--color-secondary)' : '1px solid var(--border-default)',
        background: '#fff', borderRadius: 18, padding: 12,
        boxShadow: active ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(c); }}
        aria-label="แก้ไขข้อมูลลูก"
        style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'var(--surface-soft)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}
      >
        <Pencil width={11} height={11} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 20 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', background: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          {c.avatar_url
            ? <img src={c.avatar_url} alt={c.name || 'ลูก'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 16 }}>{c.is_pregnant ? '🤰' : '👶'}</span>}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: 'var(--weight-bold) 13px var(--font-display)', color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {c.name || (c.is_pregnant ? 'ในท้อง' : 'ลูก')}
          </div>
          <div style={{ font: '10px var(--font-base)', color: 'var(--text-faint)' }}>{c.is_pregnant ? 'ตั้งครรภ์' : childAge}</div>
        </div>
      </div>
      {!c.is_pregnant && (
        <div style={{ display: 'flex', gap: 4, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--gray-100)' }}>
          <ChildMiniStat label="น้ำหนัก" value={latestKg != null ? latestKg.toFixed(1) : null} unit="กก." />
          <ChildMiniStat label="ส่วนสูง" value={latestCm != null ? latestCm.toFixed(1) : null} unit="ซม." />
        </div>
      )}
    </div>
  );
}

// Horizontal row of full child info cards — one per child, plus an add-child
// card at the end — used everywhere a child-aware screen needs to show and
// switch between children. Each card carries its own edit (pencil) button.
// `growthByChild` is a map of child_id -> {weight_kg, height_cm} (born
// children only) so every card can show its own latest stats without a
// per-switch refetch.
export function ChildCardsRow({ childrenList, activeChildId, growthByChild, onSwitchChild, onEdit, onAdd }) {
  if (!childrenList || childrenList.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 14, marginBottom: -14, scrollbarWidth: 'thin' }}>
      {childrenList.map((c) => (
        <ChildMiniCard
          key={c.child_id}
          c={c}
          active={c.child_id === activeChildId}
          latestKg={growthByChild?.[c.child_id]?.weight_kg ?? null}
          latestCm={growthByChild?.[c.child_id]?.height_cm ?? null}
          onSelect={() => onSwitchChild(c.child_id)}
          onEdit={onEdit}
        />
      ))}
      <button
        onClick={onAdd}
        style={{ flex: '0 0 90px', border: '2px dashed var(--border-default)', background: 'transparent', borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-muted)' }}
      >
        <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus width={16} height={16} />
        </span>
        <span style={{ font: 'var(--weight-medium) 11px var(--font-base)' }}>เพิ่มลูก</span>
      </button>
    </div>
  );
}

export function SectionTitle({ children, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 12px' }}>
      <h3 style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)', margin: 0 }}>{children}</h3>
      {action && <button onClick={onAction} style={{ border: 'none', background: 'transparent', font: 'var(--weight-semibold) 13px var(--font-base)', color: 'var(--text-link)', cursor: 'pointer' }}>{action}</button>}
    </div>
  );
}
