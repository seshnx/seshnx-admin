import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

const AuthContext = createContext();

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const clerkAuth = useClerkAuth();
  const { isLoaded, isSignedIn, userId } = clerkAuth;

  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isLoaded) {
        setLoading(true);
        return;
      }

      if (!isSignedIn || !userId) {
        setCurrentUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setUserProfile(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        // Get JWT token for API calls
        const jwtToken = await clerkAuth.getToken();
        setToken(jwtToken);

        // Fetch admin user info from API
        const response = await fetch('/api/admin/me', {
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // Not an admin or unauthorized
            console.warn('User is not an admin or unauthorized');
            setCurrentUser(null);
            setIsAdmin(false);
            setIsSuperAdmin(false);
            setUserProfile(null);
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch admin info: ${response.status}`);
        }

        const data = await response.json();
        const adminUser = data.user;

        if (!adminUser) {
          console.warn('User not found in database:', userId);
          setCurrentUser(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        setCurrentUser({
          id: adminUser.id,
          email: adminUser.email,
          username: adminUser.username,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
        });
        setIsAdmin(true);
        setIsSuperAdmin(adminUser.isSuperAdmin);
        setUserProfile({
          accountTypes: adminUser.roles,
          activeRole: adminUser.activeRole,
          source: 'api'
        });

        setLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setCurrentUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setUserProfile(null);
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [isLoaded, isSignedIn, userId, clerkAuth]);

  const logout = async () => {
    try {
      await clerkAuth.signOut();
      setToken(null);
      setCurrentUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    currentUser,
    isAdmin,
    isSuperAdmin,
    userProfile,
    token,
    loading,
    logout,
    // Clerk auth methods for backward compatibility
    isLoaded,
    isSignedIn
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
