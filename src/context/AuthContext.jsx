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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only check once when Clerk is loaded
    if (!isLoaded || initialized) {
      return;
    }

    const checkAdminStatus = async () => {
      try {
        if (!isSignedIn || !userId) {
          // User not logged in, don't check admin status
          setLoading(false);
          setInitialized(true);
          return;
        }

        // Get JWT token
        const jwtToken = await clerkAuth.getToken();
        setToken(jwtToken);

        // Fetch admin user info from API
        const response = await fetch('/api/admin/me', {
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const adminUser = data.user;

          if (adminUser) {
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
          }
        } else {
          // Handle all non-200 responses gracefully
          console.warn(`API returned status ${response.status}:`, response.status);

          if (response.status === 401 || response.status === 403) {
            // Not an admin, that's ok - just don't set admin user
            console.log('User is not an admin');
          } else {
            // Server error (500) or other - log it but don't crash
            console.error('Server error checking admin status');
          }
        }
      } catch (error) {
        // Catch any network errors or other exceptions
        console.error('Error checking admin status:', error);
      } finally {
        // Always set these to stop the loop
        setLoading(false);
        setInitialized(true);
      }
    };

    checkAdminStatus();
  }, [isLoaded, isSignedIn, userId, initialized]);

  const logout = async () => {
    try {
      await clerkAuth.signOut();
      setToken(null);
      setCurrentUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUserProfile(null);
      setInitialized(false);
      setLoading(false);
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
