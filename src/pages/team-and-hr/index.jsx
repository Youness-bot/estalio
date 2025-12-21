import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import TeamStats from './components/TeamStats';
import TeamFilters from './components/TeamFilters';
import TeamMemberTable from './components/TeamMemberTable';
import TeamMemberCard from './components/TeamMemberCard';
import AddTeamMemberModal from './components/AddTeamMemberModal';
import HistoryModal from './components/HistoryModal';
import { teamService } from '../../services/teamService';

const TeamAndHR = () => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isAdmin, setIsAdmin] = useState(true); // Mock admin status

  // Supabase integration - remove mock data
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load team members from Supabase
  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await teamService?.getAll();
      setTeamMembers(data || []);
    } catch (err) {
      console.error('Error loading team members:', err);
      setError(err?.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  // Mock history data
  const mockHistoryData = [
  {
    type: 'bonus',
    title: 'Performance Bonus',
    description: 'Quarterly performance bonus for exceeding targets',
    date: '2024-10-15',
    amount: '$500',
    approvedBy: 'Sarah Johnson'
  },
  {
    type: 'training',
    title: 'Safety Training Completed',
    description: 'Completed workplace safety and emergency procedures training',
    date: '2024-09-20',
    duration: '8 hours'
  },
  {
    type: 'absence',
    title: 'Sick Leave',
    description: 'Medical leave for flu recovery',
    date: '2024-08-10',
    duration: '3 days',
    approvedBy: 'Lisa Anderson'
  },
  {
    type: 'promotion',
    title: 'Role Promotion',
    description: 'Promoted from Junior to Senior position',
    date: '2024-07-01',
    approvedBy: 'Sarah Johnson'
  },
  {
    type: 'contract',
    title: 'Contract Renewal',
    description: 'Annual contract renewed with salary adjustment',
    date: '2024-06-15',
    approvedBy: 'Lisa Anderson'
  }];

  // Filter team members based on search and filters
  const filteredMembers = teamMembers?.filter((member) => {
    const matchesSearch = member?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
    member?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesDepartment = !selectedDepartment || member?.department === selectedDepartment;
    const matchesRole = !selectedRole || member?.role === selectedRole;
    const matchesStatus = !selectedStatus || member?.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  const handleAddMember = async (memberData) => {
    try {
      const newMember = await teamService?.create(memberData);
      setTeamMembers(prev => [newMember, ...prev]);
      setShowAddModal(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('Error adding team member:', err);
      setError(err?.message || 'Failed to add team member');
    }
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowAddModal(true);
  };

  const handleViewHistory = (member) => {
    setSelectedMember(member);
    setShowHistoryModal(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedRole('');
    setSelectedStatus('');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-white mb-2">Team & HR Management</h1>
            <p className="text-muted-foreground dark:text-gray-300">
              Manage your team members, roles, and employment records
            </p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-gray-300">Loading team members...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-white mb-2">Team & HR Management</h1>
            <p className="text-muted-foreground dark:text-gray-300">
              Manage your team members, roles, and employment records
            </p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">Error Loading Team Members</h3>
          <p className="text-muted-foreground dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={loadTeamMembers}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-white mb-2">Team & HR Management</h1>
          <p className="text-muted-foreground dark:text-gray-300">
            Manage your team members, roles, and employment records
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="flex items-center bg-muted dark:bg-gray-700 rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              iconName="Table"
              onClick={() => setViewMode('table')} />

            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              iconName="Grid3X3"
              onClick={() => setViewMode('cards')} />

          </div>
          <Button
            iconName="Plus"
            iconPosition="left"
            onClick={() => setShowAddModal(true)}>

            Add Member
          </Button>
        </div>
      </div>

      {/* Team Statistics */}
      <TeamStats members={teamMembers} />

      {/* Filters */}
      <TeamFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onClearFilters={handleClearFilters} />


      {/* Team Members Display */}
      {viewMode === 'table' ?
      <TeamMemberTable
        members={filteredMembers}
        isAdmin={isAdmin}
        onEdit={handleEditMember}
        onViewHistory={handleViewHistory} /> :


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers?.map((member) =>
        <TeamMemberCard
          key={member?.id}
          member={member}
          isAdmin={isAdmin}
          onEdit={handleEditMember}
          onViewHistory={handleViewHistory} />

        )}
        </div>
      }

      {/* Empty State */}
      {filteredMembers?.length === 0 && !loading &&
      <div className="text-center py-12">
          <Icon name="Users" size={48} className="mx-auto text-muted-foreground dark:text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">No team members found</h3>
          <p className="text-muted-foreground dark:text-gray-300 mb-4">
            {searchTerm || selectedDepartment || selectedRole || selectedStatus ?
          'Try adjusting your filters to see more results.' : 'Get started by adding your first team member.'}
          </p>
          {!searchTerm && !selectedDepartment && !selectedRole && !selectedStatus &&
        <Button
          iconName="Plus"
          iconPosition="left"
          onClick={() => setShowAddModal(true)}>

              Add First Member
            </Button>
        }
        </div>
      }

      {/* Bulk Actions */}
      {filteredMembers?.length > 0 &&
      <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="outline" iconName="Mail" iconPosition="left">
            Send Group Email
          </Button>
          <Button variant="outline" iconName="Download" iconPosition="left">
            Export Team Data
          </Button>
          <Button variant="outline" iconName="Calendar" iconPosition="left">
            Schedule Meeting
          </Button>
        </div>
      }

      {/* Modals */}
      <AddTeamMemberModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedMember(null);
        }}
        onSave={handleAddMember}
        member={selectedMember} />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        historyData={mockHistoryData} />

    </div>);

};

export default TeamAndHR;