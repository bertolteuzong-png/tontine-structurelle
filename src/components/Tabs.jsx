import { useState, useRef, useEffect } from 'react';
import { useTontine } from '../context/TontineContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Av, Card, Pill, Badge, Toggle, Toast, Spinner, Input, BarChart } from './UI';
import { fmt, compressImage, startAudioRecording, exportHistoryPDF, exportReceiptPDF, getNextDate, computeParticipationRate } from '../utils/helpers';
import DonationBanner from './DonationBanner';

// ─── HOME ─────────────────────────────────────────────────────────────────────
export function HomeTab() {
  const { activeTontine: tn, members, aid, history } = useTontine();
  const { C, t } = useTheme();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [approved, setApproved] = useState(false);
  if (!tn) return null;

  const paid = members.filter(m => m.paid).length;
  const total = paid * tn.amount;

  // Calculate penalty total from history
  const penaltyTotal = history
    .filter(h => h.type === 'penalty')
    .reduce((sum, h) => sum + (h.amount || 0), 0);

  const rotation = members.map((m, i) => ({
    pos: m.pos, name: m.name,
    date: getNextDate(tn.startDate, tn.frequency, m.pos),
    status: i < (tn.currentCycle - 1) ? 'done' : i === (tn.currentCycle - 1) ? 'current' : 'upcoming',
  }));
  const current = rotation.find(r => r.status === 'current');
  const next = rotation.find(r => r.status === 'upcoming');

  return (
    <div>
      {/* Donation banner */}
      <DonationBanner />

      {/* Hero balance */}
      <div style={{ background: `linear-gradient(135deg,${tn.color},${tn.color}bb)`, borderRadius: 24, padding: 22, marginBottom: 12, color: '#fff', boxShadow: `0 12px 40px ${tn.color}44` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, opacity: 0.85, fontWeight: 700, letterSpacing: 1 }}>{t.totalBalance}</p>
            <h2 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>{fmt(total)}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.8 }}>{paid}/{members.length} {t.cotised}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 34 }}>💰</div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '4px 10px', marginTop: 6 }}>
              <p style={{ margin: 0, fontSize: 11 }}>{t.cycle} {tn.currentCycle}/{tn.totalCycles || '?'}</p>
            </div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '9px 13px' }}>
          <p style={{ margin: 0, fontSize: 12 }}>📱 {t.deposit} : <strong>{tn.depositPhone || 'Non défini'}</strong></p>
        </div>
      </div>

      {/* Penalty total */}
      {penaltyTotal > 0 && (
        <Card C={C} color="#E63946">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: '#E63946', fontWeight: 700, letterSpacing: 1 }}>⚠️ TOTAL PÉNALITÉS</p>
              <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: C.text }}>{fmt(penaltyTotal)}</p>
            </div>
            <span style={{ fontSize: 32 }}>⚠️</span>
          </div>
        </Card>
      )}

      <Card C={C} color={tn.color}>
        <p style={{ margin: 0, fontWeight: 700, color: tn.color, fontSize: 13 }}>📋 {tn.description}</p>
      </Card>

      {/* Rules accordion - only if rules exist */}
      {tn.rules && (
        <div style={{ background: C.card, borderRadius: 18, marginBottom: 12, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}>
          <button onClick={() => setRulesOpen(!rulesOpen)} style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>📜 {t.rules}</span>
            <span style={{ color: C.subtext, fontSize: 18, display: 'inline-block', transform: rulesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>
          {rulesOpen && (
            <div style={{ padding: '0 16px 16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: C.subtext, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{tn.rules}</p>
            </div>
          )}
        </div>
      )}

      {current && (
        <Card C={C} style={{ background: '#FF9F1C12', border: '2px solid #FF9F1C' }}>
          <p style={{ margin: '0 0 8px', fontSize: 10, color: '#FF9F1C', fontWeight: 700, letterSpacing: 1 }}>🍽️ {t.whoEats}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Av initials={current.name.split(' ').map(w => w[0]).join('').slice(0, 2)} color="#FF9F1C" size={48} flag />
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: C.text }}>{current.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.subtext }}>📅 {current.date} · ⏰ {tn.deadline || '18h00'}</p>
            </div>
          </div>
        </Card>
      )}

      {next && (
        <Card C={C}>
          <p style={{ margin: '0 0 6px', fontSize: 10, color: C.subtext, fontWeight: 700, letterSpacing: 1 }}>⏭️ {t.next}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Av initials={next.name.split(' ').map(w => w[0]).join('').slice(0, 2)} color="#2EC4B6" size={38} flag />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: C.text }}>{next.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.subtext }}>📅 {next.date}</p>
            </div>
          </div>
        </Card>
      )}

      {aid?.active && (
        <Card C={C} color="#7B2FBE">
          <p style={{ margin: '0 0 6px', fontSize: 10, color: '#7B2FBE', fontWeight: 700, letterSpacing: 1 }}>🤝 {t.aidOngoing}</p>
          <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 14, color: C.text }}>{aid.title}</p>
          <div style={{ background: C.border, borderRadius: 10, overflow: 'hidden', height: 10 }}>
            <div style={{ width: `${Math.min(100, (aid.collected / aid.goal) * 100)}%`, height: '100%', background: 'linear-gradient(90deg,#7B2FBE,#2EC4B6)', borderRadius: 10 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#7B2FBE' }}>{fmt(aid.collected)}</span>
            <span style={{ fontSize: 11, color: C.subtext }}>/ {fmt(aid.goal)}</span>
          </div>
        </Card>
      )}

      <Card C={C}>
        <p style={{ margin: '0 0 10px', fontWeight: 800, fontSize: 14, color: C.text }}>📅 {t.rotationCal}</p>
        {rotation.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < rotation.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, background: r.status === 'done' ? C.border : r.status === 'current' ? '#FF9F1C' : C.bg, color: r.status === 'current' ? '#fff' : r.status === 'done' ? C.subtext : C.text }}>{r.pos}</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: r.status === 'done' ? C.subtext : C.text, textDecoration: r.status === 'done' ? 'line-through' : 'none' }}>{r.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: C.subtext }}>{r.date}</p>
            </div>
            {r.status === 'done' && <span>✅</span>}
            {r.status === 'current' && <Badge text={t.inProgress} color="#FF9F1C" />}
            {r.status === 'upcoming' && <span style={{ fontSize: 11, color: C.subtext }}>{t.upcoming}</span>}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── MEMBERS ──────────────────────────────────────────────────────────────────
