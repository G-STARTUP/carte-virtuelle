import React, { createContext, useContext, useEffect, useState } from 'react';

// Types
export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  kyc_status?: 'not_verified' | 'pending' | 'verified' | 'rejected';
  roles?: string[];
}

export interface Session {
  user: User;
  token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'gwap_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger token au démarrage
  useEffect(() => {
    const loadSession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          // Récupérer profil utilisateur avec le token
          const response = await fetch(`${API_BASE_URL}/user?action=profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const { profile } = await response.json();
            setUser(profile);
            setSession({ user: profile, token });
          } else {
            // Token invalide, nettoyer
            localStorage.removeItem(TOKEN_KEY);
          }
        } catch (error) {
          console.error('Erreur chargement session:', error);
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      setLoading(false);
    };

    loadSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      // Stocker token
      localStorage.setItem(TOKEN_KEY, data.token);

      // Récupérer profil
      const profileResponse = await fetch(`${API_BASE_URL}/user?action=profile`, {
        headers: {
          'Authorization': `Bearer ${data.token}`,
          'Content-Type': 'application/json'
        }
      });

      const { profile } = await profileResponse.json();
      setUser(profile);
      setSession({ user: profile, token: data.token });
    } catch (error: any) {
      console.error('Erreur signIn:', error);
      throw error;
    }
  };

  const signUp = async (
    email: string, 
    password: string,
    firstName?: string,
    lastName?: string,
    phone?: string
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur d\'inscription');
      }

      // Auto-login après inscription
      await signIn(email, password);
    } catch (error: any) {
      console.error('Erreur signUp:', error);
      throw error;
    }
  };

  const signOut = async () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setSession(null);
  };

  const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
