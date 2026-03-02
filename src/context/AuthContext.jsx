import { createContext, useContext, useState, useEffect } from 'react';
import chromaApi from '../api/chromaApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('chroma_token') || '');
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('chroma_base_url') || '');
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    chromaApi.setToken(token);
    if (baseUrl) {
      chromaApi.setBaseUrl(baseUrl);
    }
    checkConnection();
  }, [token, baseUrl]);

  const checkConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await chromaApi.healthcheck();
      setConnected(true);
      try {
        const id = await chromaApi.getAuthIdentity();
        setIdentity(id);
      } catch (e) {
        // If no auth required, use default tenant/database
        console.log('Using default identity (no auth required)');
        setIdentity({
          tenant: 'default_tenant',
          database: 'default_database',
        });
      }
    } catch (e) {
      setError(e.message);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken) => {
    setToken(newToken);
  };

  const setServerUrl = (url) => {
    setBaseUrl(url);
  };

  const logout = () => {
    chromaApi.clearToken();
    chromaApi.clearBaseUrl();
    setToken('');
    setBaseUrl('');
    setIdentity(null);
    setConnected(false);
  };

  return (
    <AuthContext.Provider value={{
      token,
      baseUrl,
      identity,
      loading,
      error,
      connected,
      login,
      setServerUrl,
      logout,
      checkConnection,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;
