import React, { useEffect, useState } from "react";
import { userService } from "../../../services/userService";

const PERMISSIONS_CONFIG = [
  { key: "dashboard.view", label: "Tableau de bord" },
  { key: "reservations.view", label: "Réservations" },
  { key: "reservationDetails.view", label: "Détails des réservations" },
  { key: "tasks.view", label: "Tâches & planning" },
  { key: "properties.view", label: "Propriétés" },
  { key: "inventory.view", label: "Inventaire" },
  { key: "team.view", label: "Équipe & RH" },
  { key: "users.view", label: "Gestion des utilisateurs" },
  { key: "expenses.view", label: "Dépenses" },
  { key: "pricing.view", label: "Règles de tarification" },
  { key: "revenues.view", label: "Revenus & rapports" },
  { key: "automation.view", label: "Automatisation & IA" },
  { key: "settings.view", label: "Paramètres" },
  { key: "audit.view", label: "Journal d\'audit" }
];

export default function UserPermissionsModal({
  user,
  isOpen,
  onClose,
  onUpdated
}) {
  const [localPermissions, setLocalPermissions] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load user permissions when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setLocalPermissions(user?.permissions || {});
      setError('');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleToggle = (key) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [key]: !prev?.[key]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const result = await userService?.updateUserPermissions(
        user?.id,
        localPermissions
      );

      if (!result?.success) {
        console.error("Permission update failed:", result?.error);
        setError(result?.error || "Erreur lors de la mise à jour des permissions.");
        return;
      }

      // Notify parent component to refresh user data
      if (onUpdated) {
        onUpdated(result?.data);
      }

      onClose();
    } catch (err) {
      console.error("Exception handleSave:", err);
      setError(err?.message || "Erreur inattendue lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-xl w-full p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Permissions pour {user?.fullName || user?.email}
        </h2>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
          {PERMISSIONS_CONFIG?.map((perm) => (
            <label
              key={perm?.key}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <span className="text-sm text-gray-900 dark:text-white">{perm?.label}</span>
              <input
                type="checkbox"
                checked={localPermissions?.[perm?.key] === true}
                onChange={() => handleToggle(perm?.key)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}