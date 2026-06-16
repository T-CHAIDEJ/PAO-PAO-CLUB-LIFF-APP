import React, { useState } from 'react';
import { Scale, Ruler, Circle, Calendar, Plus, X } from 'lucide-react';
import { Card, Badge, Button } from '../components/index.jsx';
import { SectionTitle } from '../shared/index.jsx';
import { getWHOData, getWHOValueAtMonth, getStatus, getStatusLabel } from '../data/whoData.js';

const GENDER = 'female';
const BIRTH_DATE = '2025-08-01';
const TODAY = '2026-06-16';

const INITIAL_RECORDS = [
  { id: 1, date: '2025-08-05', weightKg: 3.3, heightCm: 49.5, headCm: 34.0 },
  { id: 2, date: '2025-11-10', weightKg: 5.8, heightCm: 60.5, headCm: 39.0 },
  { id: 3, date: '2026-02-12', weightKg: 7.0, heightCm: 66.0, headCm: 41.5 },
  { id: 4, date: '2026-05-20', weightKg: 8.3, heightCm: 71.5, headCm: 43.0 },
];

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function ageInMonths(birthDate, atDate) {
  const ms = new Date(atDate) - new Date(birthDate);
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 30.4375));
}

function formatThaiDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

const STATUS_BADGE = {
  normal: 'green',
  low: 'accent',
  high: 'accent',
  unknown: 'neutral',
};

const METRICS = [
  { key: 'weightKg', indicator: 'wfa', label: 'น้ำหนัก', unit: 'กก.', Icon: Scale,  tone: 'var(--blue-100)',  fg: 'var(--blue-600)'  },
  { key: 'heightCm', indicator: 'lhfa', label: 'ส่วนสูง', unit: 'ซม.', Icon: Ruler,  tone: 'var(--green-100)', fg: 'var(--green-700)' },
  { key: 'headCm',   indicator: 'hcfa', label: 'รอบศีรษะ', unit: 'ซม.', Icon: Circle, tone: 'var(--blue-100)',  fg: 'var(--blue-600)'  },
];

function RangeBar({ value, who, status }) {
  const span = who.sd2pos - who.sd2neg || 1;
  const pct = Math.max(0, Math.min(100, ((value - who.sd2neg) / span) * 100));
  const medianPct = Math.max(0, Math.min(100, ((who.median - who.sd2neg) / span) * 100));
  const fill = status === 'normal' ? 'var(--gradient-green)' : 'var(--red-400)';
  return (
    <div style={{ position: 'relative', height: 8, background: 'var(--gray-100)', borderRadius: 'var(--radius-pill)', marginTop: 10 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: fill, borderRadius: 'var(--radius-pill)', transition: 'width var(--dur-slow) var(--ease-out)' }} />
      <div style={{ position: 'absolute', left: `${medianPct}%`, top: -2, width: 2, height: 12, background: 'var(--blue-300)', borderRadius: 1 }} />
    </div>
  );
}

function StatusCard({ metric, value, who, status }) {
  const { label, unit, Icon, tone, fg } = metric;
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 42, height: 42, borderRadius: 12, background: tone, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon width={21} height={21} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ font: '800 24px var(--font-display)', color: 'var(--text-heading)' }}>{value.toFixed(1)}</span>
            <span style={{ font: 'var(--weight-semibold) 13px var(--font-base)', color: 'var(--text-muted)' }}>{unit}</span>
          </div>
        </div>
        <Badge variant={STATUS_BADGE[status]} size="sm">{getStatusLabel(status)}</Badge>
      </div>
      <RangeBar value={value} who={who} status={status} />
      <div style={{ font: 'var(--type-caption)', color: 'var(--text-faint)', marginTop: 6 }}>เกณฑ์ WHO: {who.sd2neg}–{who.sd2pos} {unit}</div>
    </Card>
  );
}

