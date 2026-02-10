'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Plus, Edit, Trash2, Pin, PinOff, Save, X, StickyNote } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotesListProps {
  customerId?: string;
  dealId?: string;
  taskId?: string;
}

export default function NotesList({ customerId, dealId, taskId }: NotesListProps) {
  const { getToken } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params = new URLSearchParams();
      if (customerId) params.append('customerId', customerId);
      if (dealId) params.append('dealId', dealId);
      if (taskId) params.append('taskId', taskId);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notes?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [customerId, dealId, taskId]);

  const createNote = async () => {
    if (!content.trim()) return;

    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            customerId,
            dealId,
            taskId,
          }),
        }
      );

      if (res.ok) {
        setContent('');
        setShowForm(false);
        fetchNotes();
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const updateNote = async () => {
    if (!editingNote || !content.trim()) return;

    try {
      const token = await getToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notes/${editingNote.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      );

      setEditingNote(null);
      setContent('');
      fetchNotes();
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const token = await getToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notes/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const togglePin = async (note: Note) => {
    try {
      const token = await getToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notes/${note.id}/pin`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchNotes();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const startEdit = (note: Note) => {
    setEditingNote(note);
    setContent(note.content);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setContent('');
    setShowForm(false);
  };

  // Sort notes: pinned first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Note Button or Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note..."
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 mt-3">
            <button
              onClick={cancelEdit}
              className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={editingNote ? updateNote : createNote}
              disabled={!content.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {editingNote ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {sortedNotes.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No notes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotes.map((note) => (
            <div
              key={note.id}
              className={`group relative bg-white dark:bg-neutral-900 border rounded-lg p-4 ${
                note.pinned 
                  ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10' 
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              {/* Pin indicator */}
              {note.pinned && (
                <Pin className="absolute top-2 right-2 w-4 h-4 text-yellow-500" />
              )}

              {/* Content */}
              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap pr-6">
                {note.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-xs text-neutral-400">
                  {new Date(note.createdAt).toLocaleDateString()} at{' '}
                  {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {note.updatedAt !== note.createdAt && ' (edited)'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => togglePin(note)}
                    className="p-1.5 text-neutral-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded"
                    title={note.pinned ? 'Unpin' : 'Pin'}
                  >
                    {note.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEdit(note)}
                    className="p-1.5 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
