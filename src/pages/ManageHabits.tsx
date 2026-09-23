import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Habit } from '../types';

const COMMON_ICONS = [
  '🧘', '💻', '💧', '🏋️', '📚', '🏃', '🧠', '🗣️', '😴',
  '🎸', '✍️', '🧘‍♂️', '🥗', '🌿', '📝', '🎯', '🧩', '💪',
  '🎨', '🌅', '🚴', '🥤', '🍎', '🌙', '☀️', '🧪', '📖'
];

interface HabitFormData {
  name: string;
  icon: string;
}

interface HabitFormProps {
  initial?: HabitFormData;
  onSave: (data: HabitFormData) => void;
  onCancel: () => void;
  title: string;
}

function HabitForm({ initial, onSave, onCancel, title }: HabitFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '✨');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{title}</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label htmlFor="habit-name-input">Habit Name</label>
            <input
              id="habit-name-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Morning Run"
              autoFocus
              maxLength={40}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Icon</label>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowIconPicker(p => !p)}
              style={{ justifyContent: 'flex-start', gap: 10 }}
              id="habit-icon-picker-btn"
            >
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span>Choose icon</span>
            </button>

            {showIconPicker && (
              <div className="icon-grid" style={{ marginTop: 8 }}>
                {COMMON_ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    className={`icon-option ${ic === icon ? 'selected' : ''}`}
                    onClick={() => { setIcon(ic); setShowIconPicker(false); }}
                    aria-label={`Select icon ${ic}`}
                    aria-pressed={ic === icon}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={onCancel}
              id="habit-form-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={!name.trim()}
              id="habit-form-save"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ManageHabitsProps {
  onBack: () => void;
}

export default function ManageHabits({ onBack }: ManageHabitsProps) {
  const { habits, addHabit, updateHabit, removeHabit, reorderHabits } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleAdd = async (data: HabitFormData) => {
    await addHabit({ name: data.name, icon: data.icon, active: true });
    setShowAddForm(false);
  };

  const handleEdit = async (data: HabitFormData) => {
    if (!editingHabit) return;
    await updateHabit({ ...editingHabit, name: data.name, icon: data.icon });
    setEditingHabit(null);
  };

  const handleToggleActive = async (habit: Habit) => {
    await updateHabit({ ...habit, active: !habit.active });
  };

  const handleDelete = async (id: string) => {
    await removeHabit(id);
    setConfirmDelete(null);
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const newHabits = [...habits];
    const temp = newHabits[index];
    newHabits[index] = newHabits[index - 1];
    newHabits[index - 1] = temp;
    await reorderHabits(newHabits.map(h => h.id));
  };

  const handleMoveDown = async (index: number) => {
    if (index >= habits.length - 1) return;
    const newHabits = [...habits];
    const temp = newHabits[index];
    newHabits[index] = newHabits[index + 1];
    newHabits[index + 1] = temp;
    await reorderHabits(newHabits.map(h => h.id));
  };

  return (
    <>
      <div className="page-content">
        <div className="page-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 8px' }}>
            <button className="back-btn" onClick={onBack} id="manage-back-btn">
              ‹ Back
            </button>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Manage Habits</h1>

          {habits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌱</div>
              <div className="empty-state-title">No habits yet</div>
              <p className="empty-state-text">Add your first habit below.</p>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {habits.map((habit, index) => (
                <div
                  key={habit.id}
                  className={`manage-habit-row ${!habit.active ? 'manage-habit-inactive' : ''}`}
                >
                  <div className="manage-habit-icon-name">
                    <span className="manage-habit-icon">{habit.icon}</span>
                    <div>
                      <div className="manage-habit-name">{habit.name}</div>
                      {!habit.active && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Inactive</div>
                      )}
                    </div>
                  </div>

                  <div className="manage-habit-actions">
                    <button
                      className="icon-btn"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      aria-label={`Move ${habit.name} up`}
                      title="Move Up"
                      style={{ opacity: index === 0 ? 0.25 : 1 }}
                      id={`move-up-habit-${habit.id}`}
                    >
                      ⬆️
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === habits.length - 1}
                      aria-label={`Move ${habit.name} down`}
                      title="Move Down"
                      style={{ opacity: index === habits.length - 1 ? 0.25 : 1 }}
                      id={`move-down-habit-${habit.id}`}
                    >
                      ⬇️
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => setEditingHabit(habit)}
                      aria-label={`Edit ${habit.name}`}
                      title="Edit"
                      id={`edit-habit-${habit.id}`}
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => handleToggleActive(habit)}
                      aria-label={habit.active ? `Deactivate ${habit.name}` : `Activate ${habit.name}`}
                      title={habit.active ? 'Deactivate' : 'Activate'}
                      id={`toggle-habit-${habit.id}`}
                    >
                      {habit.active ? '⏸️' : '▶️'}
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => setConfirmDelete(habit.id)}
                      aria-label={`Delete ${habit.name}`}
                      title="Delete"
                      id={`delete-habit-${habit.id}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn btn-primary btn-full"
            onClick={() => setShowAddForm(true)}
            id="add-habit-btn"
          >
            + Add Habit
          </button>

          <div style={{ height: 16 }} />
        </div>
      </div>

      {showAddForm && (
        <HabitForm
          title="New Habit"
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingHabit && (
        <HabitForm
          title="Edit Habit"
          initial={{ name: editingHabit.name, icon: editingHabit.icon }}
          onSave={handleEdit}
          onCancel={() => setEditingHabit(null)}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Delete Habit?</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
              This will permanently delete the habit and all its completion history. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => setConfirmDelete(null)}
                id="delete-cancel-btn"
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-full"
                onClick={() => handleDelete(confirmDelete)}
                id="delete-confirm-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
