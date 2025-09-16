"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getUserPermissions } from "@/lib/firestore";

const PermissionContext = createContext({});

export function usePermissions() {
  return useContext(PermissionContext);
}

export function PermissionProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState({
    role: "public",
    branches: [],
    canEditAll: false,
    mustChangePassword: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (authLoading) return;

      setLoading(true);
      try {
        if (user) {
          const userPermissions = await getUserPermissions(user.uid);
          setPermissions(userPermissions);
        } else {
          setPermissions({
            role: "public",
            branches: [],
            canEditAll: false,
            mustChangePassword: false,
          });
        }
      } catch (error) {
        console.error("Error fetching user permissions:", error);
        setPermissions({
          role: "public",
          branches: [],
          canEditAll: false,
          mustChangePassword: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user, authLoading]);

  // Helper functions
  const isSuperAdmin = () => permissions.role === "super_admin";
  const isBranchAdmin = () => permissions.role === "branch_admin";
  const isAuthenticated = () => !!user;
  const isPublic = () => permissions.role === "public";

  const canEditMember = (memberId) => {
    if (!user) return false;
    if (isSuperAdmin()) return true;
    // This will be enhanced with actual member checking
    return isBranchAdmin();
  };

  const canAssignAdmin = () => {
    return isAuthenticated() && (isSuperAdmin() || isBranchAdmin());
  };

  const canCreateMembers = () => {
    return isAuthenticated();
  };

  const refreshPermissions = async () => {
    if (user) {
      try {
        const userPermissions = await getUserPermissions(user.uid);
        setPermissions(userPermissions);
      } catch (error) {
        console.error("Error refreshing permissions:", error);
      }
    }
  };

  const value = {
    permissions,
    loading,
    user,

    // Role checks
    isSuperAdmin,
    isBranchAdmin,
    isAuthenticated,
    isPublic,

    // Permission checks
    canEditMember,
    canAssignAdmin,
    canCreateMembers,

    // Utility
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
