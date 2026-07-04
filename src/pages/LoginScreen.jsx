import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
  const { login, register, resetPassword } = useAuth();
  const { t } = useTheme();
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inp = {
    width: '100%', padding: '13px 16px', borderRadius: 14,
    border: '2px solid #eee', fontSize: 15, outline: 'none',
    background: '#F8F9FF', boxSizing: 'border-box', marginBottom: 12,
  };

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !pass.trim()) {
      setError('Veuillez remplir l\'email et le mot de passe.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Veuillez entrer votre nom complet.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, pass);
      } else {
        await register(email, pass, name, role);
      }
    } catch (e) {
      const msgs = {
        'auth/user-not-found': 'Compte introuvable.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/email-already-in-use': 'Email déjà utilisé.',
        'auth/weak-password': 'Mot de passe trop faible (6 caractères min).',
        'auth/invalid-email': 'Email invalide.',
      };
      setError(msgs[e.code] || 'Une erreur est survenue.');
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    setLoading(true);
    try {
      await resetPassword(forgotEmail);
      setSent(true);
    } catch (e) {
      setError('Email introuvable.');
    }
    setLoading(false);
  };

  if (forgot) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#E63946 0%,#FF9F1C 45%,#2EC4B6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>🔑</div>
          <h2 style={{ color: '#fff', fontWeight: 900, margin: '8px 0 4px' }}>{t.forgotTitle}</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: 14 }}>{t.forgotSub}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 24, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>✅</div>
              <p style={{ fontWeight: 700, color: '#2DC653', fontSize: 16 }}>{t.linkSent}</p>
              <p style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>{t.checkEmail}</p>
              <div style={{ background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 12, padding: '10px 14px', marginBottom: 20, textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#E65100', lineHeight: 1.5 }}>
                  📁 Vous ne le voyez pas ? Vérifiez votre dossier <strong>Spams / Courriers indésirables</strong> — ces emails y arrivent parfois.
                </p>
              </div>
              <button onClick={() => { setForgot(false); setSent(false); }} style={{
                padding: '12px 24px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#E63946,#FF9F1C)',
                color: '#fff', fontWeight: 700, cursor: 'pointer',
              }}>{t.backToLogin}</button>
            </div>
          ) : (
            <>
              {error && <p style={{ color: '#E63946', fontSize: 13, marginBottom: 10 }}>{error}</p>}
              <input style={inp} placeholder={t.email} type="email"
                value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
              <button onClick={handleForgot} disabled={loading} style={{
                width: '100%', padding: 15, borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#E63946,#FF9F1C)',
                color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', marginBottom: 10,
              }}>{loading ? '...' : t.sendLink}</button>
              <button onClick={() => setForgot(false)} style={{
                width: '100%', padding: 12, borderRadius: 14, border: '2px solid #eee',
                background: '#fff', color: '#888', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>{t.back}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#E63946 0%,#FF9F1C 45%,#2EC4B6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: 58, marginBottom: 8 }}>🇨🇲</div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: -1 }}>
            Tontine Structurelle
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: '6px 0 0', fontSize: 13 }}>
            La tontine moderne du Cameroun
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', background: '#F0F0F5', borderRadius: 12, padding: 4, marginBottom: 18 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
                flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
                background: mode === m ? '#fff' : 'transparent', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                color: mode === m ? '#1A1A2E' : '#999',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              }}>{m === 'login' ? t.login : t.register}</button>
            ))}
          </div>

          {error && <p style={{ color: '#E63946', fontSize: 13, marginBottom: 10, fontWeight: 600 }}>{error}</p>}

          {mode === 'register' && (
            <>
              <input style={inp} placeholder={t.fullName} value={name} onChange={e => setName(e.target.value)} />
              <p style={{ fontSize: 13, color: '#666', marginBottom: 8, fontWeight: 600 }}>{t.iAm}</p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                {[{ v: 'admin', l: t.administrator }, { v: 'member', l: t.member }].map(r => (
                  <button key={r.v} onClick={() => setRole(r.v)} style={{
                    flex: 1, padding: '11px 6px', borderRadius: 12, cursor: 'pointer',
                    fontSize: 12, fontWeight: 700,
                    border: `2px solid ${role === r.v ? '#E63946' : '#eee'}`,
                    background: role === r.v ? '#E6394615' : '#fff',
                    color: role === r.v ? '#E63946' : '#666',
                  }}>{r.l}</button>
                ))}
              </div>
              {role === 'member' && (
                <div style={{ background: '#FFF8E1', borderRadius: 12, padding: '9px 13px', marginBottom: 12, border: '1px solid #FFD54F' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#E65100' }}>{t.memberWarning}</p>
                </div>
              )}
            </>
          )}

          <input style={inp} placeholder={t.email} type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <div style={{ position: 'relative', marginBottom: 4 }}>
            <input style={{ ...inp, marginBottom: 0, paddingRight: 46 }}
              placeholder={t.password} type={showPass ? 'text' : 'password'}
              value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            <button onClick={() => setShowPass(!showPass)} style={{
              position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa',
            }}>{showPass ? '🙈' : '👁️'}</button>
          </div>

          {mode === 'login' && (
            <button onClick={() => setForgot(true)} style={{
              background: 'none', border: 'none', color: '#E63946',
              fontSize: 13, cursor: 'pointer', fontWeight: 600,
              marginBottom: 14, padding: 0, display: 'block',
            }}>{t.forgotPassword}</button>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: 15, borderRadius: 14, border: 'none',
            background: loading ? '#ccc' : 'linear-gradient(135deg,#E63946,#FF9F1C)',
            color: '#fff', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 6px 20px rgba(230,57,70,0.4)', marginTop: 4,
          }}>{loading ? t.loading : mode === 'login' ? t.connect : t.createAccount}</button>
        </div>
      </div>
    </div>
  );
}
