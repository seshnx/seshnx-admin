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

  // Use refs to track mounted state and prevent race conditions
  const isMounted = useRef(true);
  const checkInProgress = useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Prevent multiple simultaneous checks
      if (checkInProgress.current) {
        return;
      }

      if (!isLoaded) {
        if (isMounted.current) {
          setLoading(true);
        }
        return;
      }

      if (!isSignedIn || !userId) {
        if (isMounted.current) {
          setCurrentUser(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setUserProfile(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      checkInProgress.current = true;

      try {
        // Get JWT token for API calls
        const jwtToken = await clerkAuth.getToken();
        if (!isMounted.current) return;

        setToken(jwtToken);

        // Fetch admin user info from API
        const response = await fetch('/api/admin/me', {
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          }
        });

        if (!isMounted.current) return;

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
          if (isMounted.current) {
            setCurrentUser(null);
            setIsAdmin(false);
            setIsSuperAdmin(false);
            setUserProfile(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted.current) {
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
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (isMounted.current) {
          setCurrentUser(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setUserProfile(null);
          setLoading(false);
        }
      } finally {
        checkInProgress.current = false;
      }
    };

    checkAdminStatus();
  }, [isLoaded, isSignedIn, userId]); // Removed clerkAuth from dependencies

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
