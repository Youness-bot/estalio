import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequirePermissionRoute({ perm, children }) {
  const { userProfile, loading } = useAuth();

  if (loading) return null;
  if (!userProfile) return <Navigate to="/dashboard" replace />;

  const perms = userProfile?.permissions || {};
  const hasPermission = perms?.[perm] === true;

  if (hasPermission) return <>{children}</>;

  return <Navigate to="/dashboard" replace />;
}