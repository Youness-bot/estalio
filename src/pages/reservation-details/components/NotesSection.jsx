import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const NotesSection = ({ notes, onAddNote, onUpdateNote, onDeleteNote }) => {
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [editContent, setEditContent] = useState('');

  const handleAddNote = () => {
    if (newNote?.trim()) {
      onAddNote({
        id: `note-${Date.now()}`,
        content: newNote,
        author: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'internal'
      });
      setNewNote('');
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note?.id);
    setEditContent(note?.content);
  };

  const handleSaveEdit = () => {
    if (editContent?.trim()) {
      onUpdateNote(editingNote, {
        content: editContent,
        updatedAt: new Date()
      });
      setEditingNote(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditContent('');
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp)?.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNoteTypeIcon = (type) => {
    const typeConfig = {
      'internal': { icon: 'FileText', color: 'text-blue-600' },
      'guest': { icon: 'User', color: 'text-green-600' },
      'maintenance': { icon: 'Wrench', color: 'text-orange-600' },
      'cleaning': { icon: 'Sparkles', color: 'text-purple-600' }
    };

    return typeConfig?.[type] || typeConfig?.['internal'];
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Icon name="StickyNote" size={20} className="mr-2" />
          Notes & Comments
        </h2>
        <span className="text-sm text-muted-foreground">
          {notes?.length} {notes?.length === 1 ? 'note' : 'notes'}
        </span>
      </div>
      {/* Add New Note */}
      <div className="mb-6 p-4 bg-muted rounded-lg">
        <div className="space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e?.target?.value)}
            placeholder="Add a note about this reservation..."
            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              variant="default"
              size="sm"
              iconName="Plus"
              onClick={handleAddNote}
              disabled={!newNote?.trim()}
            >
              Add Note
            </Button>
          </div>
        </div>
      </div>
      {/* Notes List */}
      <div className="space-y-4">
        {notes?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="StickyNote" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notes added yet</p>
            <p className="text-sm text-muted-foreground">Add internal notes, guest preferences, or important reminders</p>
          </div>
        ) : (
          notes?.map((note) => {
            const noteType = getNoteTypeIcon(note?.type);
            
            return (
              <div key={note?.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Icon name={noteType?.icon} size={16} className={noteType?.color} />
                    <span className="text-sm font-medium text-foreground">{note?.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(note?.createdAt)}
                    </span>
                    {note?.updatedAt && note?.updatedAt !== note?.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        (edited {formatTimestamp(note?.updatedAt)})
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditNote(note)}
                      className="h-8 w-8"
                    >
                      <Icon name="Edit2" size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteNote(note?.id)}
                      className="h-8 w-8 text-error hover:text-error"
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                </div>
                {editingNote === note?.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e?.target?.value)}
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={!editContent?.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-foreground whitespace-pre-wrap">
                    {note?.content}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotesSection;