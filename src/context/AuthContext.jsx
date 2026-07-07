import { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  deleteUser,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

// Friendly error messages for common Firebase Auth error codes
const AUTH_ERROR_MESSAGES = {
  'auth/user-not-found': 'Compte introuvable.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/email-already-in-use': 'Cet email est déjà utilisé.',
  'auth/weak-password': 'Mot de passe trop faible (6 caractères minimum).',
  'auth/invalid-email': 'Adresse email invalide.',
  'auth/network-request-failed': 'Pas de connexion internet. Vérifiez votre réseau.',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
  'auth/requires-recent-login': 'Veuillez vous reconnecter avant de refaire cette action.',
};
export const getAuthErrorMessage = (code) => AUTH_ERROR_MESSAGES[code] || 'Une erreur est survenue. Réessayez.';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // Optional hook set by TontineProvider so deleteAccount can clean up memberships first
  const cleanupBeforeDeleteRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const snap = await getDoc(doc(db, 'ts_users', firebaseUser.uid));
          if (snap.exists()) setUserProfile(snap.data());
        } catch (e) {
          console.log('Profile load error:', e);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const register = async (email, password, name, role) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const profile = {
      uid: cred.user.uid,
      name,
      email,
      role,
      avatar: null,
      createdAt: serverTimestamp(),
      tontineIds: [],
      fcmToken: null,
      hasDonated: false,
    };
    await setDoc(doc(db, 'ts_users', cred.user.uid), profile);
    setUserProfile(profile);
    return cred;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  // Called by TontineProvider to register its cleanup function
  const registerDeleteCleanup = (fn) => { cleanupBeforeDeleteRef.current = fn; };

  const deleteAccount = async () => {
    if (!user) return;
    // 1. Leave/delete tontines properly so no orphaned member docs remain
    if (cleanupBeforeDeleteRef.current) {
      await cleanupBeforeDeleteRef.current();
    }
    // 2. Remove the user profile document
    await deleteDoc(doc(db, 'ts_users', user.uid));
    // 3. Delete the Firebase Auth account itself
    await deleteUser(user);
  };

  const updateUserProfile = async (data) => {
    if (!user) return;
    const updated = { ...userProfile, ...data };
    await setDoc(doc(db, 'ts_users', user.uid), updated, { merge: true });
    setUserProfile(updated);

    // The member record inside each tontine is a copy taken at join time
    // (avatar, initials, name) -- it never updates itself afterward. If the
    // person just changed their photo or display name, push that change
    // into every tontine they belong to so it shows up in Membres,
    // Participation and Stats everywhere, not just on their own Profil tab.
    if ((data.avatar !== undefined || data.name !== undefined) && updated.tontineIds?.length) {
      const memberUpdate = {};
      if (data.avatar !== undefined) memberUpdate.avatar = data.avatar;
      if (data.name !== undefined) {
        memberUpdate.name = data.name;
        memberUpdate.av = data.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      }
      await Promise.allSettled(
        updated.tontineIds.map(tid =>
          updateDoc(doc(db, 'ts_tontines', tid, 'members', user.uid), memberUpdate)
        )
      );
    }
  };

  return (
    <AuthContext.Provider value={{
      user, userProfile, loading,
      register, login, logout, resetPassword, deleteAccount, updateUserProfile,
      registerDeleteCleanup,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
