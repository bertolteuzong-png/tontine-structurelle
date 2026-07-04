import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTontine } from '../context/TontineContext';
import { useTheme } from '../context/ThemeContext';

export default function DonationBanner() {
  const { user, userProfile } = useAuth();
  const { devSettings } = useTontine();
  const { C } = useTheme();
  const [open, setOpen] = useState(false);
  // Initialised from the real saved value so a page reload doesn't make an
  // already-thanked donor look like they never donated.
  const [donated, setDonated] = useState(!!userProfile?.hasDonated);
  const [showThanks, setShowThanks] = useState(false);

  const handleDonate = async () => {
    setDonated(true);
    setShowThanks(true);
    if (user) {
      await updateDoc(doc(db, 'ts_users', user.uid), {
        hasDonated: true,
        donationDate: new Date().toLocaleDateString('fr-FR'),
      });
    }
    setTimeout(() => setShowThanks(false), 4000);
  };

  if (showThanks) return (
    <div style={{
      background: 'linear-gradient(135deg,#2DC653,#00B4D8)',
      borderRadius: 20, padding: 20, marginBottom: 14, textAlign: 'center',
      boxShadow: '0 8px 32px rgba(45,198,83,0.4)',
      animation: 'pulse 1s ease-in-out',
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
      <p style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: 18 }}>Merci pour votre soutien !</p>
      <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>Votre générosité nous aide à améliorer l'application. 🙏</p>
    </div>
  );

  return (
    <div style={{
      background: 'linear-gradient(135deg,#1A1A2E,#3A0F6B)',
      borderRadius: 20, padding: 18, marginBottom: 14,
      boxShadow: '0 8px 32px rgba(26,26,46,0.4)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>🙏</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 6px', color: '#FFD700', fontWeight: 900, fontSize: 14, fontFamily: 'Georgia, serif' }}>
            Vous aimez cette application ?
          </p>
          <p style={{ margin: '0 0 10px', color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 1.6 }}>
            Soutenez son développement par un don via Orange Money ou MTN MoMo. Chaque contribution aide à améliorer le service. Merci !
          </p>

          {/* Bouton consulter numéros */}
          <button onClick={() => setOpen(!open)} style={{
            padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(255,215,0,0.5)',
            background: 'rgba(255,215,0,0.1)', color: '#FFD700',
            fontWeight: 700, cursor: 'pointer', fontSize: 12, marginBottom: open ? 10 : 0,
          }}>
            {open ? '▲ Masquer les numéros' : '▼ Consulter les numéros de dépôt'}
          </button>

          {/* Menu déroulant numéros */}
          {open && (
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
              {devSettings?.mtnNumber ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>📱</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#FFD700', fontWeight: 700 }}>MTN Mobile Money</p>
                    <p style={{ margin: 0, fontSize: 15, color: '#fff', fontWeight: 900 }}>{devSettings.mtnNumber}</p>
                  </div>
                </div>
              ) : (
                <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>📱 MTN : Numéro bientôt disponible</p>
              )}
              {devSettings?.orangeNumber ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>📱</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#FF9F1C', fontWeight: 700 }}>Orange Money</p>
                    <p style={{ margin: 0, fontSize: 15, color: '#fff', fontWeight: 900 }}>{devSettings.orangeNumber}</p>
                  </div>
                </div>
              ) : (
                <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>📱 Orange : Numéro bientôt disponible</p>
              )}

              {/* Case à cocher don */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: donated ? 'default' : 'pointer' }}>
                <input
                  type="checkbox"
                  checked={donated}
                  onChange={!donated ? handleDonate : undefined}
                  style={{ width: 18, height: 18, accentColor: '#2DC653' }}
                />
                <span style={{ fontSize: 13, color: donated ? '#2DC653' : 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                  {donated ? '✅ Don effectué — Merci !' : 'Cocher si vous avez effectué un don'}
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
