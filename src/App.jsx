import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TontineProvider, useTontine } from './context/TontineContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import LoginScreen from './pages/LoginScreen';
import DevDashboard from './pages/DevDashboard';
import {
  HomeTab, MembersTab, ParticipationTab, ChatTab,
  PollsTab, AidTab, HistoryTab, StatsTab, AdminTab, ProfileTab,
} from './components/Tabs';
import SettingsTab from './components/SettingsTab';
import { Spinner } from './components/UI';
import { requestNotificationPermission, onForegroundMessage } from './utils/helpers';

const DEV_EMAIL = 'bertolteuzong@gmail.com';

const ALL_TABS = [
  { id: 'home', icon: '🏠', fr: 'Accueil', en: 'Home' },
  { id: 'stats', icon: '📈', fr: 'Stats', en: 'Stats' },
  { id: 'members', icon: '👥', fr: 'Membres', en: 'Members' },
  { id: 'participation', icon: '✅', fr: 'Particip.', en: 'Particip.' },
  { id: 'chat', icon: '💬', fr: 'Chat', en: 'Chat' },
  { id: 'polls', icon: '🗳️', fr: 'Sondages', en: 'Polls' },
  { id: 'aid', icon: '🤝', fr: 'Aide', en: 'Aid' },
  { id: 'history', icon: '📊', fr: 'Historique', en: 'History' },
  { id: 'admin', icon: '👑', fr: 'Admin', en: 'Admin' },
  { id: 'profile', icon: '👤', fr: 'Profil', en: 'Profile' },
  { id: 'settings', icon: '⚙️', fr: 'Paramètres', en: 'Settings' },
  { id: 'dev', icon: '🛠️', fr: 'Dev', en: 'Dev', devOnly: true },
];

function SideNav({ active, setActive }) {
  const { activeTontine, isAdmin } = useTontine();
  const { C, theme, lang } = useTheme();
  const { user } = useAuth();
  const color = theme.primary;
  const isDev = user?.email === DEV_EMAIL;

  const tabs = ALL_TABS.filter(tab => {
    if (tab.devOnly) return isDev;
    if (tab.id === 'aid') return activeTontine?.aidEnabled !== false || isAdmin;
    return true;
  });

  return (
    <div style={{
      width: 66, background: C.navBg, display: 'flex', flexDirection: 'column',
      alignItems: 'center', paddingTop: 10, paddingBottom: 10, gap: 2,
      boxShadow: '2px 0 12px rgba(0,0,0,0.07)', flexShrink: 0,
      overflowY: 'auto', scrollbarWidth: 'none',
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} onClick={() => setActive(tab.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            width: 58, padding: '9px 3px', borderRadius: 14, border: 'none',
            cursor: 'pointer',
            background: isActive ? color + '20' : 'transparent',
            transition: 'background 0.2s',
          }}>
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{
              fontSize: 8, fontWeight: 700,
              color: isActive ? color : C.subtext,
              textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word',
            }}>
              {lang === 'fr' ? tab.fr : tab.en}
            </span>
            {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: color }} />}
          </button>
        );
      })}
    </div>
  );
}

