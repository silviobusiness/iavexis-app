import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  User, 
  EmailAuthProvider, 
  GoogleAuthProvider,
  linkWithCredential, 
  signOut, 
  signInWithEmailAndPassword,
  signInWithPopup,
  linkWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  linkAccount: (email: string, password: string) => Promise<void>;
  linkWithGoogle: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  updateProfile: async () => {},
  linkAccount: async () => {},
  linkWithGoogle: async () => {},
  login: async () => {},
  loginWithGoogle: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualLogout, setManualLogout] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setManualLogout(false);
        setUser(currentUser);
        
        // Fetch or create profile
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              name: 'Designer',
              email: currentUser.email || 'guest@iavexis.com',
              role: 'user'
            };
            await setDoc(userDocRef, {
              ...newProfile,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching/creating profile:", error);
        }
        setLoading(false);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [manualLogout]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const linkAccount = async (email: string, password: string) => {
    if (!user) {
      throw new Error("Usuário não está logado.");
    }
    
    const credential = EmailAuthProvider.credential(email, password);
    try {
      const usercred = await linkWithCredential(user, credential);
      setUser(usercred.user);
      
      // Update profile with new email
      await updateProfile({ email });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("Este e-mail já está em uso por outra conta. Tente fazer login em vez de vincular.");
      }
      console.error("Error linking account:", error);
      throw error;
    }
  };

  const linkWithGoogle = async () => {
    if (!user) {
      throw new Error("Usuário não está logado.");
    }
    
    const provider = new GoogleAuthProvider();
    try {
      const usercred = await linkWithPopup(user, provider);
      setUser(usercred.user);
      if (usercred.user.email) {
        await updateProfile({ email: usercred.user.email, name: usercred.user.displayName || 'Designer' });
      }
    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        throw new Error("Esta conta Google já está vinculada a outro usuário. Tente fazer login em vez de vincular.");
      }
      console.error("Error linking Google account:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const usercred = await signInWithEmailAndPassword(auth, email, password);
      setUser(usercred.user);
    } catch (error: any) {
      console.error("Error logging in:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error("E-mail ou senha incorretos.");
      }
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const usercred = await signInWithPopup(auth, provider);
      setUser(usercred.user);
    } catch (error: any) {
      console.error("Error logging in with Google:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setManualLogout(true);
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin: profile?.role === 'admin' || user?.email === 'ievexisapp@gmail.com',
      updateProfile,
      linkAccount,
      linkWithGoogle,
      login,
      loginWithGoogle,
      resetPassword,
      logout,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
