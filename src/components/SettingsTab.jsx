import { useState } from 'react';
import { useTontine } from '../context/TontineContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Pill, Toggle, Badge } from './UI';
import ThemeSelector from './ThemeSelector';

// IMPORTANT: this is declared OUTSIDE SettingsTab so React doesn't recreate
// (and therefore remount) it on every keystroke. Recreating it inline was the
// cause of every text input "freezing" after one character.
function Sec({ id, icon, title, open, onToggle, C, children }) {
  return (
    <div style={{ background: C.card, borderRadius: 18, marginBottom: 9, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
      <button onClick={() => onToggle(id)} style={{ width: '100%', padding: '14px 15px', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{icon} {title}</span>
        <span style={{ color: C.subtext, fontSize: 17, display: 'inline-block', transform: open === id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>
      {open === id && <div style={{ padding: '0 15px 15px' }}>{children}</div>}
    </div>
  );
}

export default function SettingsTab() {
  const {
    tontines, activeTontineId, setActiveTontineId, activeTontine: tn,
    isAdmin, updateTontine, deleteTontine, leaveTontine,
    createTontine, joinTontine, becomeAdmin, advanceCycle, submitFeedback,
  } = useTontine();
  const { logout } = useAuth();
  const { C, t, lang, setLang } = useTheme();

  const [open, setOpen] = useState(null);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('');
  const [totalCycles, setTotalCycles] = useState('');
  const [startDate, setStartDate] = useState('');
  const [depositPhone, setDepositPhone] = useState('');
  const [deadline, setDeadline] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [rules, setRules] = useState('');
  const [description, setDescription] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [newTontineName, setNewTontineName] = useState('');
  const [newTontineColor, setNewTontineColor] = useState('#E63946');
  const [confirmDeleteTontine, setConfirmDeleteTontine] = useState(false);
  const [confirmAdvanceCycle, setConfirmAdvanceCycle] = useState(false);
  const [feedbackType, setFeedbackType] = useState('problem');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackState, setFeedbackState] = useState('idle');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const tog = k => setOpen(prev => (prev === k ? null : k));
  const showSuccess = msg => { setSuccess(msg); setTimeout(() => setSuccess(''), 2500); };
  const showError = msg => { setError(msg); setTimeout(() => setError(''), 2500); };

  const inp = {
    width: '100%', padding: '11px', borderRadius: 10,
    border: `2px solid ${C.border}`, fontSize: 13, marginBottom: 9,
    boxSizing: 'border-box', background: C.inputBg, color: C.text,
    outline: 'none',
  };

  return (
    <div>
      {success && <div style={{ background: '#2DC653', color: '#fff', padding: '10px 16px', borderRadius: 12, marginBottom: 12, fontWeight: 700, fontSize: 13 }}>✅ {success}</div>}
      {error && <div style={{ background: '#E63946', color: '#fff', padding: '10px 16px', borderRadius: 12, marginBottom: 12, fontWeight: 700, fontSize: 13 }}>❌ {error}</div>}

      {/* Mes tontines */}
      <Sec id="tontines" icon="🏦" title={t.myTontines} open={open} onToggle={tog} C={C}>
        {tontines.map(tt => (
          <button key={tt.id} onClick={() => setActiveTontineId(tt.id)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: `2px solid ${tt.id === activeTontineId ? tt.color : C.border}`, cursor: 'pointer', marginBottom: 7, background: tt.id === activeTontineId ? tt.color + '10' : C.bg, display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: tt.color }} />
            <span style={{ fontWeight: 700, flex: 1, textAlign: 'left', fontSize: 13, color: tt.id === activeTontineId ? tt.color : C.text }}>{tt.name}</span>
            {tt.id === activeTontineId && <Badge text="Active" color={tt.color} />}
          </button>
        ))}

        {isAdmin && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, color: C.subtext, marginBottom: 8, fontWeight: 600 }}>Créer une nouvelle tontine :</p>
            <input style={inp} placeholder={t.tontineName} value={newTontineName} onChange={e => setNewTontineName(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {['#E63946','#2EC4B6','#FF9F1C','#7B2FBE','#3A86FF','#2DC653'].map(col => (
                <div key={col} onClick={() => setNewTontineColor(col)} style={{ width: 28, height: 28, borderRadius: '50%', background: col, cursor: 'pointer', border: newTontineColor === col ? '3px solid #fff' : '3px solid transparent', boxShadow: newTontineColor === col ? `0 0 0 2px ${col}` : 'none' }} />
              ))}
            </div>
            <Pill text={t.createTontine} color={newTontineColor} onClick={async () => {
              if (!newTontineName.trim()) return showError('Entrez un nom pour la tontine');
              try {
                await createTontine({ name: newTontineName, color: newTontineColor, amount: 2500, frequency: 'weekly', startDate: new Date().toISOString().slice(0, 10), depositPhone: '', penaltyAmount: 500, description: newTontineName, rules: '', totalCycles: 10, currentCycle: 1 });
                setNewTontineName(''); showSuccess('Tontine créée avec succès !');
              } catch (e) { showError(e.message); }
            }} small />
          </div>
        )}

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 12, color: C.subtext, marginBottom: 8, fontWeight: 600 }}>Rejoindre via code d'invitation :</p>
          <input style={inp} placeholder="Entrez le code (ex: ABC123XY)" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
          <Pill text={t.joinTontine} color="#2EC4B6" onClick={async () => {
            if (!inviteCode.trim()) return showError('Entrez un code d\'invitation');
            try { await joinTontine(inviteCode); setInviteCode(''); showSuccess('Tontine rejointe avec succès !'); }
            catch (e) { showError(e.message); }
          }} small />
        </div>
      </Sec>

      {isAdmin && (
        <>
          <Sec id="cotisation" icon="💰" title={t.cotisationFreq} open={open} onToggle={tog} C={C}>
            <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 5px', fontWeight: 600 }}>{t.amount}</p>
            <input style={inp} type="number" placeholder={`Actuel : ${tn?.amount || 2500} FCFA`} value={amount} onChange={e => setAmount(e.target.value)} />
            <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 7px', fontWeight: 600 }}>{t.frequency}</p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
              {[['weekly',t.weekly],['biweekly',t.biweekly],['monthly',t.monthly],['bimonthly',t.bimonthly]].map(([v,l]) => (
                <button key={v} onClick={() => setFrequency(v)} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', background: (frequency || tn?.frequency) === v ? C.primary : C.bg, color: (frequency || tn?.frequency) === v ? '#fff' : C.text, fontWeight: 700, fontSize: 12 }}>{l}</button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 5px', fontWeight: 600 }}>{t.totalCycles}</p>
            <input style={inp} type="number" placeholder={`Actuel : ${tn?.totalCycles || 10}`} value={totalCycles} onChange={e => setTotalCycles(e.target.value)} />
            <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 5px', fontWeight: 600 }}>{t.startDate}</p>
            <input style={inp} type="date" value={startDate || tn?.startDate || ''} onChange={e => setStartDate(e.target.value)} />
            <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 5px', fontWeight: 600 }}>{t.depositPhone}</p>
            <input style={inp} placeholder={tn?.depositPhone || 'Ex: 6 XX XX XX XX'} value={depositPhone} onChange={e => setDepositPhone(e.target.value)} />
            <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 5px', fontWeight: 600 }}>Heure limite de cotisation</p>
            <input style={inp} type="time" value={deadline || tn?.deadline || '18:00'} onChange={e => setDeadline(e.target.value)} />
            <Pill text={t.save} color={C.primary} onClick={async () => {
              const data = {};
              if (amount) data.amount = parseInt(amount);
              if (frequency) data.frequency = frequency;
              if (totalCycles) data.totalCycles = parseInt(totalCycles);
              if (startDate) data.startDate = startDate;
              if (depositPhone) data.depositPhone = depositPhone;
              if (deadline) data.deadline = deadline;
              if (Object.keys(data).length === 0) return showError('Aucune modification détectée');
              await updateTontine(data);
              setAmount(''); setTotalCycles(''); setDepositPhone('');
              showSuccess('Paramètres sauvegardés !');
            }} />
          </Sec>

          <Sec id="cycle" icon="🔄" title="Gestion du cycle" open={open} onToggle={tog} C={C}>
            <div style={{ background: '#3A86FF12', borderRadius: 12, padding: 14, marginBottom: 12, border: '1px solid #3A86FF33' }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: C.text }}>
                Cycle actuel : <strong>{tn?.currentCycle || 1} / {tn?.totalCycles || 10}</strong>
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.subtext, lineHeight: 1.6 }}>
                Le passage au cycle suivant n'est pas automatique : c'est vous qui le déclenchez quand la période de cotisation est terminée. Cette action réinitialise le statut C/NC de tous les membres pour le nouveau cycle et fait avancer le tour de rotation.
              </p>
            </div>
            {!confirmAdvanceCycle ? (
              <button onClick={() => setConfirmAdvanceCycle(true)} style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', background: '#3A86FF', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                🔄 Passer au cycle suivant
              </button>
            ) : (
              <div>
                <p style={{ color: '#3A86FF', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>⚠️ Confirmer le passage au cycle {(tn?.currentCycle || 1) + 1} ?</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={async () => { await advanceCycle(); setConfirmAdvanceCycle(false); showSuccess('Cycle suivant activé !'); }} style={{ flex: 1, padding: 9, borderRadius: 12, border: 'none', background: '#3A86FF', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Confirmer</button>
                  <button onClick={() => setConfirmAdvanceCycle(false)} style={{ flex: 1, padding: 9, borderRadius: 12, border: `2px solid ${C.border}`, background: C.card, fontWeight: 700, cursor: 'pointer', color: C.text, fontSize: 12 }}>Annuler</button>
                </div>
              </div>
            )}
          </Sec>

          <Sec id="penalty" icon="⚠️" title={t.penalties} open={open} onToggle={tog} C={C}>
            <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 5px', fontWeight: 600 }}>{t.penaltyAmount}</p>
            <input style={inp} type="number" placeholder={`Actuel : ${tn?.penaltyAmount || 500} FCFA`} value={penaltyAmount} onChange={e => setPenaltyAmount(e.target.value)} />
            <p style={{ fontSize: 11, color: C.subtext, margin: '0 0 10px', lineHeight: 1.6 }}>
              ⚠️ Comme pour les rappels, la détection automatique du dépassement de l'heure limite nécessite un service serveur pas encore branché. En attendant, appliquez les pénalités manuellement depuis l'onglet Participation.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{t.autoPenalty}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: C.subtext }}>Pénalité appliquée automatiquement après l'heure limite</p>
              </div>
              <Toggle on={tn?.autoPenalty !== false} onChange={() => updateTontine({ autoPenalty: !(tn?.autoPenalty !== false) })} color={C.primary} />
            </div>
            <Pill text={t.save} color={C.primary} onClick={async () => {
              if (!penaltyAmount) return showError('Entrez un montant de pénalité');
              await updateTontine({ penaltyAmount: parseInt(penaltyAmount) });
              setPenaltyAmount('');
              showSuccess('Pénalité mise à jour !');
            }} />
          </Sec>

          <Sec id="reminders" icon="🔔" title={t.reminders} open={open} onToggle={tog} C={C}>
            <p style={{ fontSize: 12, color: C.subtext, margin: '0 0 12px' }}>
              ⚠️ Ces réglages préparent les rappels mais l'envoi automatique réel nécessite
              un service serveur (Firebase Cloud Functions) qui n'est pas encore branché.
              Pour l'instant ces switches sont enregistrés mais aucune notification n'est
              déclenchée automatiquement.
            </p>
            {[['24h avant la cotisation','reminder24h'],['Le matin du jour J','reminderDay'],['1h avant la limite','reminder1h']].map(([label,key]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{label}</p>
                <Toggle on={tn?.[key] !== false} onChange={() => updateTontine({ [key]: !(tn?.[key] !== false) })} color={C.primary} />
              </div>
            ))}
          </Sec>

          <Sec id="aid" icon="🤝" title={t.aid} open={open} onToggle={tog} C={C}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{t.aidToggle}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: C.subtext }}>Désactivez si aucune aide n'est en cours</p>
              </div>
              <Toggle on={tn?.aidEnabled !== false} onChange={() => updateTontine({ aidEnabled: !(tn?.aidEnabled !== false) })} color={C.primary} />
            </div>
          </Sec>

          <Sec id="rules" icon="📜" title={t.tontineRules} open={open} onToggle={tog} C={C}>
            <p style={{ fontSize: 12, color: C.subtext, margin: '0 0 8px' }}>Ces règles seront affichées à tous les membres. Un membre ne pourra accéder à la tontine qu'après les avoir acceptées (si vous en définissez).</p>
            <textarea
              placeholder={tn?.rules || 'Rédigez les règles de votre tontine ici...'}
              value={rules}
              onChange={e => setRules(e.target.value)}
              style={{ width: '100%', minHeight: 120, padding: 11, borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 9, background: C.inputBg, color: C.text }}
            />
            <input style={inp} placeholder={tn?.description || 'Description de la tontine'} value={description} onChange={e => setDescription(e.target.value)} />
            <Pill text={t.save} color={C.primary} onClick={async () => {
              const data = {};
              if (rules) data.rules = rules;
              if (description) data.description = description;
              if (Object.keys(data).length === 0) return showError('Aucune modification détectée');
              await updateTontine(data);
              setRules(''); setDescription('');
              showSuccess('Règles enregistrées !');
            }} />
          </Sec>

          <Sec id="danger" icon="🗑️" title={t.dangerZone} open={open} onToggle={tog} C={C}>
            <div style={{ background: '#FF9F1C15', borderRadius: 12, padding: 14, marginBottom: 12, border: '1px solid #FF9F1C33' }}>
              <p style={{ margin: '0 0 5px', fontWeight: 700, color: '#FF9F1C', fontSize: 13 }}>🚪 Quitter cette tontine</p>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: C.subtext }}>
                En tant qu'administrateur, vous devez d'abord nommer un autre administrateur (ou être déjà co-admin) avant de pouvoir quitter.
              </p>
              {!confirmLeave ? (
                <button onClick={() => setConfirmLeave(true)} style={{ padding: '9px 16px', borderRadius: 12, border: 'none', background: '#FF9F1C', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Quitter cette tontine</button>
              ) : (
                <div>
                  <p style={{ color: '#FF9F1C', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>⚠️ Êtes-vous sûr de vouloir quitter cette tontine ?</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={async () => {
                      try { await leaveTontine(); setConfirmLeave(false); }
                      catch (e) { showError(e.message); setConfirmLeave(false); }
                    }} style={{ flex: 1, padding: 9, borderRadius: 12, border: 'none', background: '#FF9F1C', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Oui, quitter</button>
                    <button onClick={() => setConfirmLeave(false)} style={{ flex: 1, padding: 9, borderRadius: 12, border: `2px solid ${C.border}`, background: C.card, fontWeight: 700, cursor: 'pointer', color: C.text, fontSize: 12 }}>Annuler</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: '#E6394615', borderRadius: 12, padding: 14, border: '1px solid #E6394633' }}>
              <p style={{ margin: '0 0 5px', fontWeight: 700, color: '#E63946', fontSize: 13 }}>{t.deleteTitle}</p>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: C.subtext }}>{t.deleteWarning} Tous les membres seront retirés automatiquement.</p>
              {!confirmDeleteTontine ? (
                <button onClick={() => setConfirmDeleteTontine(true)} style={{ padding: '9px 16px', borderRadius: 12, border: 'none', background: '#E63946', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>{t.delete}</button>
              ) : (
                <div>
                  <p style={{ color: '#E63946', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>⚠️ Cette action est irréversible. Confirmer ?</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={async () => { await deleteTontine(); setConfirmDeleteTontine(false); }} style={{ flex: 1, padding: 9, borderRadius: 12, border: 'none', background: '#E63946', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Oui, supprimer</button>
                    <button onClick={() => setConfirmDeleteTontine(false)} style={{ flex: 1, padding: 9, borderRadius: 12, border: `2px solid ${C.border}`, background: C.card, fontWeight: 700, cursor: 'pointer', color: C.text, fontSize: 12 }}>Annuler</button>
                  </div>
                </div>
              )}
            </div>
          </Sec>
        </>
      )}

      {!isAdmin && (
        <Sec id="danger-member" icon="🚪" title="Zone dangereuse" open={open} onToggle={tog} C={C}>
          <div style={{ background: '#FF9F1C15', borderRadius: 12, padding: 14, border: '1px solid #FF9F1C33' }}>
            <p style={{ margin: '0 0 5px', fontWeight: 700, color: '#FF9F1C', fontSize: 13 }}>🚪 Quitter cette tontine</p>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: C.subtext }}>Vous serez retiré de la tontine et tous les membres seront notifiés.</p>
            {!confirmLeave ? (
              <button onClick={() => setConfirmLeave(true)} style={{ padding: '9px 16px', borderRadius: 12, border: 'none', background: '#FF9F1C', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Quitter cette tontine</button>
            ) : (
              <div>
                <p style={{ color: '#FF9F1C', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>⚠️ Êtes-vous sûr de vouloir quitter ?</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={async () => {
                    try { await leaveTontine(); setConfirmLeave(false); }
                    catch (e) { showError(e.message); setConfirmLeave(false); }
                  }} style={{ flex: 1, padding: 9, borderRadius: 12, border: 'none', background: '#FF9F1C', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Oui, quitter</button>
                  <button onClick={() => setConfirmLeave(false)} style={{ flex: 1, padding: 9, borderRadius: 12, border: `2px solid ${C.border}`, background: C.card, fontWeight: 700, cursor: 'pointer', color: C.text, fontSize: 12 }}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        </Sec>
      )}

      <Sec id="theme" icon="🎨" title={t.theme} open={open} onToggle={tog} C={C}>
        <ThemeSelector />
      </Sec>

      <Sec id="lang" icon="🌍" title={t.language} open={open} onToggle={tog} C={C}>
        <div style={{ display: 'flex', gap: 9 }}>
          {[['fr','🇫🇷 Français'],['en','🇬🇧 English']].map(([v,l]) => (
            <button key={v} onClick={() => setLang(v)} style={{ flex: 1, padding: 11, borderRadius: 12, border: `2px solid ${lang === v ? C.primary : C.border}`, background: lang === v ? C.primary + '10' : C.card, color: lang === v ? C.primary : C.text, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>{l}</button>
          ))}
        </div>
      </Sec>

      {!isAdmin && (
        <Sec id="become" icon="👑" title={t.becomeAdmin} open={open} onToggle={tog} C={C}>
          <p style={{ fontSize: 12, color: C.subtext, margin: '0 0 8px' }}>{t.becomeAdminInfo}</p>
          <input style={inp} placeholder={t.adminCode} value={adminCode} onChange={e => setAdminCode(e.target.value)} />
          <Pill text={t.validate} color={C.primary} onClick={async () => {
            if (!adminCode.trim()) return showError('Entrez le code admin');
            try { await becomeAdmin(adminCode); showSuccess('Vous êtes maintenant administrateur !'); setAdminCode(''); }
            catch (e) { showError(e.message); }
          }} />
        </Sec>
      )}

      <Sec id="about" icon="ℹ️" title={t.aboutApp} open={open} onToggle={tog} C={C}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 40 }}>🇨🇲</div>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: C.text, lineHeight: 1.7 }}>
          <strong>Tontine Structurelle</strong> est une application pensée pour moderniser la gestion des tontines camerounaises — sans changer l'esprit de solidarité qui les rend uniques.
        </p>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: C.subtext, lineHeight: 1.7 }}>
          Elle permet de créer et gérer plusieurs tontines, suivre les cotisations et pénalités en temps réel, organiser la rotation des bénéficiaires, communiquer par chat, lancer des sondages, et soutenir les membres en difficulté via l'onglet Aide — le tout accessible à tous les membres, où qu'ils soient.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: C.subtext, lineHeight: 1.7 }}>
          Chaque administrateur garde le contrôle total de sa tontine, tandis que les membres suivent tout en toute transparence.
        </p>
        <div style={{ background: C.primary + '15', borderRadius: 12, padding: '10px 14px', marginTop: 14, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.primary }}>Développée par Mr BERTOL.T ✨</p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: C.subtext }}>Version 1.0.0</p>
        </div>
      </Sec>

      <Sec id="share" icon="📤" title="Partager l'application" open={open} onToggle={tog} C={C}>
        <p style={{ fontSize: 12, color: C.subtext, margin: '0 0 12px', lineHeight: 1.6 }}>
          Faites découvrir Tontine Structurelle à votre entourage.
        </p>
        <Pill text="📤 Partager" color={C.primary} onClick={async () => {
          const shareData = {
            title: 'Tontine Structurelle',
            text: 'Découvre Tontine Structurelle, l\'application pour gérer tes tontines facilement !',
            url: window.location.origin,
          };
          if (navigator.share) {
            try { await navigator.share(shareData); } catch { /* user cancelled, ignore */ }
          } else {
            await navigator.clipboard.writeText(shareData.url);
            showSuccess('Lien copié ! Vous pouvez le coller où vous voulez.');
          }
        }} />
      </Sec>

      <Sec id="feedback" icon="💬" title="Aide & Suggestions" open={open} onToggle={tog} C={C}>
        <p style={{ fontSize: 12, color: C.subtext, margin: '0 0 12px', lineHeight: 1.6 }}>
          Un problème avec l'application ? Une idée pour l'améliorer ? Écrivez-nous, votre message nous parvient directement.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[['problem', '⚠️ Signaler un problème'], ['suggestion', '💡 Suggestion']].map(([v, l]) => (
            <button key={v} onClick={() => setFeedbackType(v)} style={{
              flex: 1, padding: '9px 6px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              border: `2px solid ${feedbackType === v ? C.primary : C.border}`,
              background: feedbackType === v ? C.primary + '15' : C.card,
              color: feedbackType === v ? C.primary : C.subtext,
            }}>{l}</button>
          ))}
        </div>
        <textarea
          value={feedbackMessage}
          onChange={e => setFeedbackMessage(e.target.value)}
          placeholder={feedbackType === 'problem' ? 'Décrivez ce qui ne fonctionne pas...' : 'Décrivez votre idée...'}
          style={{ width: '100%', minHeight: 90, padding: 11, borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 10, background: C.inputBg, color: C.text }}
        />
        <Pill text={feedbackState === 'sending' ? 'Envoi...' : 'Envoyer'} color={C.primary} disabled={feedbackState === 'sending'} onClick={async () => {
          if (!feedbackMessage.trim()) return showError('Écrivez un message avant d\'envoyer.');
          setFeedbackState('sending');
          const result = await submitFeedback(feedbackType, feedbackMessage);
          if (result.success) {
            showSuccess('Message envoyé, merci !');
            setFeedbackMessage('');
          } else {
            showError('Échec de l\'envoi, réessayez.');
          }
          setFeedbackState('idle');
        }} />
      </Sec>

      <button onClick={logout} style={{ width: '100%', padding: 13, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#E63946,#c0392b)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 6, boxShadow: '0 6px 20px rgba(230,57,70,0.35)' }}>
        {t.logout}
      </button>
    </div>
  );
}
