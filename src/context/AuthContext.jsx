import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { queryOne } from '../config/neon.js';

const AuthContext = createContext();

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const clerkAuth = useClerkAuth();
  const { isLoaded, isSignedIn, userId, getToken } = clerkAuth;

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
        const jwtToken = await getToken();
        setToken(jwtToken);

        // Fetch user from Neon database to check admin status
        const adminUser = await queryOne(
          `SELECT
            id,
            email,
            username,
            first_name,
            last_name,
            account_types,
            active_role,
            profile_photo_url,
            deleted_at
          FROM clerk_users
          WHERE id = $1`,
          [userId]
        );

        if (!adminUser) {
          console.warn('User not found in database:', userId);
          setCurrentUser(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        // Check if user is banned
        if (adminUser.deleted_at) {
          console.warn('User account is banned:', userId);
          // Sign out from Clerk
          await clerkAuth.signOut();
          setCurrentUser(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        // Check if user has admin role
        const accountTypes = adminUser.account_types || [];
        const isAdmin = accountTypes.includes('GAdmin') || accountTypes.includes('SuperAdmin');
        const isSuperAdmin = accountTypes.includes('SuperAdmin');

        setCurrentUser(adminUser);
        setIsAdmin(isAdmin);
        setIsSuperAdmin(isSuperAdmin);
        setUserProfile({
          accountTypes,
          activeRole: adminUser.active_role,
          source: 'neon-database'
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
  }, [isLoaded, isSignedIn, userId, getToken]);

  const logout = async () => {
    try {
      await clerkAuth.signOut();
      setToken(null);
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
