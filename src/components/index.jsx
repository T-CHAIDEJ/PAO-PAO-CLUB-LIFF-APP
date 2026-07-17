
export function Card({ children, tone = 'white', interactive = false, padded = true, style, onClick, ...rest }) {
  const tones = {
    white: { background: 'var(--surface-card)' },
    soft:  { background: 'var(--surface-soft)' },
    green: { background: 'var(--surface-green)' },
  };
  const base = {
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-card)',
    padding: padded ? 'var(--pad-card)' : 0,
    transition: 'transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
    cursor: interactive ? 'pointer' : 'default',
    ...(tones[tone] || tones.white),
    ...style,
  };
  const enter = (e) => { if (interactive) { e.currentTarget.style.transform = 'translateY(var(--hover-lift))'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; } };
  const leave = (e) => { if (interactive) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; } };
  return <div style={base} onClick={onClick} onMouseEnter={enter} onMouseLeave={leave} {...rest}>{children}</div>;
}

export function Badge({ children, variant = 'blue', size = 'md', style, ...rest }) {
  const variants = {
    blue:       { background: 'var(--blue-100)',          color: 'var(--blue-700)' },
    green:      { background: 'var(--green-100)',         color: 'var(--green-700)' },
    solidBlue:  { background: 'var(--color-primary)',     color: 'var(--white)' },
    solidGreen: { background: 'var(--color-secondary)',   color: 'var(--white)' },
    accent:     { background: 'var(--red-500)',           color: 'var(--white)' },
    neutral:    { background: 'var(--gray-100)',          color: 'var(--gray-600)' },
  };
  const sizes = {
    sm: { padding: '2px 9px',  font: 'var(--weight-bold) 10px var(--font-base)' },
    md: { padding: '4px 12px', font: 'var(--weight-bold) 12px var(--font-base)' },
  };
  const vr = variants[variant] || variants.blue;
  const sz = sizes[size] || sizes.md;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: 'var(--radius-pill)', letterSpacing: '.02em', lineHeight: 1, whiteSpace: 'nowrap', ...sz, ...vr, ...style }} {...rest}>
      {children}
    </span>
  );
}

export function Button({ children, variant = 'primary', size = 'md', fullWidth = false, disabled = false, loading = false, leftIcon = null, rightIcon = null, type = 'button', onClick, style, ...rest }) {
  const sizes = {
    sm: { padding: '0 16px', height: 36, font: 'var(--weight-semibold) 13px var(--font-base)' },
    md: { padding: '0 22px', height: 46, font: 'var(--weight-semibold) 15px var(--font-base)' },
    lg: { padding: '0 30px', height: 54, font: 'var(--weight-bold) 17px var(--font-base)' },
  };
  const variants = {
    primary:   { background: 'var(--color-primary)',   color: 'var(--text-on-color)', boxShadow: 'var(--shadow-blue)',  border: 'none' },
    secondary: { background: 'var(--color-secondary)', color: 'var(--white)',         boxShadow: 'var(--shadow-green)', border: 'none' },
    outline:   { background: 'transparent', color: 'var(--color-primary-strong)', boxShadow: 'none', border: '2px solid var(--border-active)' },
    ghost:     { background: 'transparent', color: 'var(--color-primary-strong)', boxShadow: 'none', border: 'none' },
    soft:      { background: 'var(--surface-soft)', color: 'var(--color-primary-strong)', boxShadow: 'none', border: 'none' },
    white:     { background: '#fff', color: 'var(--green-700)', boxShadow: 'none', border: 'none' },
  };
  const sz = sizes[size] || sizes.md;
  const vr = variants[variant] || variants.primary;
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    height: sz.height, padding: sz.padding, font: sz.font,
    borderRadius: 'var(--radius-pill)', cursor: disabled || loading ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : undefined, opacity: disabled ? 0.5 : 1,
    transition: 'transform var(--dur-fast) var(--ease-out), filter var(--dur-base) var(--ease-out)',
    WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap',
    ...vr, ...style,
  };
  const handleDown = (e) => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(var(--press-scale))'; };
  const handleUp = (e) => { e.currentTarget.style.transform = 'scale(1)'; };
  const handleEnter = (e) => { if (!disabled && !loading && (variant === 'primary' || variant === 'secondary')) e.currentTarget.style.filter = 'brightness(1.05)'; };
  const handleLeave = (e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'scale(1)'; };
  return (
    <button type={type} disabled={disabled || loading} onClick={onClick} style={base}
      onMouseDown={handleDown} onMouseUp={handleUp} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...rest}>
      {loading ? <span style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'ppspin .7s linear infinite' }} /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

export function ProgressBar({ value = 0, max = 100, tone = 'blue', height = 10, showLabel = false, style, ...rest }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fills = { blue: 'var(--gradient-hero)', green: 'var(--gradient-green)', solidBlue: 'var(--color-primary)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }} {...rest}>
      <div style={{ background: 'var(--gray-100)', borderRadius: 'var(--radius-pill)', height, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 'var(--radius-pill)', background: fills[tone] || fills.blue, transition: 'width var(--dur-slow) var(--ease-out)' }} />
      </div>
      {showLabel && <span style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>{Math.round(pct)}%</span>}
    </div>
  );
}

export function Switch({ checked = false, onChange, disabled = false, style, ...rest }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      style={{ width: 52, height: 30, borderRadius: 'var(--radius-pill)', border: 'none', background: checked ? 'var(--color-primary)' : 'var(--gray-300)', position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, padding: 0, transition: 'background var(--dur-base) var(--ease-out)', ...style }} {...rest}>
      <span style={{ position: 'absolute', top: 3, left: checked ? 25 : 3, width: 24, height: 24, borderRadius: '50%', background: 'var(--white)', boxShadow: 'var(--shadow-sm)', transition: 'left var(--dur-base) var(--ease-spring)' }} />
    </button>
  );
}

export function Avatar({ src, name = '', size = 44, ring = false, style, ...rest }) {
  const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', color: 'var(--blue-700)', font: `var(--weight-bold) ${Math.round(size * 0.38)}px var(--font-base)`, boxShadow: ring ? '0 0 0 3px var(--white), 0 0 0 5px var(--blue-300)' : 'none', ...style }} {...rest}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (initials || '?')}
    </div>
  );
}

export function Tabs({ items = [], value, onChange, style, ...rest }) {
  const idx = Math.max(0, items.findIndex(it => (it.value ?? it) === value));
  return (
    <div style={{ display: 'flex', position: 'relative', background: 'var(--surface-soft)', borderRadius: 'var(--radius-pill)', padding: '4px', gap: '2px', ...style }} {...rest}>
      <div style={{ position: 'absolute', top: 4, bottom: 4, left: `calc(4px + ${idx} * ((100% - 8px) / ${items.length}))`, width: `calc((100% - 8px) / ${items.length})`, background: 'var(--white)', borderRadius: 'var(--radius-pill)', boxShadow: 'var(--shadow-sm)', transition: 'left var(--dur-base) var(--ease-out)' }} />
      {items.map((it, i) => {
        const val = it.value ?? it;
        const label = it.label ?? it;
        const active = val === value;
        return (
          <button key={i} type="button" onClick={() => onChange && onChange(val)} style={{ position: 'relative', flex: 1, border: 'none', background: 'transparent', cursor: 'pointer', padding: '9px 8px', borderRadius: 'var(--radius-pill)', font: 'var(--weight-semibold) 14px var(--font-base)', color: active ? 'var(--color-primary-strong)' : 'var(--text-muted)', transition: 'color var(--dur-base) var(--ease-out)', whiteSpace: 'nowrap' }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}
