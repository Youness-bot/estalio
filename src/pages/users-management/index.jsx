import React, { useState, useEffect } from 'react';
import { Search, Plus, UserX, Edit3, CheckCircle2, X, Power, Trash2, Shield } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { auditService } from '../../services/auditService'
;   // ✅ AJOUT
import AddUserModal from './components/AddUserModal';
import EditUserModal from './components/EditUserModal';
import UserPermissionsModal from './components/UserPermissionsModal';

const UsersManagement = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('Accès refusé. Privilèges administrateur requis.');
      setLoading(false);
      return;
    }
    loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await userService?.getAllUsers();

      const usersWithPermissions = userData?.map(user => ({
        ...user,
        permissions: user?.permissions || {}
      }));

      setUsers(usersWithPermissions);
    } catch (err) {
      setError(`Échec du chargement des utilisateurs: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setActionLoading(userId);

      const updatedUser = await userService?.updateUserRole(userId, newRole);

      const { PERMISSION_PRESETS } = await import("../../config/permissionPresets.js");

      const newPermissions = PERMISSION_PRESETS?.[newRole] || {};

      await userService?.updateUserPermissions(userId, newPermissions);

      setUsers(users?.map(user =>
        user?.id === userId
          ? { ...user, role: newRole, permissions: newPermissions }
          : user
      ));

    } catch (err) {
      setError(`Échec de la mise à jour du rôle: ${err?.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      setActionLoading(userId);
      const updatedUser = await userService?.toggleUserStatus(userId, !currentStatus);

      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, isActive: updatedUser?.isActive }
            : user
        )
      );

      // ✅ Audit Log pour activation/désactivation
      await auditService.logEvent({
  action: "USER_STATUS_UPDATE",
  entityType: "user",
  entityId: userId,
  entityName: updatedUser?.email,
  details: `Changement du statut utilisateur (${updatedUser?.isActive ? "activé" : "désactivé"})`,
  severity: "medium",
  success: true
});

    } catch (err) {
      setError(`Échec de la mise à jour du statut: ${err?.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur ${userEmail} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      setActionLoading(userId);
      const result = await userService?.deleteUser(userId);

      if (result?.success) {
        setUsers(users?.filter(user => user?.id !== userId));
        alert('Utilisateur supprimé avec succès');
      } else {
        throw new Error('Échec de la suppression');
      }
    } catch (err) {
      setError(`Échec de la suppression de l'utilisateur: ${err?.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddUser = async () => {
    try {
      await loadUsers();
      setShowAddModal(false);
    } catch (err) {}
  };

  const handleEditUser = async (userData) => {
    try {
      setActionLoading(selectedUser?.id);

      const updatedUser = await userService?.updateUserRole(
        selectedUser?.id,
        userData?.role
      );

      const { PERMISSION_PRESETS } = await import("../../config/permissionPresets.js");

      const newPermissions = PERMISSION_PRESETS?.[userData?.role] || {};

      await userService?.updateUserPermissions(selectedUser?.id, newPermissions);

      setUsers(users?.map(user =>
        user?.id === selectedUser?.id
          ? { ...user, role: userData?.role, permissions: newPermissions }
          : user
      ));

      setShowEditModal(false);
      setSelectedUser(null);

    } catch (err) {
      throw new Error(`Échec de la mise à jour de l'utilisateur: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermissionsUpdate = async (updatedUserData) => {
    try {
      setUsers(users?.map(user =>
        user?.id === updatedUserData?.id ? { ...user, permissions: updatedUserData?.permissions } : user
      ));
    } catch (err) {}
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch =
      user?.fullName?.toLowerCase()?.includes(search?.toLowerCase()) ||
      user?.email?.toLowerCase()?.includes(search?.toLowerCase());

    const matchesRole = roleFilter === 'all' || user?.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = user?.isActive;
    else if (statusFilter === 'inactive') matchesStatus = !user?.isActive;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString)?.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserStatusDisplay = (user) => {
    if (user?.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Actif
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300">
        <UserX className="w-3 h-3 mr-1" />
        Inactif
      </span>
    );
  };

  if (!isAdmin) {
    return (
      <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <UserX className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accès Refusé</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Vous avez besoin de privilèges administrateur pour accéder à la gestion des utilisateurs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white dark:bg-gray-900 min-h-screen p-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Utilisateurs</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Gérer les comptes, rôles et permissions utilisateurs (Admin-Only Provisioning)
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter un utilisateur
        </Button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">Utilisateur</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>

        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 dark:text-gray-300">Chargement…</span>
            </div>
          </div>
        ) : (

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Créé le</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">

                {filteredUsers?.map((user) => (
                  <tr key={user?.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">

                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                          {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">{user?.fullName || 'Nom non renseigné'}</div>
                          <div className="text-sm text-gray-500">{user?.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={user?.role}
                        onChange={(e) => handleRoleChange(user?.id, e.target.value)}
                        disabled={actionLoading === user?.id}
                        className="border rounded px-2 py-1 bg-white dark:bg-gray-700"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td className="px-6 py-4">{getUserStatusDisplay(user)}</td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user?.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">

                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPermissionsModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                        >
                          <Shield className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleStatusToggle(user?.id, user?.isActive)}
                          disabled={actionLoading === user?.id}
                          className={`p-1 ${
                            user?.isActive
                              ? "text-red-600 hover:text-red-900"
                              : "text-green-600 hover:text-green-900"
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user?.id, user?.email)}
                          disabled={actionLoading === user?.id}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900 p-1"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>

            {filteredUsers?.length === 0 && (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">Aucun utilisateur trouvé</h3>
              </div>
            )}

          </div>
        )}
      </div>

      {showAddModal && (
        <AddUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onUserAdded={handleAddUser}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleEditUser}
        />
      )}

      {showPermissionsModal && selectedUser && (
        <UserPermissionsModal
          user={selectedUser}
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedUser(null);
          }}
          onUpdated={handlePermissionsUpdate}
        />
      )}

    </div>
  );
};

export default UsersManagement;