function GrowthChart({ records }) {
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  const points = sorted.map(r => ({ month: ageInMonths(BIRTH_DATE, r.date), weightKg: r.weightKg }));

  const minMonth = Math.max(0, Math.floor(Math.min(...points.map(p => p.month))) - 1);
  const maxMonth = Math.ceil(Math.max(...points.map(p => p.month))) + 1;

  const wfa = getWHOData(GENDER, 'wfa');
  const monthsForWHO = Array.from(new Set([
    minMonth,
    ...wfa.filter(d => d.month > minMonth && d.month < maxMonth).map(d => d.month),
    maxMonth,
  ])).sort((a, b) => a - b);
  const whoSeries = monthsForWHO.map(m => ({ month: m, ...getWHOValueAtMonth(GENDER, 'wfa', m) }));

  const wMin = Math.min(...points.map(p => p.weightKg), ...whoSeries.map(d => d.sd2neg)) - 0.3;
  const wMax = Math.max(...points.map(p => p.weightKg), ...whoSeries.map(d => d.sd2pos)) + 0.3;

  const W = 326, H = 170;
  const margin = { top: 14, right: 14, bottom: 26, left: 8 };
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;

  const monthSpan = (maxMonth - minMonth) || 1;
  const weightSpan = (wMax - wMin) || 1;
  const xScale = (m) => margin.left + ((m - minMonth) / monthSpan) * plotW;
  const yScale = (w) => margin.top + (1 - (w - wMin) / weightSpan) * plotH;

  const toPath = (data, key) => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.month).toFixed(1)} ${yScale(d[key]).toFixed(1)}`).join(' ');

  return (
    <Card>
      <SectionTitle>กราฟน้ำหนักเทียบเกณฑ์ WHO</SectionTitle>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <path d={toPath(whoSeries, 'sd2pos')} fill="none" stroke="var(--gray-300)" strokeWidth="1.5" strokeDasharray="3 4" />
        <path d={toPath(whoSeries, 'median')} fill="none" stroke="var(--blue-300)" strokeWidth="1.5" strokeDasharray="3 4" />
        <path d={toPath(whoSeries, 'sd2neg')} fill="none" stroke="var(--gray-300)" strokeWidth="1.5" strokeDasharray="3 4" />
        <path d={toPath(points, 'weightKg')} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />
        {points.map((p, i) => (
          <circle key={i} cx={xScale(p.month)} cy={yScale(p.weightKg)} r="3.5" fill="var(--blue-600)" stroke="#fff" strokeWidth="1.5" />
        ))}
        <text x={margin.left} y={H - 6} font="var(--weight-medium) 9px var(--font-base)" fill="var(--text-faint)">{Math.round(minMonth)} เดือน</text>
        <text x={W - margin.right} y={H - 6} textAnchor="end" font="var(--weight-medium) 9px var(--font-base)" fill="var(--text-faint)">{Math.round(maxMonth)} เดือน</text>
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          <span style={{ width: 14, height: 2, background: 'var(--color-primary)', borderRadius: 1 }} />น้ำหนักลูก
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          <span style={{ width: 14, height: 2, background: 'var(--gray-300)', borderRadius: 1, backgroundImage: 'repeating-linear-gradient(90deg, var(--gray-400) 0 3px, transparent 3px 6px)' }} />ช่วงเกณฑ์ WHO
        </span>
      </div>
    </Card>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ font: 'var(--type-label)', color: 'var(--text-title)', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', height: 46, padding: '0 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)', font: 'var(--type-body)', color: 'var(--text-body)',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
};

function AddRecordPanel({ onCancel, onSave }) {
  const [date, setDate] = useState(TODAY);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');

  const canSave = date && weight && height && head;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: Date.now(),
      date,
      weightKg: parseFloat(weight),
      heightCm: parseFloat(height),
      headCm: parseFloat(head),
    });
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)' }}>บันทึกข้อมูลใหม่</h3>
        <button onClick={onCancel} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--surface-soft)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X width={18} height={18} />
        </button>
      </div>
      <FormField label="วันที่บันทึก">
        <div style={{ position: 'relative' }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          <Calendar width={18} height={18} style={{ position: 'absolute', right: 14, top: 14, color: 'var(--text-faint)', pointerEvents: 'none' }} />
        </div>
      </FormField>
      <FormField label="น้ำหนัก (กก.)">
        <input type="number" step="0.1" placeholder="เช่น 8.5" value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} />
      </FormField>
      <FormField label="ส่วนสูง (ซม.)">
        <input type="number" step="0.1" placeholder="เช่น 70.0" value={height} onChange={(e) => setHeight(e.target.value)} style={inputStyle} />
      </FormField>
      <FormField label="รอบศีรษะ (ซม.)">
        <input type="number" step="0.1" placeholder="เช่น 43.0" value={head} onChange={(e) => setHead(e.target.value)} style={inputStyle} />
      </FormField>
      <Button variant="primary" fullWidth disabled={!canSave} onClick={handleSave} leftIcon={<Plus width={18} height={18} />}>บันทึก</Button>
    </Card>
  );
}

function OverviewPanel({ records, onAddNew }) {
  const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const latestAge = ageInMonths(BIRTH_DATE, latest.date);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {METRICS.map((metric) => {
          const value = latest[metric.key];
          const who = getWHOValueAtMonth(GENDER, metric.indicator, latestAge);
          const status = getStatus(value, who);
          return <StatusCard key={metric.key} metric={metric} value={value} who={who} status={status} />;
        })}
      </div>

      <GrowthChart records={records} />

      <div>
        <SectionTitle>รายการบันทึกย้อนหลัง</SectionTitle>
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {sorted.slice().reverse().map((r, i, arr) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gray-50)', color: 'var(--blue-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Scale width={18} height={18} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ font: 'var(--weight-medium) 14px var(--font-base)', color: 'var(--text-body)' }}>{r.weightKg.toFixed(1)} กก. · {r.heightCm.toFixed(1)} ซม. · {r.headCm.toFixed(1)} ซม.</div>
              </div>
              <span style={{ font: 'var(--type-caption)', color: 'var(--text-faint)' }}>{formatThaiDate(r.date)}</span>
            </div>
          ))}
        </Card>
      </div>

      <Button variant="primary" fullWidth onClick={onAddNew} leftIcon={<Plus width={18} height={18} />}>บันทึกข้อมูลใหม่</Button>
    </div>
  );
}

export function GrowthPanel() {
  const [view, setView] = useState('overview');
  const [records, setRecords] = useState(INITIAL_RECORDS);

  const handleSave = (record) => {
    setRecords(prev => [...prev, record]);
    setView('overview');
  };

  if (view === 'add') {
    return <AddRecordPanel onCancel={() => setView('overview')} onSave={handleSave} />;
  }
  return <OverviewPanel records={records} onAddNew={() => setView('add')} />;
}

export default GrowthPanel;
