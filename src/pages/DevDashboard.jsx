import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { useTontine } from '../context/TontineContext';

export default function DevDashboard() {
  const { C } = useTheme();
  const { devSettings, updateDevSettings } = useTontine();
  const [stats, setStats] = useState({ users: 0, tontines: 0, donors: [] });
  const [feedback, setFeedback] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [mtn, setMtn] = useState('');
  const [mtnName, setMtnName] = useState('');
  const [orange, setOrange] = useState('');
  const [orangeName, setOrangeName] = useState('');
  const [saveState, setSaveState] = useState('idle'); // idle | saving | success | error
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setMtn(devSettings?.mtnNumber || '');
    setMtnName(devSettings?.mtnName || '');
    setOrange(devSettings?.orangeNumber || '');
    setOrangeName(devSettings?.orangeName || '');
  }, [devSettings]);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'ts_feedback'), orderBy('createdAt', 'desc')),
      snap => setFeedback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'ts_users'));
        const tontinesSnap = await getDocs(collection(db, 'ts_tontines'));
        const donors = usersSnap.docs
          .filter(d => d.data().hasDonated)
          .map(d => ({ name: d.data().name, email: d.data().email, date: d.data().donationDate }));
        setStats({ users: usersSnap.size, tontines: tontinesSnap.size, donors });
      } catch (e) {
        console.log('Stats error:', e);
      }
    };
    loadStats();
  }, []);

  const saveNumbers = async () => {
    setSaveState('saving');
    setSaveError('');
    const result = await updateDevSettings({
      mtnNumber: mtn, mtnName, orangeNumber: orange, orangeName,
    });
    if (result.success) {
      setSaveState('success');
      setTimeout(() => setSaveState('idle'), 2500);
    } else {
      setSaveState('error');
      setSaveError(result.error || 'Échec de la sauvegarde. Vérifiez votre connexion et réessayez.');
    }
  };

  const inp = {
    width: '100%', padding: '12px', borderRadius: 10,
    border: `2px solid ${C.border}`, fontSize: 14, marginBottom: 10,
    boxSizing: 'border-box', background: C.inputBg, color: C.text, outline: 'none',
  };

  const buttonLabel = {
    idle: '💾 Enregistrer les numéros',
    saving: '⏳ Enregistrement...',
    success: '✅ Numéros mis à jour !',
    error: '❌ Échec — réessayer',
  }[saveState];

  const buttonColor = saveState === 'success' ? '#2DC653'
    : saveState === 'error' ? '#E63946'
    : 'linear-gradient(135deg,#7B2FBE,#3A86FF)';

  return (
    <div style={{ padding: '0 16px 80px' }}>
      <div style={{ background: 'linear-gradient(135deg,#1A1A2E,#7B2FBE)', borderRadius: 20, padding: 20, marginBottom: 16, color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, opacity: 0.7, letterSpacing: 1, fontWeight: 700 }}>TABLEAU DE BORD DÉVELOPPEUR</p>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900 }}>🛠️ Dev Dashboard</h2>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Accès réservé · bertolteuzong@gmail.com</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Utilisateurs', value: stats.users, icon: '👥', color: '#3A86FF' },
          { label: 'Tontines', value: stats.tontines, icon: '🏦', color: '#E63946' },
          { label: 'Donateurs', value: stats.donors.length, icon: '🙏', color: '#2DC653' },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, borderRadius: 16, padding: '14px 10px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 22, color: s.color }}>{s.value}</p>
            <p style={{ margin: '3px 0 0', fontSize: 10, color: C.subtext }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: C.card, borderRadius: 20, padding: 18, marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <p style={{ margin: '0 0 14px', fontWeight: 800, fontSize: 15, color: C.text }}>📱 Numéros de dépôt</p>
        <p style={{ fontSize: 12, color: C.subtext, margin: '0 0 12px' }}>Ces numéros s'afficheront chez tous les utilisateurs dans le message de don.</p>

        <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 5px', fontWeight: 600 }}>MTN Mobile Money — numéro</p>
        <input style={inp} placeholder="Ex: 6 50 00 11 22" value={mtn} onChange={e => setMtn(e.target.value)} />
        <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 5px', fontWeight: 600 }}>MTN Mobile Money — nom du titulaire</p>
        <input style={inp} placeholder="Ex: Bertol Teuzong" value={mtnName} onChange={e => setMtnName(e.target.value)} />

        <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 5px', fontWeight: 600 }}>Orange Money — numéro</p>
        <input style={inp} placeholder="Ex: 6 90 11 22 33" value={orange} onChange={e => setOrange(e.target.value)} />
        <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 5px', fontWeight: 600 }}>Orange Money — nom du titulaire</p>
        <input style={inp} placeholder="Ex: Bertol Teuzong" value={orangeName} onChange={e => setOrangeName(e.target.value)} />

        <button onClick={saveNumbers} disabled={saveState === 'saving'} style={{
          width: '100%', padding: 12, borderRadius: 12, border: 'none',
          background: buttonColor, color: '#fff', fontWeight: 700,
          cursor: saveState === 'saving' ? 'not-allowed' : 'pointer', fontSize: 14,
        }}>
          {buttonLabel}
        </button>
        {saveState === 'error' && (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#E63946' }}>⚠️ {saveError}</p>
        )}

        {(devSettings?.mtnNumber || devSettings?.orangeNumber) && (
          <div style={{ marginTop: 12, padding: 12, background: C.bg, borderRadius: 10 }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: C.text }}>Actuellement affiché chez les utilisateurs :</p>
            {devSettings?.mtnNumber && (
              <p style={{ margin: '2px 0', fontSize: 13, color: '#FF9F1C' }}>
                📱 MTN : {devSettings.mtnNumber}{devSettings.mtnName ? ` — ${devSettings.mtnName}` : ''}
              </p>
            )}
            {devSettings?.orangeNumber && (
              <p style={{ margin: '2px 0', fontSize: 13, color: '#E63946' }}>
                📱 Orange : {devSettings.orangeNumber}{devSettings.orangeName ? ` — ${devSettings.orangeName}` : ''}
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ background: C.card, borderRadius: 20, padding: 18, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <p style={{ margin: '0 0 14px', fontWeight: 800, fontSize: 15, color: C.text }}>🙏 Donateurs</p>
        {stats.donors.length === 0 ? (
          <p style={{ color: C.subtext, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucun don enregistré pour le moment</p>
        ) : (
          stats.donors.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < stats.donors.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <span style={{ fontSize: 20 }}>🙏</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.text }}>{d.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: C.subtext }}>{d.email} · {d.date}</p>
              </div>
              <span style={{ fontSize: 18 }}>✅</span>
            </div>
          ))
        )}
      </div>
      <div style={{ background: C.card, borderRadius: 20, padding: 18, marginTop: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 15, color: C.text }}>💬 Problèmes & Suggestions</p>
        <div style={{ display: 'flex', gap: 7, marginBottom: 14, overflowX: 'auto' }}>
          {[['all', 'Tout'], ['problem', '⚠️ Problèmes'], ['suggestion', '💡 Suggestions'], ['new', 'Non lus']].map(([v, l]) => (
            <button key={v} onClick={() => setFeedbackFilter(v)} style={{
              padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: feedbackFilter === v ? '#7B2FBE' : C.bg,
              color: feedbackFilter === v ? '#fff' : C.subtext, fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap',
            }}>{l}</button>
          ))}
        </div>
        {feedback
          .filter(f => feedbackFilter === 'all' ? true : feedbackFilter === 'new' ? f.status === 'new' : f.type === feedbackFilter)
          .length === 0 ? (
            <p style={{ color: C.subtext, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucun message pour le moment</p>
        ) : (
          feedback
            .filter(f => feedbackFilter === 'all' ? true : feedbackFilter === 'new' ? f.status === 'new' : f.type === feedbackFilter)
            .map(f => (
              <div key={f.id} style={{ background: C.bg, borderRadius: 14, padding: 14, marginBottom: 10, borderLeft: `4px solid ${f.type === 'problem' ? '#E63946' : '#FF9F1C'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: f.type === 'problem' ? '#E63946' : '#FF9F1C' }}>
                    {f.type === 'problem' ? '⚠️ Problème' : '💡 Suggestion'}
                  </span>
                  {f.status === 'new'
                    ? <span style={{ fontSize: 10, background: '#3A86FF22', color: '#3A86FF', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>Nouveau</span>
                    : <span style={{ fontSize: 10, background: '#2DC65322', color: '#2DC653', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>Résolu</span>}
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: C.text, lineHeight: 1.5 }}>{f.message}</p>
                <p style={{ margin: '0 0 8px', fontSize: 11, color: C.subtext }}>
                  {f.userName} · {f.userEmail} {f.tontineName ? `· ${f.tontineName}` : ''}
                </p>
                <button onClick={() => updateDoc(doc(db, 'ts_feedback', f.id), { status: f.status === 'new' ? 'resolved' : 'new' })} style={{
                  padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  background: f.status === 'new' ? '#2DC65322' : C.card, color: f.status === 'new' ? '#2DC653' : C.subtext,
                }}>
                  {f.status === 'new' ? '✅ Marquer résolu' : '↩️ Remettre en nouveau'}
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