export function MembersTab() {
  const { members, isAdmin, activeTontine: tn, history, removeMember, reorderMembers } = useTontine();
  const { C, t } = useTheme();
  const [copied, setCopied] = useState(false);

  const move = async (idx, dir) => {
    const arr = [...members];
    const sw = idx + dir;
    if (sw < 0 || sw >= arr.length) return;
    [arr[idx], arr[sw]] = [arr[sw], arr[idx]];
    await reorderMembers(arr);
  };

  const copyInviteCode = () => {
    if (tn?.inviteCode) {
      navigator.clipboard.writeText(tn.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: C.subtext }}>{members.length} membres</p>
      </div>

      {/* Invite code section for admins */}
      {isAdmin && tn?.inviteCode && (
        <Card C={C} color={tn.color}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: tn.color, fontSize: 13 }}>🔗 Code d'invitation membres</p>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: C.subtext }}>Partagez ce code pour qu'un nouveau membre rejoigne cette tontine :</p>
          <div style={{ background: C.bg, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, color: C.subtext, marginBottom: 2 }}>Code d'invitation :</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: tn.color, letterSpacing: 3 }}>{tn.inviteCode}</p>
            </div>
            <button onClick={copyInviteCode} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: copied ? '#2DC653' : tn.color, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
              {copied ? '✓ Copié !' : '📋 Copier'}
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: C.subtext }}>💡 Le membre entre ce code dans Paramètres → Rejoindre via code après son inscription.</p>
        </Card>
      )}

      {members.map((m, idx) => (
        <div key={m.id} style={{ background: C.card, borderRadius: 18, padding: '12px 13px', marginBottom: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 12, borderLeft: `5px solid ${m.color}` }}>
          <Av initials={m.av} color={m.color} size={44} flag img={m.avatar} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: C.text }}>{m.name}</p>
              {m.penalized && <Badge text={t.penalized} color="#E63946" />}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.subtext }}>📞 {m.phone || '—'}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: C.subtext }}>{t.position} #{m.pos} · {computeParticipationRate(m.name, history) ?? '—'}{computeParticipationRate(m.name, history) !== null ? '%' : ''}</p>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => move(idx, -1)} style={{ padding: '4px 8px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer', fontSize: 12, color: C.text }}>↑</button>
                <button onClick={() => move(idx, 1)} style={{ padding: '4px 8px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer', fontSize: 12, color: C.text }}>↓</button>
              </div>
              <button onClick={() => removeMember(m.id)} style={{ padding: '4px 8px', borderRadius: 8, border: 'none', background: '#FFE5E8', color: '#E63946', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>{t.remove}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── PARTICIPATION ────────────────────────────────────────────────────────────
export function ParticipationTab() {
  const { members, isAdmin, activeTontine: tn, toggleParticipation } = useTontine();
  const { C, t } = useTheme();
  const [toast, setToast] = useState(null);

  const toggle = async (id, name, type) => {
    await toggleParticipation(id, name, type);
    if (type === 'C') setToast({ msg: `✅ ${name} — +${fmt(tn.amount)}`, color: '#2DC653' });
    else setToast({ msg: `⚠️ ${name} pénalisé(e) — ${fmt(tn.penaltyAmount)}`, color: '#E63946' });
    setTimeout(() => setToast(null), 2500);
  };

  const paid = members.filter(m => m.paid).length;
  const total = paid * (tn?.amount || 0);

  return (
    <div>
      {toast && <Toast msg={toast.msg} color={toast.color} />}
      <Card C={C} style={{ background: `${tn?.color}12`, border: `2px solid ${tn?.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, color: tn?.color, fontWeight: 700, letterSpacing: 1 }}>{t.currentBalance}</p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text }}>{fmt(total)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 10, color: C.subtext, fontWeight: 700 }}>{t.cotised2}</p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#2DC653' }}>{paid}/{members.length}</p>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px 8px', gap: 10 }}>
        <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.subtext, letterSpacing: 1 }}>MEMBRE</p></div>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#2DC653', width: 36, textAlign: 'center' }}>C</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#E63946', width: 36, textAlign: 'center' }}>NC</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#7B2FBE', width: 36, textAlign: 'center' }}>🧾</span>
      </div>

      {members.map(m => (
        <div key={m.id} style={{ background: C.card, borderRadius: 16, padding: '11px 12px', marginBottom: 9, boxShadow: '0 4px 16px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `5px solid ${m.paid ? '#2DC653' : m.penalized ? '#E63946' : C.border}` }}>
          <Av initials={m.av} color={m.color} size={36} flag img={m.avatar} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.text }}>{m.name}</p>
            {m.penalized && !m.paid && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#E63946' }}>⚠️ {t.penalty} : {fmt(tn?.penaltyAmount || 0)}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['C', 'NC'].map(type => {
              const active = type === 'C' ? m.paid : (m.penalized && !m.paid);
              const col = type === 'C' ? '#2DC653' : '#E63946';
              return (
                <button key={type} onClick={() => isAdmin && toggle(m.id, m.name, type)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: isAdmin ? 'pointer' : 'default', background: active ? col : '#f5f5f5', transition: 'all 0.2s', boxShadow: active ? `0 4px 12px ${col}55` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: active ? '#fff' : '#ccc', fontSize: 15, fontWeight: 900 }}>{active ? (type === 'C' ? '✓' : '✗') : '○'}</span>
                </button>
              );
            })}
            <button onClick={() => m.paid && exportReceiptPDF(m.name, tn?.amount || 0, tn?.name || '', new Date().toLocaleDateString('fr-FR'))} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: m.paid ? 'pointer' : 'default', background: m.paid ? '#7B2FBE15' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {m.paid ? '🧾' : '—'}
            </button>
          </div>
        </div>
      ))}
      {!isAdmin && <p style={{ textAlign: 'center', color: C.subtext, fontSize: 12, marginTop: 14 }}>{t.consultOnly}</p>}
    </div>
  );
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────
export function ChatTab() {
  const { chat, isAdmin, activeTontine: tn, sendMessage, pinMessage } = useTontine();
  const { user } = useAuth();
  const { C, t } = useTheme();
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [recError, setRecError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const endRef = useRef();
  const fileRef = useRef();
  const timerRef = useRef();
  const recorderRef = useRef(null);
  const bubbles = ['#E63946', '#3A86FF', '#FF9F1C', '#2DC653', '#7B2FBE', '#2EC4B6'];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);
  // Recorder is tied to the mic stream, which must be released if the user
  // navigates away mid-recording -- otherwise the mic stays "on" in the browser.
  useEffect(() => () => recorderRef.current?.cancel?.(), []);

  const pinned = chat.find(m => m.pinned);

  const handleSend = async (content, type = 'text', extra = {}) => {
    if (type === 'text' && !content.trim()) return;
    const payload = replyTo
      ? { ...extra, replyTo: { author: replyTo.author, text: replyTo.type === 'text' ? replyTo.text : replyTo.type === 'image' ? '📷 Photo' : '🎤 Vocal', type: replyTo.type } }
      : extra;
    await sendMessage(content, type, payload);
    setText('');
    setReplyTo(null);
  };

  const handleImg = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxDimension: 900, quality: 0.65 });
      await handleSend(compressed, 'image');
    } catch (err) {
      setRecError(err.message);
      setTimeout(() => setRecError(''), 3000);
    }
    setUploading(false);
  };

  const startRec = async () => {
    setRecError('');
    try {
      recorderRef.current = await startAudioRecording();
      setRecording(true);
      setRecSec(0);
      timerRef.current = setInterval(() => {
        setRecSec(s => {
          // Safety cap: ~60s of opus audio stays comfortably under Firestore's
          // 1MB document limit; beyond that we auto-stop and send what we have.
          if (s + 1 >= 60) { stopRec(); return 60; }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      setRecError(err.message || 'Micro indisponible. Vérifiez les autorisations.');
      setTimeout(() => setRecError(''), 3500);
    }
  };

  const stopRec = async () => {
    clearInterval(timerRef.current);
    setRecording(false);
    if (!recorderRef.current) return;
    try {
      const { dataUrl, durationSec } = await recorderRef.current.stop();
      await handleSend(dataUrl, 'audio', { duration: durationSec });
    } catch (err) {
      setRecError('Impossible d\'envoyer le vocal.');
      setTimeout(() => setRecError(''), 3000);
    }
    recorderRef.current = null;
    setRecSec(0);
  };

  const cancelRec = () => {
    clearInterval(timerRef.current);
    recorderRef.current?.cancel?.();
    recorderRef.current = null;
    setRecording(false);
    setRecSec(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 175px)' }}>
      {pinned && (
        <div style={{ background: `${tn?.color}15`, borderBottom: `2px solid ${tn?.color}33`, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📌</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: tn?.color }}>{t.pinnedMsg}</p>
            <p style={{ margin: 0, fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pinned.text}</p>
          </div>
          {isAdmin && <button onClick={() => pinMessage(pinned.id)} style={{ fontSize: 11, color: C.subtext, background: 'none', border: 'none', cursor: 'pointer' }}>{t.unpin}</button>}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {chat.map((msg, i) => {
          const isOwn = msg.authorId === user?.uid;
          const isSystem = msg.type === 'system';
          const bc = bubbles[i % bubbles.length];

          if (isSystem) return (
            <div key={msg.id} style={{ textAlign: 'center', margin: '8px 0' }}>
              <span style={{ background: C.border, color: C.subtext, padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>{msg.text}</span>
            </div>
          );

          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
              {!isOwn && <Av initials={msg.av || '?'} color={msg.color || '#7B2FBE'} size={28} />}
              <div style={{ maxWidth: '72%' }}>
                {!isOwn && <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: msg.color || '#7B2FBE', paddingLeft: 4 }}>{msg.author}</p>}
                <div style={{ background: isOwn ? `linear-gradient(135deg,${tn?.color},${tn?.color}cc)` : bc, color: '#fff', borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: msg.type === 'image' ? '4px' : '9px 13px', boxShadow: `0 3px 12px ${isOwn ? tn?.color : bc}44` }}>
                  {msg.replyTo && (
                    <div style={{
                      background: 'rgba(0,0,0,0.18)', borderLeft: '3px solid rgba(255,255,255,0.6)',
                      borderRadius: 8, padding: '5px 8px', marginBottom: 6,
                      margin: msg.type === 'image' ? '4px 4px 6px' : '0 0 6px',
                    }}>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, opacity: 0.85 }}>{msg.replyTo.author}</p>
                      <p style={{ margin: 0, fontSize: 11, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.replyTo.text}</p>
                    </div>
                  )}
                  {msg.type === 'text' && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{msg.text}</p>}
                  {msg.type === 'image' && (
                    <img
                      src={msg.text} alt=""
                      onClick={() => setZoomedImage(msg.text)}
                      style={{ width: 170, borderRadius: 12, display: 'block', cursor: 'pointer' }}
                    />
                  )}
                  {msg.type === 'audio' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
                      <span>🎤</span>
                      <audio controls src={msg.text} style={{ height: 32, maxWidth: 160 }} />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                  <p style={{ margin: 0, fontSize: 9, color: C.subtext }}>{msg.time}</p>
                  <button onClick={() => setReplyTo(msg)} style={{ fontSize: 10, color: C.subtext, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>↩️</button>
                  {isAdmin && msg.type === 'text' && <button onClick={() => pinMessage(msg.id)} style={{ fontSize: 10, color: C.subtext, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>📌</button>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Full-screen image zoom, WhatsApp-style */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, cursor: 'zoom-out',
          }}
        >
          <button onClick={() => setZoomedImage(null)} style={{
            position: 'absolute', top: 20, right: 20, width: 40, height: 40,
            borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 18, cursor: 'pointer',
          }}>✕</button>
          <img src={zoomedImage} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}

      <div style={{ paddingTop: 8, background: C.card, borderTop: `1px solid ${C.border}` }}>
        {replyTo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${tn?.color}12`, borderRadius: 10, padding: '7px 10px', marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>↩️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: tn?.color }}>Réponse à {replyTo.author}</p>
              <p style={{ margin: 0, fontSize: 11, color: C.subtext, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {replyTo.type === 'text' ? replyTo.text : replyTo.type === 'image' ? '📷 Photo' : '🎤 Vocal'}
              </p>
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: C.subtext, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
        )}
        {recError && (
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#E63946', fontWeight: 600, textAlign: 'center' }}>⚠️ {recError}</p>
        )}
        {recording ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', background: '#E6394612', borderRadius: 12, border: '2px solid #E63946' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#E63946', animation: 'pulse 1s infinite' }} />
            <span style={{ flex: 1, fontWeight: 700, color: '#E63946', fontSize: 12 }}>{t.recording} {recSec}s</span>
            <button onClick={stopRec} style={{ padding: '6px 12px', borderRadius: 10, border: 'none', background: '#E63946', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>{t.send}</button>
            <button onClick={cancelRec} style={{ padding: '6px 8px', borderRadius: 10, border: 'none', background: C.bg, cursor: 'pointer', color: C.text }}>✕</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImg} />
            <button onClick={() => fileRef.current.click()} disabled={uploading} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: `${tn?.color}15`, cursor: uploading ? 'default' : 'pointer', fontSize: 15, flexShrink: 0, opacity: uploading ? 0.5 : 1 }}>
              {uploading ? '⏳' : '📷'}
            </button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend(text)} placeholder={t.writeMsg} style={{ flex: 1, padding: '10px 13px', borderRadius: 22, border: `2px solid ${tn?.color}33`, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text }} />
            {text.trim() ? (
              <button onClick={() => handleSend(text)} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: `linear-gradient(135deg,${tn?.color},${tn?.color}bb)`, cursor: 'pointer', fontSize: 17, flexShrink: 0 }}>➤</button>
            ) : (
              <button onMouseDown={startRec} onMouseUp={stopRec} onTouchStart={e => { e.preventDefault(); startRec(); }} onTouchEnd={e => { e.preventDefault(); stopRec(); }} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: `linear-gradient(135deg,${tn?.color},${tn?.color}bb)`, cursor: 'pointer', fontSize: 17, flexShrink: 0 }}>🎤</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── POLLS ────────────────────────────────────────────────────────────────────
export function PollsTab() {
  const { polls, isAdmin, activeTontine: tn, createPoll, votePoll } = useTontine();
  const { user } = useAuth();
  const { C, t } = useTheme();
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleCreate = async () => {
    if (!question.trim()) return;
    const valid = options.filter(o => o.trim());
    if (valid.length < 2) return;
    await createPoll(question, valid);
    setQuestion(''); setOptions(['', '']); setShowCreate(false);
  };

  return (
    <div>
      {isAdmin && <div style={{ marginBottom: 14 }}><Pill text={t.createPoll} color={tn?.color || '#E63946'} onClick={() => setShowCreate(!showCreate)} /></div>}
      {showCreate && (
        <Card C={C} color={tn?.color}>
          <Input C={C} placeholder={t.pollQuestion} value={question} onChange={e => setQuestion(e.target.value)} />
          {options.map((op, i) => (
            <Input key={i} C={C} placeholder={`${t.pollOption} ${i + 1}`} value={op} onChange={e => { const arr = [...options]; arr[i] = e.target.value; setOptions(arr); }} />
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => setOptions([...options, ''])} style={{ flex: 1, padding: 10, borderRadius: 12, border: `2px dashed ${tn?.color}`, background: 'none', color: tn?.color, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>{t.addOption}</button>
            <button onClick={handleCreate} style={{ flex: 1, padding: 10, borderRadius: 12, border: 'none', background: tn?.color, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>{t.create}</button>
          </div>
        </Card>
      )}
      {polls.length === 0 && !showCreate && <div style={{ textAlign: 'center', padding: '40px 0' }}><div style={{ fontSize: 56, marginBottom: 12 }}>🗳️</div><p style={{ color: C.subtext }}>{t.noPolls}</p></div>}
      {polls.map(poll => {
        const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
        const hasVoted = poll.options.some(o => (o.voterIds || []).includes(user?.uid));
        return (
          <Card key={poll.id} C={C} color={tn?.color}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.text, flex: 1 }}>{poll.question}</p>
              {hasVoted && <Badge text={t.voted} color="#2DC653" />}
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: C.subtext }}>Par {poll.createdBy}</p>
            {poll.options.map((opt, i) => {
              const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
              return (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{opt.text}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: tn?.color }}>{hasVoted ? `${pct}% (${opt.votes})` : '—'}</span>
                  </div>
                  <div onClick={() => !hasVoted && votePoll(poll.id, i)} style={{ background: C.border, borderRadius: 8, overflow: 'hidden', height: 10, cursor: hasVoted ? 'default' : 'pointer' }}>
                    {hasVoted && <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${tn?.color},${tn?.color}88)`, borderRadius: 8, transition: 'width 0.4s' }} />}
                  </div>
                </div>
              );
            })}
            {!hasVoted && <p style={{ margin: '8px 0 0', fontSize: 11, color: C.subtext, textAlign: 'center' }}>👆 Cliquez sur une option pour voter</p>}
          </Card>
        );
      })}
    </div>
  );
}

// ─── AID ──────────────────────────────────────────────────────────────────────
export function AidTab() {
  const { members, aid, isAdmin, activeTontine: tn, saveAid, addAidContribution } = useTontine();
  const { C, t } = useTheme();
  const [amounts, setAmounts] = useState({});
  const [form, setForm] = useState({ title: '', description: '', goal: '', deadline: '', active: true });
  const [showCreate, setShowCreate] = useState(false);

  const inp = { width: '100%', padding: '11px', borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 13, marginBottom: 9, boxSizing: 'border-box', background: C.inputBg, color: C.text, outline: 'none' };

  if (!aid?.active) return (
    <div style={{ padding: '36px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 60, marginBottom: 12 }}>🤝</div>
      <p style={{ color: C.subtext, marginBottom: 18 }}>{t.noAid}</p>
      {isAdmin && <Pill text={t.createAid} color={tn?.color || '#E63946'} onClick={() => setShowCreate(true)} />}
      {showCreate && (
        <Card C={C} style={{ marginTop: 18, textAlign: 'left' }}>
          <input style={inp} placeholder={t.aidTitle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <input style={inp} placeholder={t.aidDesc} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input style={inp} placeholder={t.objective} type="number" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} />
          <input style={inp} placeholder={t.aidDeadline} type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          <Pill text={t.create} color={tn?.color || '#E63946'} onClick={async () => {
            if (!form.title || !form.goal) return;
            await saveAid({ ...form, goal: parseInt(form.goal), collected: 0, contributions: [], active: true });
            setShowCreate(false); setForm({ title: '', description: '', goal: '', deadline: '', active: true });
          }} />
        </Card>
      )}
    </div>
  );

  const pct = Math.min(100, Math.round((aid.collected / aid.goal) * 100));
  return (
    <div>
      <Card C={C} style={{ background: '#7B2FBE10', border: '2px solid #7B2FBE' }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, color: '#7B2FBE', fontWeight: 700, letterSpacing: 1 }}>🤝 {t.aidOngoing}</p>
        <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 15, color: C.text }}>{aid.title}</p>
        {aid.description && <p style={{ margin: '0 0 6px', fontSize: 12, color: C.subtext }}>{aid.description}</p>}
        {aid.deadline && <p style={{ margin: '0 0 10px', fontSize: 12, color: C.subtext }}>📅 Limite : {aid.deadline}</p>}
        <div style={{ background: C.border, borderRadius: 10, overflow: 'hidden', height: 12, marginBottom: 8 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#7B2FBE,#2EC4B6)', borderRadius: 10 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, color: '#7B2FBE', fontSize: 13 }}>{fmt(aid.collected)}</span>
          <span style={{ fontSize: 12, color: C.subtext }}>{pct}% / {fmt(aid.goal)}</span>
        </div>
        {isAdmin && <button onClick={() => saveAid({ ...aid, active: false })} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#E6394615', color: '#E63946', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Désactiver l'aide</button>}
      </Card>

      <p style={{ fontWeight: 700, color: C.subtext, marginBottom: 8, fontSize: 12 }}>{t.contributions} :</p>
      {members.map(m => {
        const tot = (aid.contributions || []).filter(c => c.member === m.name).reduce((s, c) => s + c.amount, 0);
        return (
          <div key={m.id} style={{ background: C.card, borderRadius: 16, padding: '11px 13px', marginBottom: 9, boxShadow: '0 4px 16px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Av initials={m.av} color={m.color} size={36} flag img={m.avatar} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.text }}>{m.name}</p>
              {tot > 0 && <p style={{ margin: 0, fontSize: 12, color: '#2DC653' }}>✅ {fmt(tot)}</p>}
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <input type="number" placeholder="FCFA" value={amounts[m.id] || ''} onChange={e => setAmounts({ ...amounts, [m.id]: e.target.value })} style={{ width: 72, padding: '7px', borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 12, background: C.inputBg, color: C.text, outline: 'none' }} />
                <button onClick={async () => { const a = parseInt(amounts[m.id] || 0); if (!a) return; await addAidContribution(m.name, a); setAmounts({ ...amounts, [m.id]: '' }); }} style={{ padding: '7px 10px', borderRadius: 10, border: 'none', background: '#7B2FBE', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>✓</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── HISTORY ──────────────────────────────────────────────────────────────────
export function HistoryTab() {
  const { history, activeTontine: tn } = useTontine();
  const { C, t } = useTheme();
  const [filter, setFilter] = useState('all');
  const types = {
    paid: { icon: '✅', label: t.cotisations, color: '#2DC653' },
    penalty: { icon: '⚠️', label: t.penalties, color: '#E63946' },
    benefit: { icon: '🍽️', label: t.beneficiaries, color: '#FF9F1C' },
    aid: { icon: '🤝', label: t.aids, color: '#7B2FBE' },
  };
  const filtered = filter === 'all' ? history : history.filter(h => h.type === filter);
  const grouped = filtered.reduce((acc, h) => { (acc[h.period] || (acc[h.period] = [])).push(h); return acc; }, {});

  return (
    <div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 12, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {[['all', t.allFilter], ['paid', t.cotisations], ['penalty', t.penalties], ['benefit', t.beneficiaries], ['aid', t.aids]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', background: filter === v ? tn?.color : C.bg, color: filter === v ? '#fff' : C.subtext, fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>{l}</button>
        ))}
      </div>
      <button onClick={() => exportHistoryPDF(history, tn?.name || '', filter)} style={{ width: '100%', padding: 11, borderRadius: 14, border: `2px solid ${tn?.color}`, background: tn?.color + '10', color: tn?.color, fontWeight: 700, cursor: 'pointer', marginBottom: 14, fontSize: 13 }}>{t.exportPdf}</button>
      {Object.entries(grouped).map(([period, items]) => (
        <div key={period}>
          <p style={{ fontWeight: 800, color: C.subtext, margin: '12px 0 7px', fontSize: 11, letterSpacing: 0.5 }}>{period}</p>
          {items.map(h => { const tc = types[h.type] || types.paid; return (
            <div key={h.id} style={{ background: C.card, borderRadius: 14, padding: '11px 13px', marginBottom: 7, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `4px solid ${tc.color}` }}>
              <span style={{ fontSize: 18 }}>{tc.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.text }}>{h.member || h.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: C.subtext }}>{h.date} · {h.time}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: 800, color: tc.color, fontSize: 13 }}>{h.type === 'penalty' ? '-' : '+'}{fmt(h.amount)}</p>
                <Badge text={tc.label} color={tc.color} />
              </div>
            </div>
          ); })}
        </div>
      ))}
    </div>
  );
}

// ─── STATS ────────────────────────────────────────────────────────────────────
export function StatsTab() {
  const { members, activeTontine: tn, history } = useTontine();
  const { C, t } = useTheme();
  const paid = members.filter(m => m.paid).length;
  const total = paid * (tn?.amount || 0);
  const pct = members.length > 0 ? Math.round((paid / members.length) * 100) : 0;
  const membersWithRealRate = members.map(m => ({ ...m, realRate: computeParticipationRate(m.name, history) ?? 0 }));
  const sorted = [...membersWithRealRate].sort((a, b) => b.realRate - a.realRate);
  const penaltyTotal = history.filter(h => h.type === 'penalty').reduce((s, h) => s + (h.amount || 0), 0);

  return (
    <div>
      <Card C={C} style={{ background: `linear-gradient(135deg,${tn?.color},${tn?.color}bb)`, border: 'none' }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 700, letterSpacing: 1 }}>{t.cycle.toUpperCase()} {tn?.currentCycle} {t.of.toUpperCase()} {tn?.totalCycles || '?'}</p>
        <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 10, overflow: 'hidden', height: 14, marginBottom: 8 }}>
          <div style={{ width: `${((tn?.currentCycle || 1) / (tn?.totalCycles || 10)) * 100}%`, height: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: 10 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{tn?.currentCycle || 1} complétés</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{(tn?.totalCycles || 10) - (tn?.currentCycle || 1)} restants</span>
        </div>
      </Card>

      {penaltyTotal > 0 && (
        <Card C={C} color="#E63946">
          <p style={{ margin: '0 0 4px', fontSize: 10, color: '#E63946', fontWeight: 700 }}>⚠️ FOND DE PÉNALITÉS</p>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text }}>{fmt(penaltyTotal)}</p>
        </Card>
      )}

      <Card C={C}>
        <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 14, color: C.text }}>✅ Participation actuelle</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          <div style={{ position: 'relative', width: 70, height: 70 }}>
            <svg width="70" height="70" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="35" cy="35" r="28" fill="none" stroke={C.border} strokeWidth="8" />
              <circle cx="35" cy="35" r="28" fill="none" stroke={tn?.color} strokeWidth="8" strokeDasharray={`${2 * Math.PI * 28 * pct / 100} ${2 * Math.PI * 28}`} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 900, fontSize: 16, color: tn?.color }}>{pct}%</span>
            </div>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 20, color: C.text }}>{fmt(total)}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: C.subtext }}>{paid}/{members.length} membres</p>
          </div>
        </div>
        {membersWithRealRate.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Av initials={m.av} color={m.color} size={32} img={m.avatar} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{m.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.realRate}%</span>
              </div>
              <div style={{ background: C.border, borderRadius: 6, overflow: 'hidden', height: 6 }}>
                <div style={{ width: `${m.realRate}%`, height: '100%', background: `linear-gradient(90deg,${m.color},${m.color}88)`, borderRadius: 6 }} />
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Card C={C} color="#FF9F1C">
        <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 14, color: C.text }}>🏆 {t.topMembers}</p>
        {sorted.slice(0, 3).map((m, i) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '10px 12px', borderRadius: 12, background: i === 0 ? '#FF9F1C15' : 'transparent' }}>
            <span style={{ fontSize: 20 }}>{['🥇', '🥈', '🥉'][i] || '🏅'}</span>
            <Av initials={m.av} color={m.color} size={36} img={m.avatar} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.text }}>{m.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.subtext }}>{m.realRate}% de participation</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export function AdminTab() {
  const { activeTontine: tn, isAdmin } = useTontine();
  const { C, t } = useTheme();
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <div style={{ background: `${tn?.color}10`, border: `2px solid ${tn?.color}33`, borderRadius: 20, padding: 18, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Av initials="SA" color={tn?.color || '#7B2FBE'} size={54} flag />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.text }}>{tn?.superAdminName || 'Super Administrateur'}</p>
              <Badge text={t.superAdmin} color={tn?.color || '#7B2FBE'} />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.subtext }}>Créateur de la tontine</p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <>
          <button onClick={() => setShow(!show)} style={{ width: '100%', padding: 13, borderRadius: 14, border: `2px solid ${tn?.color}`, background: tn?.color + '10', color: tn?.color, fontWeight: 700, cursor: 'pointer', fontSize: 13, marginBottom: 10 }}>{t.addAdmin}</button>
          {show && (
            <Card C={C} color={tn?.color}>
              <p style={{ margin: '0 0 7px', fontWeight: 700, color: tn?.color, fontSize: 13 }}>Code invitation admin :</p>
              <div style={{ background: C.bg, borderRadius: 10, padding: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 11, color: C.subtext, marginBottom: 2 }}>Code :</p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: tn?.color, letterSpacing: 3 }}>{tn?.adminInviteCode || 'XXXXXXXX'}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(tn?.adminInviteCode || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: copied ? '#2DC653' : tn?.color, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                  {copied ? '✓ Copié !' : '📋 Copier'}
                </button>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 11, color: C.subtext }}>Le membre entre ce code dans Paramètres → Devenir administrateur</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export function ProfileTab() {
  const { userProfile, updateUserProfile, deleteAccount } = useAuth();
  const { activeTontine: tn } = useTontine();
  const { C, t } = useTheme();
  const [name, setName] = useState(userProfile?.name || '');
  const [avatar, setAvatar] = useState(userProfile?.avatar || null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef();

  const save = async () => {
    await updateUserProfile({ name, avatar });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const [avatarError, setAvatarError] = useState('');
  const handleImg = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    try {
      const compressed = await compressImage(file, { maxDimension: 400, quality: 0.75 });
      setAvatar(compressed);
    } catch (err) {
      setAvatarError(err.message);
      setTimeout(() => setAvatarError(''), 3000);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 24px' }}>
        <div style={{ position: 'relative', marginBottom: 16 }} onClick={() => fileRef.current.click()}>
          <Av initials={name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'ME'} color={tn?.color || '#7B2FBE'} size={90} flag img={avatar} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: tn?.color || '#7B2FBE', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', cursor: 'pointer', fontSize: 14 }}>✏️</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImg} />
        {avatarError && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#E63946', fontWeight: 600 }}>⚠️ {avatarError}</p>}
        <p style={{ margin: 0, fontSize: 11, color: C.subtext }}>Appuyez sur la photo pour la modifier</p>
      </div>

      <Card C={C} color={tn?.color}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: tn?.color, fontSize: 13 }}>{t.displayName}</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder={t.displayName}
          style={{ width: '100%', padding: '12px', borderRadius: 12, border: `2px solid ${C.border}`, fontSize: 14, outline: 'none', background: C.inputBg, color: C.text, boxSizing: 'border-box', marginBottom: 12 }} />
        <button onClick={save} style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${tn?.color || '#7B2FBE'},${tn?.color || '#7B2FBE'}bb)`, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          {saved ? '✅ Enregistré !' : t.saveProfile}
        </button>
      </Card>

      {/* Supprimer le compte */}
      <Card C={C} style={{ background: '#E6394610', border: '1px solid #E6394633' }}>
        <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#E63946', fontSize: 13 }}>{t.deleteAccount}</p>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: C.subtext }}>{t.deleteAccountWarning}</p>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{ padding: '9px 16px', borderRadius: 12, border: 'none', background: '#E63946', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>{t.deleteAccount}</button>
        ) : (
          <div>
            <p style={{ color: '#E63946', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>⚠️ Dernière confirmation — cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={deleteAccount} style={{ flex: 1, padding: '9px', borderRadius: 12, border: 'none', background: '#E63946', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>{t.confirmDelete}</button>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '9px', borderRadius: 12, border: `2px solid ${C.border}`, background: C.card, fontWeight: 700, cursor: 'pointer', color: C.text, fontSize: 12 }}>{t.cancel}</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
