import React from 'react';
import { Baby, Droplet, Smile } from 'lucide-react';
import { Card, Badge } from '../components/index.jsx';
import { SkyDeco } from '../shared/index.jsx';

const CATEGORIES = [
  { Icon: Baby,    label: 'ผ้าอ้อม & ไซส์', tone: 'var(--blue-100)',  fg: 'var(--blue-600)'  },
  { Icon: Droplet, label: 'ผื่น-ผิว',        tone: 'var(--green-100)', fg: 'var(--green-700)' },
  { Icon: Smile,   label: 'ความสบายตัว',     tone: 'var(--blue-100)',  fg: 'var(--blue-600)'  },
];

export default function KnowledgeScreen() {
  return (
    <div style={{ background: 'var(--gradient-sky)', minHeight: '100%', paddingBottom: 24 }}>
      <div style={{ position: 'relative', background: 'var(--gradient-hero)', padding: '20px 20px 26px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        <div style={{ position: 'relative' }}>
          <div style={{ font: 'var(--weight-medium) 13px var(--font-base)', opacity: .9 }}>บทความ & เคล็ดลับ</div>
          <div style={{ font: '800 22px var(--font-display)', marginTop: 2 }}>ความรู้คู่คุณแม่</div>
        </div>
      </div>

      <div style={{ padding: '18px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CATEGORIES.map(({ Icon, label, tone, fg }) => (
          <Card key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 52, height: 52, borderRadius: 16, background: tone, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <Icon width={26} height={26} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ font: 'var(--weight-bold) 16px var(--font-display)', color: 'var(--text-heading)' }}>{label}</div>
              <div style={{ font: 'var(--type-body-sm)', color: 'var(--text-muted)', marginTop: 2 }}>กำลังเตรียมเนื้อหา</div>
            </div>
            <Badge variant="blue" size="sm">เร็วๆ นี้</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
