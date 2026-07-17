import { useState, useEffect } from 'react';
import { Star, Gift, Plus, ChevronRight, X } from 'lucide-react';
import { Card, Badge, Button, Tabs } from '../components/index.jsx';
import { SkyDeco, ProfileButton } from '../shared/index.jsx';
import { supabase } from '../lib/supabase.js';
import { fetchRewardsCatalog } from '../lib/rewards.js';
import { redeemReward } from '../lib/redemptions.js';

// 007_rewards has no "tag"/icon columns — these only decorate the 3
// hardcoded fallback ids (see lib/rewards.js); real DB rewards just
// won't show a badge.
const TAG_BY_ID = { sampling: 'ยอดนิยม', 'toy-bin': 'ใหม่!' };

const TAB_ITEMS = [
  { label: 'แลกของรางวัล', value: 'catalog' },
  { label: 'ประวัติการแลก', value: 'redemptions' },
];

const STATUS_META = {
  pending:   { label: 'รอดำเนินการ', bg: 'var(--yellow-100, #FFFDE7)', color: 'var(--yellow-800, #F57F17)' },
  shipped:   { label: 'จัดส่งแล้ว',   bg: 'var(--blue-100)',            color: 'var(--blue-600)' },
  used:      { label: 'ใช้แล้ว',      bg: 'var(--gray-100)',            color: 'var(--text-muted)' },
  cancelled: { label: 'ยกเลิก',       bg: '#FFF3E0',                    color: '#E65100' },
};

