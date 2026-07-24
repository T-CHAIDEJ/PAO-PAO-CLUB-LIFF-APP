import React, { useState, useEffect } from 'react';
import { X, Clock, ChevronRight, BookOpen } from 'lucide-react';
import { Card, Badge } from '../components/index.jsx';
import { SkyDeco, ProfileButton, HERO_BG } from '../shared/index.jsx';
import { supabase } from '../lib/supabase.js';
import { currentStage } from '../lib/stage.js';

// Map a DB row (snake_case) → the shape the UI components expect (camelCase).
// 014_articles.content is a plain `text` column (not the old jsonb block-array
// design) — see ArticleBody below for how that gets rendered.
function mapArticle(r) {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    categoryColor: r.category_color || 'var(--blue-600)',
    categoryBg: r.category_bg || 'var(--blue-100)',
    readMin: r.read_min ?? 3,
    heroImage: r.art_image,
    content: r.content || '',
  };
}

// ─── Article Modal ───────────────────────────────────────────────────────────

// content is plain text: paragraphs separated by blank lines. A paragraph
// wrapped in **like this** on its own renders as a subheading — a tiny,
// dependency-free convention (not full Markdown) so admin-authored content
// can still have some structure without us assuming a specific rich-text format.
function ArticleBody({ content }) {
  const paraStyle = { font: '15px/1.75 var(--font-base)', color: 'var(--text-body)', margin: 0 };
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());

  return (
    <>
      {paragraphs.map((para, i) => {
        const headingMatch = para.trim().match(/^\*\*(.+)\*\*$/);
        if (headingMatch) {
          return (
            <h2 key={i} style={{ font: 'var(--weight-bold) 17px var(--font-display)', color: 'var(--text-heading)', margin: 0 }}>
              {headingMatch[1]}
            </h2>
          );
        }
        const lines = para.split('\n');
        return (
          <p key={i} style={paraStyle}>
            {lines.map((line, j) => (
              <React.Fragment key={j}>
                {line}
                {j < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
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
        <div style={{ padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ArticleBody content={article.content} />
        </div>
      </div>
    </div>
  );
}

// ─── Knowledge Screen ─────────────────────────────────────────────────────────

export default function KnowledgeScreen({ go, child }) {
  const [activeArticle, setActiveArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  // Derived live from birth_date (not the stored stage column, which goes
  // stale as the child ages) so age-targeted articles stay accurate.
  const stage = currentStage(child);

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
      <div style={{ ...HERO_BG, position: 'relative', padding: '20px 20px 26px', color: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <SkyDeco />
        {go && (
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <ProfileButton onClick={() => go('profile')} />
          </div>
        )}
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
