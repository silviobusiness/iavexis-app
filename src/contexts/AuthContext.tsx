import React, { createContext, useContext } from 'react';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: 'admin' | 'user';
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: { uid: 'guest-user' },
  profile: {
    uid: 'guest-user',
    name: 'Designer',
    email: 'guest@iavexis.com',
    role: 'admin'
  },
  loading: false,
  isAdmin: true,
  signIn: async () => {},
  signInWithGithub: async () => {},
  signInAsGuest: async () => {},
  logOut: async () => {},
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContext.Provider value={{
    user: { uid: 'guest-user' },
    profile: {
      uid: 'guest-user',
      name: 'Designer',
      email: 'guest@iavexis.com',
      role: 'admin'
    },
    loading: false,
    isAdmin: true,
    signIn: async () => {},
    signInWithGithub: async () => {},
    signInAsGuest: async () => {},
    logOut: async () => {},
    signUpWithEmail: async () => {},
    signInWithEmail: async () => {},
    resetPassword: async () => {},
    updateProfile: async () => {},
  }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