const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`;
}
function activityLabel(a) {
  if (a.source === 'daily_login') return `เข้าสู่ระบบต่อเนื่อง (วันที่ ${a.streak_day ?? '-'})`;
  if (a.source === 'redeem') return 'แลกของรางวัล';
  return a.source;
}

function ConfirmRedeemModal({ reward, points, saving, error, onConfirm, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 340, background: '#fff', borderRadius: 20, padding: '24px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎁</div>
        <div style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>ยืนยันแลกของรางวัล</div>
        <div style={{ font: 'var(--type-body)', color: 'var(--text-body)', marginTop: 8, lineHeight: 1.5 }}>
          ใช้ <b>{reward.pts}</b> แต้ม แลก<br />"{reward.name}"
        </div>
        <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: 6 }}>เหลือแต้มหลังแลก {points - reward.pts} แต้ม</div>
        {error && <div style={{ font: 'var(--type-caption)', color: '#dc2626', marginTop: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <Button variant="soft" fullWidth onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button variant="primary" fullWidth onClick={onConfirm} loading={saving}>ยืนยัน</Button>
        </div>
      </div>
    </div>
  );
}

function PointsHistoryModal({ activities, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>ประวัติแต้ม</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X width={16} height={16} />
          </button>
        </div>
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
            <div style={{ font: 'var(--weight-bold) 15px var(--font-display)', color: 'var(--text-heading)' }}>ยังไม่มีประวัติแต้ม</div>
            <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginTop: 6 }}>เข้าแอปทุกวันเพื่อรับแต้มสะสม</div>
          </div>
        ) : (
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {activities.map((h, i, arr) => (
              <div key={h.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: h.points > 0 ? 'var(--green-100)' : 'var(--blue-100)', color: h.points > 0 ? 'var(--green-700)' : 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  {h.points > 0 ? <Plus width={18} height={18} /> : <Gift width={18} height={18} />}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>{activityLabel(h)}</div>
                  <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{fmtDate(h.created_at)}</div>
                </div>
                <span style={{ font: 'var(--weight-bold) 15px var(--font-base)', color: h.points > 0 ? 'var(--green-600)' : 'var(--text-muted)' }}>{h.points > 0 ? '+' : ''}{h.points}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function RedeemSuccessModal({ reward, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 340, background: '#fff', borderRadius: 20, padding: '28px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <div style={{ font: 'var(--weight-bold) 18px var(--font-display)', color: 'var(--text-heading)', marginTop: 8 }}>แลกสำเร็จ!</div>
        <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>"{reward.name}"<br />ทีมงานจะติดต่อจัดส่งให้เร็วๆ นี้</div>
        <div style={{ marginTop: 18 }}>
          <Button variant="primary" fullWidth onClick={onClose}>เข้าใจแล้ว</Button>
        </div>
      </div>
    </div>
  );
}

export default function RewardsScreen({ go, user, onUserUpdate, needsConsent, onOpenConsent }) {
  const [tab, setTab] = useState('catalog');
  const [activities, setActivities] = useState([]);
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [redemptions, setRedemptions] = useState([]);
  const [rawCatalog, setRawCatalog] = useState(null); // null = still loading
  const [confirmReward, setConfirmReward] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState(null);
  const [successReward, setSuccessReward] = useState(null);

  const points = user?.points ?? 0;
  const streak = user?.login_streak ?? 0;

  const loadCatalog = () => fetchRewardsCatalog().then(setRawCatalog);
  useEffect(() => { loadCatalog(); }, []);

  const catalog = (rawCatalog ?? []).map(r => ({ ...r, Icon: Gift, tag: TAG_BY_ID[r.id] ?? null }));

  const loadActivities = () => {
    if (!user?.line_uid) return;
    supabase
      .from('006_points')
      .select('*')
      .eq('line_uid', user.line_uid)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setActivities(data || []));
  };

  const loadRedemptions = () => {
    if (!user?.line_uid) return;
    supabase
      .from('016_redemptions')
      .select('*')
      .eq('line_uid', user.line_uid)
      .order('created_at', { ascending: false })
      .then(({ data }) => setRedemptions(data || []));
  };
  useEffect(() => { loadRedemptions(); }, [user?.line_uid]);

  // reward_id (not id) is the FK 016_redemptions.reward_id points at —
  // catalog only has active rewards, so this can miss retired ones.
  const rewardNameFor = (rewardId) => catalog.find(r => r.rewardId === rewardId)?.name ?? 'ของรางวัล';

  const handleConfirmRedeem = async () => {
    if (!confirmReward || !user?.line_uid || needsConsent) return;
    setRedeeming(true); setRedeemError(null);
    try {
      const { newBalance } = await redeemReward(supabase, { lineUid: user.line_uid, reward: confirmReward, currentBalance: points });
      onUserUpdate && onUserUpdate({ points: newBalance });
      setSuccessReward(confirmReward);
      setConfirmReward(null);
      loadCatalog();
      loadActivities();
      loadRedemptions();
    } catch (e) {
      setRedeemError(e?.code === 'OUT_OF_STOCK' ? 'ของรางวัลนี้หมดแล้ว ลองแบบอื่นดูนะ' : 'แลกไม่สำเร็จ ลองใหม่อีกครั้ง');
      console.warn('[rewards] redeem failed:', e?.message);
    } finally {
      setRedeeming(false);
    }
  };

  useEffect(() => {
    if (!user?.line_uid) return;
    try {
      loadActivities();
    } catch (e) {
      console.warn('[rewards] activities fetch failed:', e?.message);
    }
  }, [user?.line_uid]);

  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ position: 'relative', background: 'var(--gradient-hero)', padding: '20px 20px 30px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        {go && (
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <ProfileButton onClick={() => go('profile')} />
          </div>
        )}
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .9 }}>แต้มสะสมของคุณ</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            <Star width={26} height={26} fill="#fff" />
            <span style={{ font: '800 42px var(--font-display)' }}>{points}</span>
          </div>
          <button
            onClick={() => setShowPointsHistory(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 2, border: 'none', background: 'none', color: '#fff', opacity: .85, font: 'var(--weight-medium) 12px var(--font-base)', cursor: 'pointer', padding: '2px 0', marginTop: 2 }}
          >
            ดูประวัติแต้ม <ChevronRight width={13} height={13} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {streak > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.18)', padding: '4px 12px', borderRadius: 999 }}>
                <span style={{ font: 'var(--weight-semibold) 12px var(--font-base)' }}>🔥 เข้าระบบต่อเนื่อง {streak} วัน</span>
              </span>
            )}
          </div>
          <div style={{ font: 'var(--type-caption)', opacity: .75, marginTop: 8 }}>แต้มหมดอายุหลังสิ้น SS1 (31 ธ.ค. 2026)</div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <Tabs value={tab} onChange={setTab} items={TAB_ITEMS} />
      </div>

      {tab === 'catalog' ? (
        <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {catalog.map((r, i) => {
            const outOfStock = r.stock != null && r.stock <= 0;
            const can = points >= r.pts && !outOfStock && r.redeemable && !needsConsent;
            const blockedByConsent = needsConsent && points >= r.pts && !outOfStock && r.redeemable;
            return (
              <Card key={r.id ?? i} padded={false} style={{ overflow: 'hidden' }}>
                <div style={{ height: 84, background: i % 2 ? 'var(--surface-green)' : 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <r.Icon width={32} height={32} style={{ color: i % 2 ? 'var(--green-600)' : 'var(--blue-500)' }} />
                  {r.tag && <span style={{ position: 'absolute', top: 8, left: 8 }}><Badge variant={r.tag === 'ใหม่!' ? 'accent' : 'solidBlue'} size="sm">{r.tag}</Badge></span>}
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ font: 'var(--weight-semibold) 13px var(--font-base)', color: 'var(--text-body)', lineHeight: 1.3, minHeight: 34 }}>{r.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '8px 0 10px' }}>
                    <Star width={14} height={14} fill="var(--color-secondary)" style={{ color: 'var(--color-secondary)' }} />
                    <span style={{ font: 'var(--weight-bold) 14px var(--font-base)', color: 'var(--text-title)' }}>{r.pts}</span>
                    <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>แต้ม</span>
                  </div>
                  <Button
                    variant={can ? 'primary' : 'soft'} size="sm" fullWidth
                    disabled={!can && !blockedByConsent}
                    onClick={() => (blockedByConsent ? onOpenConsent?.() : setConfirmReward(r))}
                  >
                    {outOfStock ? 'สินค้าหมด' : !r.redeemable ? 'ยังแลกไม่ได้' : blockedByConsent ? 'ต้องยอมรับเงื่อนไขก่อน' : can ? 'แลกเลย' : 'แต้มไม่พอ'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '16px 16px 0' }}>
          {redemptions.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🎁</div>
              <div style={{ font: 'var(--weight-bold) 15px var(--font-display)', color: 'var(--text-heading)' }}>ยังไม่มีประวัติการแลก</div>
              <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginTop: 6 }}>แลกของรางวัลแล้วจะเห็นสถานะการจัดส่งที่นี่</div>
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {redemptions.map((r, i, arr) => {
                const st = STATUS_META[r.status] ?? { label: r.status, bg: 'var(--gray-100)', color: 'var(--text-muted)' };
                return (
                  <div key={r.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                    <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      <Gift width={18} height={18} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>{rewardNameFor(r.reward_id)}</div>
                      <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{fmtDate(r.created_at)} · ใช้ {r.points_used} แต้ม</div>
                    </div>
                    <span style={{ font: 'var(--weight-semibold) 11px var(--font-base)', color: st.color, background: st.bg, padding: '4px 10px', borderRadius: 999, flex: 'none' }}>{st.label}</span>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      )}

      {showPointsHistory && (
        <PointsHistoryModal activities={activities} onClose={() => setShowPointsHistory(false)} />
      )}

      {confirmReward && (
        <ConfirmRedeemModal
          reward={confirmReward}
          points={points}
          saving={redeeming}
          error={redeemError}
          onConfirm={handleConfirmRedeem}
          onClose={() => { if (!redeeming) { setConfirmReward(null); setRedeemError(null); } }}
        />
      )}
      {successReward && (
        <RedeemSuccessModal reward={successReward} onClose={() => setSuccessReward(null)} />
      )}
    </div>
  );
}