function NoTontineScreen() {
  const { C, t } = useTheme();
  const { createTontine, joinTontine } = useTontine();
  const { userProfile, logout } = useAuth();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#E63946');
  const [code, setCode] = useState('');
  const [tab, setTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = userProfile?.role === 'admin';

  const inp = {
    width: '100%', padding: '12px', borderRadius: 12,
    border: `2px solid ${C.border}`, fontSize: 14, outline: 'none',
    background: C.inputBg, color: C.text, boxSizing: 'border-box', marginBottom: 10,
  };

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24, position: 'relative',
    }}>
      {/* Back to login button - was completely missing, leaving users stuck here */}
      <button onClick={logout} style={{
        position: 'absolute', top: 20, left: 20,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 20, border: `2px solid ${C.border}`,
        background: C.card, color: C.text, fontWeight: 700, fontSize: 12, cursor: 'pointer',
      }}>
        ← Retour à la connexion
      </button>

      <div style={{ fontSize: 64, marginBottom: 16 }}>🇨🇲</div>
      <h2 style={{ color: C.text, fontWeight: 900, margin: '0 0 6px', textAlign: 'center' }}>
        Tontine Structurelle
      </h2>
      <p style={{ color: C.subtext, marginBottom: 24, textAlign: 'center', fontSize: 14 }}>
        {t.noTontine}
      </p>

      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Tabs créer / rejoindre */}
        <div style={{ display: 'flex', background: C.card, borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {[
            ['create', isAdmin ? '+ Créer une tontine' : '+ Créer'],
            ['join', '🔗 Rejoindre'],
          ].map(([m, l]) => (
            <button key={m} onClick={() => setTab(m)} style={{
              flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
              background: tab === m ? '#E63946' : 'transparent',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              color: tab === m ? '#fff' : C.subtext,
            }}>{l}</button>
          ))}
        </div>

        {error && <p style={{ color: '#E63946', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>{error}</p>}

        <div style={{ background: C.card, borderRadius: 20, padding: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          {tab === 'create' ? (
            <>
              <p style={{ fontSize: 13, color: C.subtext, marginBottom: 12 }}>
                Donnez un nom à votre tontine et choisissez une couleur :
              </p>
              <input style={inp} placeholder="Nom de la tontine (ex: Tontine Femmes)" value={name} onChange={e => setName(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
                {['#E63946', '#2EC4B6', '#FF9F1C', '#7B2FBE', '#3A86FF', '#2DC653'].map(col => (
                  <div key={col} onClick={() => setColor(col)} style={{
                    width: 30, height: 30, borderRadius: '50%', background: col, cursor: 'pointer',
                    border: color === col ? '3px solid #fff' : '3px solid transparent',
                    boxShadow: color === col ? `0 0 0 2px ${col}` : 'none',
                  }} />
                ))}
              </div>
              <button onClick={async () => {
                if (!name.trim()) return setError('Entrez un nom pour la tontine');
                setLoading(true); setError('');
                try {
                  await createTontine({
                    name, color, amount: 2500, frequency: 'weekly',
                    startDate: new Date().toISOString().slice(0, 10),
                    depositPhone: '', penaltyAmount: 500,
                    description: name, rules: '', totalCycles: 10, currentCycle: 1,
                  });
                } catch (e) { setError(e.message); }
                setLoading(false);
              }} style={{
                width: '100%', padding: 14, borderRadius: 14, border: 'none',
                background: loading ? '#ccc' : `linear-gradient(135deg,${color},${color}bb)`,
                color: '#fff', fontWeight: 800, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Création...' : '🏦 Créer la tontine'}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: C.subtext, marginBottom: 12 }}>
                Entrez le code d'invitation reçu de votre administrateur :
              </p>
              <input
                style={inp}
                placeholder="Code d'invitation (ex: ABC123XY)"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
              />
              <button onClick={async () => {
                if (!code.trim()) return setError('Entrez un code d\'invitation');
                setLoading(true); setError('');
                try { await joinTontine(code); }
                catch (e) { setError(e.message); }
                setLoading(false);
              }} style={{
                width: '100%', padding: 14, borderRadius: 14, border: 'none',
                background: loading ? '#ccc' : 'linear-gradient(135deg,#2EC4B6,#3A86FF)',
                color: '#fff', fontWeight: 800, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Recherche...' : '🔗 Rejoindre la tontine'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RulesGate({ children }) {
  const { activeTontine, members, acceptRules } = useTontine();
  const { user } = useAuth();
  const { C, t } = useTheme();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentMember = members.find(m => m.uid === user?.uid);
  const needsAccept = currentMember && !currentMember.rulesAccepted && activeTontine?.rules;

  if (!needsAccept) return children;

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: C.card,
        borderRadius: 24, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>📜</div>
          <h2 style={{ fontWeight: 900, color: C.text, margin: 0 }}>{t.rules}</h2>
          <p style={{ color: C.subtext, fontSize: 13, marginTop: 6 }}>{activeTontine?.name}</p>
        </div>
        <div style={{ background: C.bg, borderRadius: 14, padding: 16, marginBottom: 20, maxHeight: 300, overflowY: 'auto' }}>
          <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{activeTontine?.rules}</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 20 }}>
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ width: 20, height: 20, accentColor: activeTontine?.color }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: activeTontine?.color }}>{t.readApproved}</span>
        </label>
        <button onClick={async () => {
          if (!accepted) return;
          setLoading(true);
          await acceptRules();
          setLoading(false);
        }} disabled={!accepted} style={{
          width: '100%', padding: 14, borderRadius: 14, border: 'none',
          background: accepted ? `linear-gradient(135deg,${activeTontine?.color},${activeTontine?.color}bb)` : '#ccc',
          color: '#fff', fontWeight: 800, fontSize: 15,
          cursor: accepted ? 'pointer' : 'not-allowed',
        }}>
          {loading ? 'Chargement...' : 'Accéder à la tontine 🚀'}
        </button>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, loading: authLoading, updateUserProfile, userProfile } = useAuth();
  const { tontines, activeTontineId, activeTontine, setActiveTontineId, loading: tontineLoading } = useTontine();
  const { C, theme, lang, t } = useTheme();
  const [tab, setTab] = useState('home');

  useEffect(() => {
    if (user) {
      requestNotificationPermission().then(token => {
        // Only write when it actually changed, to avoid a pointless Firestore
        // write on every mount (the token is usually stable across sessions).
        if (token && token !== userProfile?.fcmToken) {
          updateUserProfile({ fcmToken: token });
        }
      });
      const unsub = onForegroundMessage((payload) => {
        console.log('Notification reçue:', payload);
      });
      return unsub;
    }
  }, [user]);

  if (authLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spinner />
    </div>
  );
  if (!user) return <LoginScreen />;
  if (tontineLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Spinner />
    </div>
  );
  if (!activeTontineId || tontines.length === 0) return <NoTontineScreen />;

  const isDev = user?.email === DEV_EMAIL;
  const tabInfo = ALL_TABS.find(x => x.id === tab);

  const renderTab = () => {
    if (tab === 'dev' && isDev) return <DevDashboard />;
    switch (tab) {
      case 'home': return <HomeTab />;
      case 'stats': return <StatsTab />;
      case 'members': return <MembersTab />;
      case 'participation': return <ParticipationTab />;
      case 'chat': return <ChatTab />;
      case 'polls': return <PollsTab />;
      case 'aid': return <AidTab />;
      case 'history': return <HistoryTab />;
      case 'admin': return <AdminTab />;
      case 'profile': return <ProfileTab />;
      case 'settings': return <SettingsTab />;
      default: return null;
    }
  };

  return (
    <RulesGate>
      <div style={{
        maxWidth: 430, margin: '0 auto', minHeight: '100vh',
        background: C.bg, fontFamily: "'Segoe UI',system-ui,sans-serif",
        display: 'flex', flexDirection: 'column', transition: 'background 0.3s',
      }}>
        {/* Header — this is the app's real "chrome": it reflects the chosen
            THEME (previously it silently used the active tontine's color
            instead, which is why switching themes barely looked different
            -- the most visible surface in the whole UI never changed). */}
        <div style={{
          background: theme.gradient,
          padding: '42px 13px 9px',
          boxShadow: `0 4px 20px ${theme.primary}44`,
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <div>
              <h2 style={{ color: '#fff', margin: 0, fontSize: 15, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{theme.icon}</span> Tontine Structurelle
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: 11 }}>
                {activeTontine?.name}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
              {isDev && (
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                  DEV
                </span>
              )}
              <div style={{ position: 'relative' }}>
                <span style={{ fontSize: 19 }}>🔔</span>
                <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#FF9F1C', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.8)' }} />
              </div>
            </div>
          </div>

          {/* Tontine switcher -- keeps each tontine's own color here
              specifically, so multiple tontines stay visually distinguishable
              from one another regardless of the chosen app theme. */}
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {tontines.map(tt => (
              <button key={tt.id} onClick={() => setActiveTontineId(tt.id)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
                borderRadius: 20, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                fontWeight: 700, fontSize: 11,
                background: tt.id === activeTontineId ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.22)',
                color: tt.id === activeTontineId ? tt.color : '#fff',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: tt.id === activeTontineId ? tt.color : 'rgba(255,255,255,0.7)' }} />
                {tt.name}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <SideNav active={tab} setActive={setTab} />
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: tab === 'chat' ? '10px 12px 0' : '12px 12px 70px',
            scrollbarWidth: 'thin',
          }}>
            {tab !== 'chat' && (
              <h3 style={{ margin: '0 0 12px', fontWeight: 900, fontSize: 18, color: C.text }}>
                {tabInfo?.[lang === 'fr' ? 'fr' : 'en']}
              </h3>
            )}
            {renderTab()}
          </div>
        </div>
      </div>
    </RulesGate>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TontineProvider>
          <MainApp />
        </TontineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
