import { createContext, useContext, useEffect, useState } from 'react';
import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, onSnapshot, serverTimestamp,
  query, orderBy, arrayUnion, arrayRemove, where, writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from './AuthContext';
import { generateInviteCode, generateId } from '../utils/helpers';

const TontineContext = createContext();

// Fires a push notification to the other members of a tontine via the
// serverless endpoint. Deliberately swallows errors: a notification that
// fails to send should never block the chat message / poll / penalty it's
// attached to. Also does nothing gracefully if the person hasn't granted
// notification permission (no token = nothing to call).
async function triggerNotification(tontineId, title, body) {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;
    await fetch('/api/notify-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ tontineId, title, body }),
    });
  } catch (err) {
    console.log('Notification non envoyée (non bloquant) :', err.message);
  }
}

export function TontineProvider({ children }) {
  const { user, userProfile, updateUserProfile, registerDeleteCleanup } = useAuth();
  const [tontines, setTontines] = useState([]);
  const [activeTontineId, setActiveTontineIdState] = useState(null);
  const [members, setMembers] = useState([]);
  const [chat, setChat] = useState([]);
  const [history, setHistory] = useState([]);
  const [polls, setPolls] = useState([]);
  const [aid, setAidState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [devSettings, setDevSettingsState] = useState({ mtnNumber: '', orangeNumber: '' });

  const activeTontine = tontines.find(t => t.id === activeTontineId) || null;
  const isAdmin = activeTontine
    ? (activeTontine.superAdminId === user?.uid || (activeTontine.adminIds || []).includes(user?.uid))
    : false;

  // Public setter that also persists the last-used tontine for this user
  const setActiveTontineId = (id) => {
    setActiveTontineIdState(id);
    if (user && id) {
      try { localStorage.setItem(`ts_last_tontine_${user.uid}`, id); } catch (e) {}
    }
  };

  // Reset everything when the signed-in user changes (logout / different account)
  useEffect(() => {
    setTontines([]);
    setActiveTontineIdState(null);
    setMembers([]);
    setChat([]);
    setHistory([]);
    setPolls([]);
    setAidState(null);
    if (!user) setLoading(false);
  }, [user?.uid]);

  // Load dev settings (MTN/Orange numbers)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'ts_app_settings', 'dev'), snap => {
      if (snap.exists()) setDevSettingsState(snap.data());
    });
    return unsub;
  }, []);

  // Load user's tontines
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const ids = userProfile?.tontineIds || [];
    if (ids.length === 0) { setTontines([]); setActiveTontineIdState(null); setLoading(false); return; }

    const tontineMap = {};
    let lastSaved = null;
    try { lastSaved = localStorage.getItem(`ts_last_tontine_${user.uid}`); } catch (e) {}

    const unsubs = ids.map(tid =>
      onSnapshot(doc(db, 'ts_tontines', tid), snap => {
        if (snap.exists()) {
          tontineMap[tid] = { id: snap.id, ...snap.data() };
        } else {
          delete tontineMap[tid];
        }
        const list = Object.values(tontineMap);
        setTontines(list);
        // Pick active tontine: keep current if still valid, else last saved, else first
        setActiveTontineIdState(prev => {
          if (prev && list.some(t => t.id === prev)) return prev;
          if (lastSaved && list.some(t => t.id === lastSaved)) return lastSaved;
          return list.length > 0 ? list[0].id : null;
        });
        setLoading(false);
      })
    );
    return () => unsubs.forEach(u => u());
  }, [user?.uid, userProfile?.tontineIds?.join(',')]);

  // Load active tontine subcollections
  useEffect(() => {
    setMembers([]); setChat([]); setHistory([]); setPolls([]); setAidState(null);
    if (!activeTontineId) return;
    const unsubs = [
      onSnapshot(query(collection(db, 'ts_tontines', activeTontineId, 'members'), orderBy('pos')),
        snap => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'ts_tontines', activeTontineId, 'chat'), orderBy('createdAt')),
        snap => setChat(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'ts_tontines', activeTontineId, 'history'), orderBy('createdAt', 'desc')),
        snap => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'ts_tontines', activeTontineId, 'polls'), orderBy('createdAt', 'desc')),
        snap => setPolls(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'ts_tontines', activeTontineId, 'aid')),
        snap => setAidState(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() })),
    ];
    return () => unsubs.forEach(u => u());
  }, [activeTontineId]);

  // Create tontine
  const createTontine = async (data) => {
    const inviteCode = generateInviteCode();
    const adminInviteCode = generateInviteCode();
    const tRef = await addDoc(collection(db, 'ts_tontines'), {
      ...data,
      superAdminId: user.uid,
      superAdminName: userProfile.name,
      adminIds: [],
      memberUserIds: [user.uid],
      inviteCode,
      adminInviteCode,
      aidEnabled: true,
      createdAt: serverTimestamp(),
      currentCycle: 1,
    });
    const colors = ['#E63946','#2EC4B6','#FF9F1C','#7B2FBE','#3A86FF','#2DC653'];
    await setDoc(doc(db, 'ts_tontines', tRef.id, 'members', user.uid), {
      uid: user.uid,
      name: userProfile.name,
      phone: userProfile.phone || '',
      av: userProfile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      color: colors[0],
      pos: 1,
      paid: false,
      penalized: false,
      avatar: userProfile.avatar || null,
      participationRate: 100,
      rulesAccepted: true,
      createdAt: serverTimestamp(),
    });
    await updateUserProfile({ tontineIds: [...(userProfile.tontineIds || []), tRef.id] });
    setActiveTontineId(tRef.id);
    return tRef.id;
  };

  // Join tontine via invite code (code only, not full URL)
  const joinTontine = async (rawCode) => {
    const code = rawCode.trim().toUpperCase().split('/').pop();
    if (!code) throw new Error('Veuillez entrer un code.');
    const q = query(collection(db, 'ts_tontines'), where('inviteCode', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Code invalide. Vérifiez le code et réessayez.');
    const tontineDoc = snap.docs[0];
    const tid = tontineDoc.id;
    const tData = tontineDoc.data();

    if ((tData.memberUserIds || []).includes(user.uid)) {
      setActiveTontineId(tid);
      throw new Error('Vous êtes déjà membre de cette tontine.');
    }

    const colors = ['#E63946','#2EC4B6','#FF9F1C','#7B2FBE','#3A86FF','#2DC653'];
    const membersSnap = await getDocs(collection(db, 'ts_tontines', tid, 'members'));
    const pos = membersSnap.size + 1;

    // Both writes happen in a single atomic batch so the security rules see
    // a consistent state: the member doc and the membership array land together,
    // instead of memberUserIds lagging one write behind (which caused "invalid code"
    // failures for first-time joiners under the stricter rules).
    const batch = writeBatch(db);
    batch.set(doc(db, 'ts_tontines', tid, 'members', user.uid), {
      uid: user.uid,
      name: userProfile.name,
      phone: userProfile.phone || '',
      av: userProfile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      color: colors[pos % colors.length],
      pos,
      paid: false,
      penalized: false,
      avatar: userProfile.avatar || null,
      participationRate: 0,
      rulesAccepted: !tData.rules,
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'ts_tontines', tid), { memberUserIds: arrayUnion(user.uid) });
    await batch.commit();

    await updateUserProfile({ tontineIds: [...(userProfile.tontineIds || []), tid] });
    setActiveTontineId(tid);
  };

  // Become admin via code
  const becomeAdmin = async (code) => {
    if (!activeTontine) throw new Error('Aucune tontine active');
    if (activeTontine.adminInviteCode !== code.trim().toUpperCase())
      throw new Error('Code invalide');
    // Update only adminIds -> allowed for any signed-in user by rules
    await updateDoc(doc(db, 'ts_tontines', activeTontineId), {
      adminIds: arrayUnion(user.uid),
    });
  };

  // Leave tontine
  const leaveTontine = async () => {
    if (!activeTontineId || !user || !activeTontine) return;
    const otherAdmins = (activeTontine.adminIds || []).filter(id => id !== user.uid);
    const isSuperAdmin = activeTontine.superAdminId === user.uid;
    if (isSuperAdmin && otherAdmins.length === 0) {
      throw new Error('Vous êtes le seul administrateur. Nommez un autre administrateur ou supprimez la tontine avant de la quitter.');
    }

    await deleteDoc(doc(db, 'ts_tontines', activeTontineId, 'members', user.uid));
    await updateDoc(doc(db, 'ts_tontines', activeTontineId), {
      memberUserIds: arrayRemove(user.uid),
      adminIds: arrayRemove(user.uid),
    });
    const newIds = (userProfile.tontineIds || []).filter(id => id !== activeTontineId);
    await updateUserProfile({ tontineIds: newIds });
    await addDoc(collection(db, 'ts_tontines', activeTontineId, 'chat'), {
      author: 'Système', authorId: 'system', av: '🚪', color: '#888',
      text: `${userProfile.name} a quitté la tontine.`,
      type: 'system', pinned: false, createdAt: serverTimestamp(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    });
    const remaining = tontines.filter(t => t.id !== activeTontineId);
    setActiveTontineId(remaining.length > 0 ? remaining[0].id : null);
  };

  // Update tontine settings (admin only - enforced by rules)
  const updateTontine = async (data) => {
    if (!activeTontineId) return;
    await updateDoc(doc(db, 'ts_tontines', activeTontineId), data);
  };

  // Advances the rotation to the next cycle: logs the outgoing beneficiary,
  // resets everyone's paid/penalized flags for the fresh cycle, and bumps
  // currentCycle. This exists because currentCycle was previously set once
  // at creation and never touched again -- the rotation calendar looked
  // "configured" but was never actually automated. There is deliberately no
  // automatic timer-based advance here (that would need a server-side
  // scheduled job, same infrastructure the notifications feature needs);
  // this is an explicit admin action instead, which is honest about what
  // the app can do without a backend.
  const advanceCycle = async () => {
    if (!activeTontineId || !activeTontine) return;
    const outgoing = members.find(m => m.pos === activeTontine.currentCycle);
    const batch = writeBatch(db);
    members.forEach(m => {
      batch.update(doc(db, 'ts_tontines', activeTontineId, 'members', m.id), {
        paid: false, penalized: false,
      });
    });
    batch.update(doc(db, 'ts_tontines', activeTontineId), {
      currentCycle: activeTontine.currentCycle + 1,
    });
    await batch.commit();
    if (outgoing) {
      await addDoc(collection(db, 'ts_tontines', activeTontineId, 'history'), {
        type: 'benefit',
        member: outgoing.name,
        amount: activeTontine.amount * members.length,
        date: new Date().toLocaleDateString('fr-FR'),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        period: `Cycle ${activeTontine.currentCycle}`,
        createdAt: serverTimestamp(),
      });
    }
  };

  // Delete tontine (admin only - enforced by rules)
  const deleteTontine = async () => {
    if (!activeTontineId) return;
    const batch = writeBatch(db);
    const membersSnap = await getDocs(collection(db, 'ts_tontines', activeTontineId, 'members'));
    for (const memberDoc of membersSnap.docs) {
      const mData = memberDoc.data();
      if (mData.uid) {
        const userRef = doc(db, 'ts_users', mData.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const newIds = (userSnap.data().tontineIds || []).filter(id => id !== activeTontineId);
          batch.update(userRef, { tontineIds: newIds });
        }
      }
      batch.delete(memberDoc.ref);
    }
    batch.delete(doc(db, 'ts_tontines', activeTontineId));
    await batch.commit();
    const remaining = tontines.filter(t => t.id !== activeTontineId);
    setActiveTontineId(remaining.length > 0 ? remaining[0].id : null);
  };

  // Accept rules
  const acceptRules = async () => {
    if (!activeTontineId || !user) return;
    await updateDoc(doc(db, 'ts_tontines', activeTontineId, 'members', user.uid), { rulesAccepted: true });
  };

  // Remove member (admin only - enforced by rules)
  const removeMember = async (memberId) => {
    await deleteDoc(doc(db, 'ts_tontines', activeTontineId, 'members', memberId));
  };

  // Update member
  const updateMember = async (memberId, data) => {
    await updateDoc(doc(db, 'ts_tontines', activeTontineId, 'members', memberId), data);
  };

  // Toggle participation C/NC
  const toggleParticipation = async (memberId, memberName, type) => {
    const isPaid = type === 'C';
    await updateMember(memberId, { paid: isPaid, penalized: !isPaid });
    await addDoc(collection(db, 'ts_tontines', activeTontineId, 'history'), {
      type: isPaid ? 'paid' : 'penalty',
      member: memberName,
      amount: isPaid ? activeTontine.amount : activeTontine.penaltyAmount,
      date: new Date().toLocaleDateString('fr-FR'),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      period: `Cycle ${activeTontine.currentCycle}`,
      createdAt: serverTimestamp(),
    });
    if (!isPaid) {
      await addDoc(collection(db, 'ts_tontines', activeTontineId, 'chat'), {
        author: 'Système', authorId: 'system', av: '⚠️', color: '#E63946',
        text: `⚠️ ${memberName} a été pénalisé(e) de ${activeTontine.penaltyAmount.toLocaleString()} FCFA pour non-cotisation.`,
        type: 'system', pinned: false, createdAt: serverTimestamp(),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      });
      triggerNotification(
        activeTontineId,
        `⚠️ Pénalité — ${activeTontine.name}`,
        `${memberName} a été pénalisé(e) de ${activeTontine.penaltyAmount.toLocaleString()} FCFA.`
      );
    }
  };

  // Reorder members
  const reorderMembers = async (updatedMembers) => {
    await Promise.all(
      updatedMembers.map((m, i) =>
        updateDoc(doc(db, 'ts_tontines', activeTontineId, 'members', m.id), { pos: i + 1 })
      )
    );
  };

  // Send chat message
  const sendMessage = async (content, type = 'text', extra = {}) => {
    await addDoc(collection(db, 'ts_tontines', activeTontineId, 'chat'), {
      author: userProfile.name,
      authorId: user.uid,
      av: userProfile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      color: '#7B2FBE',
      text: content,
      type,
      pinned: false,
      createdAt: serverTimestamp(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      ...extra,
    });
    const preview = type === 'text' ? content : type === 'image' ? '📷 Photo' : '🎤 Message vocal';
    triggerNotification(activeTontineId, `💬 ${userProfile.name} — ${activeTontine?.name}`, preview);
  };

  // Pin message (admin only - enforced by rules via authorId check fallback)
  const pinMessage = async (msgId) => {
    await Promise.all(
      chat.map(m =>
        updateDoc(doc(db, 'ts_tontines', activeTontineId, 'chat', m.id),
          { pinned: m.id === msgId ? !m.pinned : false })
      )
    );
  };

  // Anyone can delete their own message; an admin can delete any message --
  // matches the Firestore rule exactly, so this never fails silently.
  const deleteMessage = async (msgId) => {
    await deleteDoc(doc(db, 'ts_tontines', activeTontineId, 'chat', msgId));
  };

  // Create poll (admin only - enforced by rules)
  const createPoll = async (question, options) => {
    await addDoc(collection(db, 'ts_tontines', activeTontineId, 'polls'), {
      question,
      options: options.map(o => ({ text: o, votes: 0, voterIds: [] })),
      createdBy: userProfile.name,
      createdAt: serverTimestamp(),
    });
    triggerNotification(activeTontineId, `🗳️ Nouveau sondage — ${activeTontine?.name}`, question);
  };

  // Vote on poll
  const votePoll = async (pollId, optionIndex) => {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    const alreadyVoted = poll.options.some(o => (o.voterIds || []).includes(user.uid));
    if (alreadyVoted) return;
    const updatedOptions = poll.options.map((o, i) =>
      i === optionIndex
        ? { ...o, votes: o.votes + 1, voterIds: [...(o.voterIds || []), user.uid] }
        : o
    );
    await updateDoc(doc(db, 'ts_tontines', activeTontineId, 'polls', pollId), { options: updatedOptions });
  };

  // Save aid (admin only - enforced by rules)
  const saveAid = async (aidData) => {
    if (aid?.id) {
      await updateDoc(doc(db, 'ts_tontines', activeTontineId, 'aid', aid.id), aidData);
    } else {
      await addDoc(collection(db, 'ts_tontines', activeTontineId, 'aid'), {
        ...aidData, collected: 0, contributions: [], createdAt: serverTimestamp(),
      });
    }
  };

  // Add aid contribution (admin only - enforced by rules)
  const addAidContribution = async (memberName, amount) => {
    if (!aid?.id) return;
    await updateDoc(doc(db, 'ts_tontines', activeTontineId, 'aid', aid.id), {
      collected: (aid.collected || 0) + amount,
      contributions: [...(aid.contributions || []),
        { member: memberName, amount, date: new Date().toLocaleDateString('fr-FR') }],
    });
    await addDoc(collection(db, 'ts_tontines', activeTontineId, 'history'), {
      type: 'aid', title: aid.title, member: memberName, amount,
      date: new Date().toLocaleDateString('fr-FR'),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      period: `Cycle ${activeTontine?.currentCycle || 1}`,
      createdAt: serverTimestamp(),
    });
  };

  // Update dev settings (MTN/Orange numbers) - restricted by rules to dev email
  // Sends a problem report or suggestion to the developer. Context (who,
  // which tontine, when) is captured automatically so the person doesn't
  // have to explain their situation from scratch every time.
  const submitFeedback = async (type, message) => {
    if (!user || !message.trim()) return { success: false, error: 'Message vide' };
    try {
      await addDoc(collection(db, 'ts_feedback'), {
        type, // 'problem' | 'suggestion'
        message: message.trim(),
        userId: user.uid,
        userName: userProfile?.name || 'Inconnu',
        userEmail: userProfile?.email || user.email || '',
        tontineName: activeTontine?.name || null,
        status: 'new',
        createdAt: serverTimestamp(),
      });
      return { success: true };
    } catch (err) {
      console.error('submitFeedback failed:', err);
      return { success: false, error: err.message };
    }
  };

  const updateDevSettings = async (data) => {
    try {
      await setDoc(doc(db, 'ts_app_settings', 'dev'), data, { merge: true });
      return { success: true };
    } catch (err) {
      console.error('updateDevSettings failed:', err);
      return { success: false, error: err.message };
    }
  };

  // Used by AuthContext.deleteAccount to clean up membership before deleting the user
  const leaveAllTontinesForDeletion = async () => {
    const ids = userProfile?.tontineIds || [];
    for (const tid of ids) {
      try {
        const tSnap = await getDoc(doc(db, 'ts_tontines', tid));
        if (!tSnap.exists()) continue;
        const tData = tSnap.data();
        const otherAdmins = (tData.adminIds || []).filter(id => id !== user.uid);
        const isSuperAdmin = tData.superAdminId === user.uid;
        if (isSuperAdmin && otherAdmins.length === 0) {
          // Sole admin: delete the whole tontine rather than leave it orphaned
          const batch = writeBatch(db);
          const membersSnap = await getDocs(collection(db, 'ts_tontines', tid, 'members'));
          membersSnap.docs.forEach(d => batch.delete(d.ref));
          batch.delete(doc(db, 'ts_tontines', tid));
          await batch.commit();
        } else {
          await deleteDoc(doc(db, 'ts_tontines', tid, 'members', user.uid));
          await updateDoc(doc(db, 'ts_tontines', tid), {
            memberUserIds: arrayRemove(user.uid),
            adminIds: arrayRemove(user.uid),
          });
        }
      } catch (e) {
        console.log('Cleanup error for tontine', tid, e);
      }
    }
  };

  // Register our cleanup function so AuthContext.deleteAccount can call it
  // before actually deleting the Firebase Auth user.
  useEffect(() => {
    if (registerDeleteCleanup) {
      registerDeleteCleanup(leaveAllTontinesForDeletion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, userProfile?.tontineIds?.join(',')]);

  return (
    <TontineContext.Provider value={{
      tontines, activeTontineId, setActiveTontineId,
      activeTontine, isAdmin, members, chat, history, polls, aid,
      loading, devSettings,
      createTontine, joinTontine, becomeAdmin, leaveTontine,
      updateTontine, advanceCycle, deleteTontine, acceptRules,
      removeMember, updateMember, reorderMembers,
      toggleParticipation, sendMessage, pinMessage, deleteMessage,
      createPoll, votePoll, saveAid, addAidContribution,
      updateDevSettings, submitFeedback, leaveAllTontinesForDeletion,
    }}>
      {children}
    </TontineContext.Provider>
  );
}

export const useTontine = () => useContext(TontineContext);
