import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

export default function ThemeSelector() {
  const { themeId, applyTheme, THEMES, C, t } = useTheme();
  const [applied, setApplied] = useState(false);
  const [selected, setSelected] = useState(themeId);

  const handleApply = () => {
    applyTheme(selected);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: C.subtext }}>{t.chooseTheme} :</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {Object.values(THEMES).map(th => (
          <div key={th.id} onClick={() => setSelected(th.id)} style={{
            borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
            border: selected === th.id ? `3px solid ${th.primary}` : `3px solid transparent`,
            boxShadow: selected === th.id ? `0 4px 16px ${th.primary}44` : '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
          }}>
            {/* Theme preview */}
            <div style={{ background: th.gradient, height: 60, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selected === th.id && (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✓</div>
              )}
            </div>
            {/* Mini UI preview */}
            <div style={{ background: th.card, padding: '8px 10px' }}>
              <div style={{ background: th.primary, borderRadius: 6, height: 8, width: '70%', marginBottom: 4 }} />
              <div style={{ background: th.border, borderRadius: 4, height: 6, width: '50%', marginBottom: 4 }} />
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ background: th.primary, borderRadius: 4, height: 6, width: '30%' }} />
                <div style={{ background: th.secondary, borderRadius: 4, height: 6, width: '30%' }} />
              </div>
            </div>
            <div style={{ background: th.card, padding: '4px 10px 8px' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: th.text }}>{th.name}</p>
              {th.dark && <span style={{ fontSize: 10, color: th.subtext }}>Mode sombre</span>}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleApply} style={{
        width: '100%', padding: 13, borderRadius: 14, border: 'none',
        background: applied ? '#2DC653' : `linear-gradient(135deg,${C.primary},${C.secondary})`,
        color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
        boxShadow: `0 4px 16px ${C.primary}44`, transition: 'all 0.3s',
      }}>
        {applied ? `✅ ${t.themeApplied}` : t.applyTheme}
      </button>
    </div>
  );
}
