import React, { useState, useEffect } from 'react';
import { X, Shield, User, Mail } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { PERMISSION_PRESETS } from '../../../config/permissionPresets';
import { userService } from '../../../services/userService';

const EditUserModal = ({ user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    role: user?.role || 'user',
  });

  const [applyPreset, setApplyPreset] = useState(false); // NEW
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        role: user?.role,
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e?.preventDefault();

    try {
      setLoading(true);
      setError('');

      // 1) Update role
      const updatedUser = await onSubmit(formData);

      // 2) If admin chooses to apply the preset, update permissions too
      if (applyPreset && formData?.role && PERMISSION_PRESETS?.[formData?.role]) {
        await userService?.updateUserPermissions(user?.id, PERMISSION_PRESETS?.[formData?.role]);
      }

    } catch (err) {
      setError(err?.message);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e?.target?.name]: e?.target?.value,
    });
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-screen overflow-y-auto shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Modifier l’utilisateur</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* User Info */}
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={user?.fullName}
                disabled
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rôle
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                name="role"
                value={formData?.role}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <option value="user">Utilisateur</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Le changement de rôle peut modifier les permissions.
            </p>
          </div>

          {/* NEW — Ask if applying preset */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <label className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              Réappliquer les permissions par défaut de ce rôle ?
            </label>

            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="applyPreset"
                  value="yes"
                  checked={applyPreset === true}
                  onChange={() => setApplyPreset(true)}
                />
                Oui
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="applyPreset"
                  value="no"
                  checked={applyPreset === false}
                  onChange={() => setApplyPreset(false)}
                />
                Non
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>

            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Mise à jour...
                </div>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditUserModal;