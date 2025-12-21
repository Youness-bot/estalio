import React from 'react';

import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const TeamMemberTable = ({ members, isAdmin, onEdit, onViewHistory }) => {
  const getRoleColor = (role) => {
    const colors = {
      'Manager': 'bg-primary text-primary-foreground',
      'Cleaner': 'bg-success text-success-foreground',
      'Maintenance': 'bg-warning text-warning-foreground',
      'Receptionist': 'bg-secondary text-secondary-foreground',
      'Administrator': 'bg-accent text-accent-foreground'
    };
    return colors?.[role] || 'bg-muted text-muted-foreground';
  };

  const getContractColor = (type) => {
    return type === 'Full-time' ? 'text-success' : 'text-warning';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground">Member</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Start Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Contract</th>
              {isAdmin && (
                <th className="text-left p-4 font-medium text-muted-foreground">Salary</th>
              )}
              <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members?.map((member, index) => (
              <tr key={member?.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <Image
                      src={member?.avatar}
                      alt={member?.avatarAlt}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium text-foreground">{member?.name}</div>
                      <div className="text-sm text-muted-foreground">{member?.department}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member?.role)}`}>
                    {member?.role}
                  </span>
                </td>
                <td className="p-4 text-sm text-muted-foreground">{member?.email}</td>
                <td className="p-4 text-sm text-muted-foreground">{member?.startDate}</td>
                <td className="p-4">
                  <span className={`text-sm font-medium ${getContractColor(member?.contractType)}`}>
                    {member?.contractType}
                  </span>
                </td>
                {isAdmin && (
                  <td className="p-4 text-sm font-medium text-foreground">{member?.salary}</td>
                )}
                <td className="p-4">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Edit"
                      onClick={() => onEdit(member)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="History"
                      onClick={() => onViewHistory(member)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="MessageCircle"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamMemberTable;