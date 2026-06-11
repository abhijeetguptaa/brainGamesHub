import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Notes.scss'; // We will create this file next
import { playTapSound } from '../utils/soundUtils';

const Notes = () => {
  const { t } = useTranslation();

  useEffect(() => {
    import('../utils/analytics').then(({ setScreen }) => {
      setScreen('NotesUtil');
    });
  }, []);

  const [notes, setNotes] = useState(() => {
    const storedNotes = JSON.parse(localStorage.getItem('notes')) || [];
    return storedNotes;
  });
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);

  // Save notes to localStorage whenever the notes state changes
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      if (editingNoteId) {
        // Update existing note
        setNotes(
          notes.map((note) => (note.id === editingNoteId ? { ...note, text: newNote } : note)),
        );
        setEditingNoteId(null);
      } else {
        // Add new note
        setNotes([{ id: Date.now(), text: newNote }, ...notes]);
      }
      playTapSound();
      setNewNote('');
    }
  };

  const handleDeleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setNewNote(note.text);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setNewNote('');
  };

  return (
    <div className="notes-container">
      <h2 className="text-on-blue-BG">{t('notes.title')}</h2>
      <div className="note-input-section">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={t('notes.placeholder')}
          rows="4"
        ></textarea>
        <div className="note-actions">
          <button onClick={handleAddNote}>
            {editingNoteId ? t('notes.saveNote') : t('notes.addNote')}
          </button>
          {editingNoteId && (
            <button onClick={handleCancelEdit} className="cancel-edit-button">
              {t('notes.cancelEdit')}
            </button>
          )}
        </div>
      </div>
      <div className="notes-list">
        {notes.length === 0 ? (
          <p className="text-on-blue-BG">{t('notes.noNotes')}</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="note-item">
              <p>{note.text}</p>
              <div className="note-item-actions">
                <button onClick={() => handleEditNote(note)}>{t('notes.editIcon')}</button>
                <button onClick={() => handleDeleteNote(note.id)}>{t('notes.deleteIcon')}</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notes;
