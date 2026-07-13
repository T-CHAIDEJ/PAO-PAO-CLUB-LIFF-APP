import React, { useState, useEffect } from 'react';
import { X, Clock, ChevronRight, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Badge } from '../components/index.jsx';
import { SkyDeco } from '../shared/index.jsx';
import { supabase } from '../lib/supabase.js';

// Map a DB row (snake_case) → the shape the UI components expect (camelCase).
// NOTE: 014_articles dropped category_color/category_bg/read_min — using fixed
// defaults here so the UI still renders sensibly. Flagged for Dev B: confirm
// these were intentionally dropped, or if per-article styling should come back.
function mapArticle(r) {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    categoryColor: 'var(--blue-600)',
    categoryBg: 'var(--blue-100)',
    readMin: 3,
    heroImage: r.art_image,
    sections: r.content || [],
  };
}

// ─── Article Modal ───────────────────────────────────────────────────────────

function SectionBlock({ section }) {
  const paraStyle = {
    font: '15px/1.75 var(--font-base)',
    color: 'var(--text-body)',
    margin: 0,
  };

  switch (section.type) {
    case 'intro':
      return (
        <p style={{ ...paraStyle, color: 'var(--text-title)', fontWeight: 500 }}>
          {section.text}
        </p>
      );

    case 'section':
      return (
        <div>
          <h2 style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)', margin: '0 0 10px' }}>
            {section.heading}
          </h2>
          {section.text.split('\n\n').map((para, i) => (
            <p key={i} style={{ ...paraStyle, marginBottom: i < section.text.split('\n\n').length - 1 ? 10 : 0 }}>{para}</p>
          ))}
        </div>
      );

    case 'tips':
      return (
        <div>
          <h2 style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)', margin: '0 0 6px' }}>
            {section.heading}
          </h2>
          {section.intro && <p style={{ ...paraStyle, marginBottom: 12 }}>{section.intro}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {section.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--blue-100)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 11px var(--font-base)', flex: 'none', marginTop: 1 }}>{i + 1}</span>
                <span style={{ ...paraStyle, flex: 1 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'brand':
      return (
        <div style={{ background: 'var(--surface-soft)', borderRadius: 'var(--radius-md)', padding: '14px 16px', borderLeft: '3px solid var(--color-primary)' }}>
          <p style={{ ...paraStyle, color: 'var(--text-title)', fontStyle: 'italic' }}>{section.text}</p>
        </div>
      );

    case 'summary':
      return (
        <div style={{ background: 'var(--surface-green)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
          <div style={{ font: 'var(--weight-bold) 15px var(--font-display)', color: 'var(--green-700)', marginBottom: 8 }}>{section.heading}</div>
          <p style={{ ...paraStyle }}>{section.text}</p>
        </div>
      );

    case 'disclaimer':
      return <DisclaimerBlock section={section} />;

    default:
      return null;
  }
}

function DisclaimerBlock({ section }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 16 }}>
      <div style={{ background: 'var(--gray-50, #f9fafb)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
        <p style={{ font: '13px/1.6 var(--font-base)', color: 'var(--text-muted)', margin: '0 0 10px' }}>
          ⚕️ {section.text}
        </p>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', font: 'var(--weight-medium) 12px var(--font-base)', color: 'var(--blue-600)', cursor: 'pointer', padding: 0 }}
        >
          {open ? <ChevronUp width={14} height={14} /> : <ChevronDown width={14} height={14} />}
          {open ? 'ซ่อนแหล่งอ้างอิง' : 'ดูแหล่งอ้างอิง'}
        </button>
        {open && (
          <ul style={{ margin: '10px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {section.sources.map((s, i) => (
              <li key={i} style={{ font: '12px/1.5 var(--font-base)', color: 'var(--text-muted)' }}>{s}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ArticleModal({ article, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column',
      background: '#fff',
      animation: 'slideUp 0.28s cubic-bezier(.32,1,.23,1)',
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ position: 'relative', background: 'var(--gradient-hero)', padding: '18px 20px 22px', color: '#fff', flexShrink: 0 }}>
        <SkyDeco />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <span style={{ display: 'inline-block', background: 'rgba(255,255,255,.22)', borderRadius: 20, padding: '3px 10px', font: 'var(--weight-semibold) 11px var(--font-base)', letterSpacing: '.04em', marginBottom: 8 }}>
              {article.category}
            </span>
            <div style={{ font: '800 18px var(--font-display)', lineHeight: 1.35 }}>{article.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, opacity: .85 }}>
              <Clock width={13} height={13} />
              <span style={{ font: 'var(--weight-medium) 12px var(--font-base)' }}>อ่าน {article.readMin} นาที</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}
          >
            <X width={18} height={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {article.heroImage && (
          <img
            src={article.heroImage}
            alt={article.title}
            style={{ width: '100%', display: 'block', objectFit: 'cover' }}
          />
        )}
        <div style={{ padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {article.sections.map((section, i) => (
          <SectionBlock key={i} section={section} />
        ))}
        </div>
      </div>
    </div>
  );
}

// ─── Knowledge Screen ─────────────────────────────────────────────────────────

export default function KnowledgeScreen({ child }) {
  const [activeArticle, setActiveArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const stage = child?.stage ?? null;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('014_articles')
          .select('*')
          .eq('is_active', true)
          .order('art_no', { ascending: true });
        if (error) throw error;
        // target_stages: empty/null = show to everyone; otherwise only show
        // if it includes this child's stage.
        const filtered = (data || []).filter(a =>
          !a.target_stages || a.target_stages.length === 0 || (stage && a.target_stages.includes(stage)));
        if (alive) setArticles(filtered.map(mapArticle));
      } catch (e) {
        console.warn('[knowledge] fetch failed:', e?.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [stage]);

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
        {articles.map(article => (
          <Card
            key={article.id}
            interactive
            onClick={() => setActiveArticle(article)}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}
          >
            <span style={{ width: 48, height: 48, borderRadius: 14, background: article.categoryBg, color: article.categoryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <BookOpen width={24} height={24} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Badge variant="blue" size="sm" style={{ marginBottom: 6 }}>{article.category}</Badge>
              <div style={{ font: 'var(--weight-bold) 15px var(--font-display)', color: 'var(--text-heading)', lineHeight: 1.4, marginTop: 4 }}>
                {article.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <Clock width={12} height={12} style={{ color: 'var(--text-faint)' }} />
                <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)' }}>อ่าน {article.readMin} นาที</span>
              </div>
            </div>
            <ChevronRight width={20} height={20} style={{ color: 'var(--text-faint)', flex: 'none', marginTop: 2 }} />
          </Card>
        ))}

        {loading && (
          <div style={{ textAlign: 'center', padding: '20px 0', font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
            กำลังโหลดบทความ...
          </div>
        )}
        {!loading && articles.length === 0 && (
          <Card style={{ textAlign: 'center', padding: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📚</div>
            <div style={{ font: 'var(--weight-bold) 15px var(--font-display)', color: 'var(--text-heading)' }}>ยังไม่มีบทความ</div>
            <div style={{ font: 'var(--type-body)', color: 'var(--text-muted)', marginTop: 6 }}>บทความจะปรากฏที่นี่เมื่อทีมงานเผยแพร่</div>
          </Card>
        )}
        {!loading && articles.length > 0 && (
          <div style={{ textAlign: 'center', padding: '12px 0 4px', font: 'var(--type-caption)', color: 'var(--text-faint)' }}>
            กำลังเตรียมบทความเพิ่มเติม...
          </div>
        )}
      </div>

      {activeArticle && (
        <ArticleModal article={activeArticle} onClose={() => setActiveArticle(null)} />
      )}
    </div>
  );
}
