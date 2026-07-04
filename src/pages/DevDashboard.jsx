import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { useTontine } from '../context/TontineContext';
import { fmt } from '../utils/helpers';

export default function DevDashboard() {
  const { C } = useTheme();
  const { devSettings, updateDevSettings } = useTontine();
  const [stats, setStats] = useState({ users: 0, tontines: 0, donors: [] });
  const [mtn, setMtn] = useState(devSettings?.mtnNumber || '');
  const [orange, setOrange] = useState(devSettings?.orangeNumber || '');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMtn(devSettings?.mtnNumber || '');
    setOrange(devSettings?.orangeNumber || '');
  }, [devSettings]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'ts_users'));
        const tontinesSnap = await getDocs(collection(db, 'ts_tontines'));
        const donors = usersSnap.docs
          .filter(d => d.data().hasDonated)
          .map(d => ({ name: d.data().name, email: d.data().email, date: d.data().donationDate }));
        setStats({
          users: usersSnap.size,
          tontines: tontinesSnap.size,
          donors,
        });
      } catch (e) {
        console.log('Stats error:', e);
      }
      setLoading(false);
    };
    loadStats();
  }, []);

  const saveNumbers = async () => {
    await updateDevSettings({ mtnNumber: mtn, orangeNumber: orange });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inp = {
    width: '100%', padding: '12px', borderRadius: 10,
    border: `2px solid ${C.border}`, fontSize: 14, marginBottom: 10,
    boxSizing: 'border-box', background: C.inputBg, color: C.text, outline: 'none',
  };

  return (
    <div style={{ padding: '0 16px 80px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1A1A2E,#7B2FBE)', borderRadius: 20, padding: 20, marginBottom: 16, color: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, opacity: 0.7, letterSpacing: 1, fontWeight: 700 }}>TABLEAU DE BORD DÉVELOPPEUR</p>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900 }}>🛠️ Dev Dashboard</h2>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Accès réservé · bertolteuzong@gmail.com</p>
      </div>

      {/* Stats globales */}
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

      {/* Numéros de dépôt */}
      <div style={{ background: C.card, borderRadius: 20, padding: 18, marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <p style={{ margin: '0 0 14px', fontWeight: 800, fontSize: 15, color: C.text }}>📱 Numéros de dépôt</p>
        <p style={{ fontSize: 12, color: C.subtext, margin: '0 0 8px' }}>Ces numéros s'afficheront chez tous les utilisateurs dans le message de don.</p>

        <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 5px', fontWeight: 600 }}>MTN Mobile Money :</p>
        <input style={inp} placeholder="Ex: 6 50 00 11 22" value={mtn} onChange={e => setMtn(e.target.value)} />

        <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 5px', fontWeight: 600 }}>Orange Money :</p>
        <input style={inp} placeholder="Ex: 6 90 11 22 33" value={orange} onChange={e => setOrange(e.target.value)} />

        <button onClick={saveNumbers} style={{
          width: '100%', padding: 12, borderRadius: 12, border: 'none',
          background: saved ? '#2DC653' : 'linear-gradient(135deg,#7B2FBE,#3A86FF)',
          color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14,
        }}>
          {saved ? '✅ Numéros mis à jour !' : '💾 Enregistrer les numéros'}
        </button>

        {(devSettings?.mtnNumber || devSettings?.orangeNumber) && (
          <div style={{ marginTop: 12, padding: 12, background: C.bg, borderRadius: 10 }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: C.text }}>Numéros actuels affichés :</p>
            {devSettings?.mtnNumber && <p style={{ margin: '2px 0', fontSize: 13, color: '#FF9F1C' }}>📱 MTN : {devSettings.mtnNumber}</p>}
            {devSettings?.orangeNumber && <p style={{ margin: '2px 0', fontSize: 13, color: '#E63946' }}>📱 Orange : {devSettings.orangeNumber}</p>}
          </div>
        )}
      </div>

      {/* Liste des donateurs */}
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
    </div>
  );
}
