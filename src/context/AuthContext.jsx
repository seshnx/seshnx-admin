import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

  // Use ref to prevent duplicate checks
  const hasChecked = useRef(false);

  useEffect(() => {
    // Prevent multiple checks even if component re-renders
    if (hasChecked.current) {
      return;
    }

    const checkAdminStatus = async () => {
      // Mark as checked immediately to prevent duplicates
      hasChecked.current = true;

      try {
        if (!isSignedIn || !userId) {
          // User not logged in, don't check admin status
          setLoading(false);
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
          console.warn(`API returned status ${response.status}`);

          if (response.status === 401 || response.status === 403) {
            console.log('User is not an admin');
          } else {
            console.error('Server error checking admin status');
          }
        }
      } catch (error) {
        // Catch any network errors or other exceptions
        console.error('Error checking admin status:', error);
      } finally {
        // Always stop loading
        setLoading(false);
      }
    };

    // Only run when Clerk is loaded
    if (isLoaded) {
      checkAdminStatus();
    }
  }, [isLoaded]); // Only depend on isLoaded, not isSignedIn or userId

  const logout = async () => {
    try {
      await clerkAuth.signOut();
      setToken(null);
      setCurrentUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUserProfile(null);
      hasChecked.current = false;
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
