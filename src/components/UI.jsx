export const Av = ({ initials, color, size = 40, flag = false, img = null }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', overflow: 'hidden',
    background: `linear-gradient(135deg,${color},${color}aa)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: size * 0.32,
    border: '3px solid rgba(255,255,255,0.85)', position: 'relative',
    boxShadow: `0 4px 12px ${color}44`, flexShrink: 0,
  }}>
    {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    {flag && <span style={{ position: 'absolute', bottom: -4, right: -4, fontSize: Math.max(10, size * 0.28), lineHeight: 1 }}>🇨🇲</span>}
  </div>
);

export const Card = ({ children, style = {}, color, C, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, borderRadius: 20, padding: 16,
    boxShadow: '0 6px 24px rgba(0,0,0,0.09)',
    borderLeft: color ? `5px solid ${color}` : undefined,
    marginBottom: 12, cursor: onClick ? 'pointer' : undefined, ...style,
  }}>{children}</div>
);

export const Pill = ({ text, color, onClick, small = false, outline = false, disabled = false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: outline ? 'transparent' : disabled ? '#ccc' : `linear-gradient(135deg,${color},${color}bb)`,
    color: outline ? color : '#fff', border: outline ? `2px solid ${color}` : 'none',
    borderRadius: 20, padding: small ? '6px 14px' : '10px 20px',
    fontSize: small ? 12 : 14, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: outline || disabled ? 'none' : `0 4px 14px ${color}44`,
  }}>{text}</button>
);

export const Badge = ({ text, color }) => (
  <span style={{
    background: color + '22', color, borderRadius: 20,
    padding: '3px 10px', fontSize: 11, fontWeight: 700,
  }}>{text}</span>
);

export const Toggle = ({ on, onChange, color }) => (
  <div onClick={onChange} style={{
    width: 50, height: 28, borderRadius: 14, cursor: 'pointer',
    background: on ? color : '#ccc', display: 'flex', alignItems: 'center',
    padding: '0 3px', transition: 'background 0.3s', flexShrink: 0,
  }}>
    <div style={{
      width: 22, height: 22, borderRadius: '50%', background: '#fff',
      marginLeft: on ? 24 : 0, transition: 'margin 0.3s',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    }} />
  </div>
);

export const Toast = ({ msg, color }) => (
  <div style={{
    position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)',
    background: color, color: '#fff', padding: '10px 22px', borderRadius: 20,
    fontWeight: 700, fontSize: 14, zIndex: 9999,
    boxShadow: `0 8px 24px ${color}55`, whiteSpace: 'nowrap', pointerEvents: 'none',
  }}>{msg}</div>
);

export const Spinner = ({ color = '#E63946' }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      border: `4px solid ${color}33`,
      borderTop: `4px solid ${color}`,
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export const Input = ({ style = {}, C, ...props }) => (
  <input style={{
    width: '100%', padding: '12px', borderRadius: 12,
    border: `2px solid ${C.border}`, fontSize: 14, outline: 'none',
    background: C.inputBg, color: C.text, boxSizing: 'border-box',
    marginBottom: 10, ...style,
  }} {...props} />
);

export const BarChart = ({ data, color, height = 60 }) => {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height, paddingTop: 8 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%',
            background: `linear-gradient(180deg,${color},${color}88)`,
            borderRadius: '4px 4px 0 0',
            height: `${(v / max) * height * 0.85}px`,
            minHeight: 4,
          }} />
          <span style={{ fontSize: 8, color: '#aaa' }}>{i + 1}</span>
        </div>
      ))}
    </div>
  );
};
