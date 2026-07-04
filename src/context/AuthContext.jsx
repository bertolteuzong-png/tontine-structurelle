import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  deleteUser,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const snap = await getDoc(doc(db, 'ts_users', firebaseUser.uid));
        if (snap.exists()) setUserProfile(snap.data());
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
    };
    await setDoc(doc(db, 'ts_users', cred.user.uid), profile);
    setUserProfile(profile);
    return cred;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const deleteAccount = async () => {
    if (!user) return;
    await deleteDoc(doc(db, 'ts_users', user.uid));
    await deleteUser(user);
  };

  const updateUserProfile = async (data) => {
    if (!user) return;
    const updated = { ...userProfile, ...data };
    await setDoc(doc(db, 'ts_users', user.uid), updated, { merge: true });
    setUserProfile(updated);
  };

  return (
    <AuthContext.Provider value={{
      user, userProfile, loading,
      register, login, logout, resetPassword, deleteAccount, updateUserProfile,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
