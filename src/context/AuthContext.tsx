import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudentProfile, Membership } from '../types';
import { apiFetch, setStoredToken, getStoredToken } from '../api';

interface AuthContextType {
  user: User | null;
  studentProfile: StudentProfile | null;
  membership: Membership | null;
  loading: boolean;
  login: (emailOrPhone: string, pass: string) => Promise<void>;
  demoLogin: (role: 'owner' | 'teacher' | 'student', studentKey?: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setStudentProfile(null);
      setMembership(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/api/auth/me');
      if (data && data.user) {
        setUser(data.user);
        setStudentProfile(data.studentProfile || null);
        setMembership(data.membership || null);
      } else {
        setStoredToken(null);
        setUser(null);
        setStudentProfile(null);
        setMembership(null);
      }
    } catch {
      // Stale or invalidated token - clear gracefully without noisy console traces
      setStoredToken(null);
      setUser(null);
      setStudentProfile(null);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (emailOrPhone: string, pass: string) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password: pass })
    });
    setStoredToken(data.token);
    setUser(data.user);
    setStudentProfile(data.studentProfile || null);
    setMembership(data.membership || null);
  };

  const demoLogin = async (role: 'owner' | 'teacher' | 'student', studentKey?: string) => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ role, studentKey })
      });
      setStoredToken(data.token);
      setUser(data.user);
      setStudentProfile(data.studentProfile || null);
      setMembership(data.membership || null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: any) => {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setStoredToken(data.token);
    setUser(data.user);
    setStudentProfile(data.studentProfile || null);
    setMembership(data.membership || null);
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
    setStudentProfile(null);
    setMembership(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        membership,
        loading,
        login,
        demoLogin,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
