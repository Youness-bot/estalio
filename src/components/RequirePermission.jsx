import React from "react";
import { useAuth } from "../contexts/AuthContext";

export default function RequirePermission({ perm, children }) {
  const { userProfile, loading } = useAuth();

  if (loading) return null;
  if (!userProfile) return null;

  const perms = userProfile?.permissions || {};
  const hasPermission = perms?.[perm] === true;

  if (hasPermission) return <>{children}</>;

  return null;
}