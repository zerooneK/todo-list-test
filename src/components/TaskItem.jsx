import { useState, useRef, useEffect } from 'react'

export default function TaskItem({ task, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function saveEdit() {
    const trimmed = editText.trim()
    if (trimmed) onEdit(task.id, trimmed)
    else onDelete(task.id)
    setEditing(false)
  }

  function cancelEdit() {
    setEditText(task.text)
    setEditing(false)
  }

  return (
    <li className="task-item" data-id={task.id}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        aria-label={`Mark ${task.text} as done`}
      />
      {editing ? (
        <input
          ref={inputRef}
          className="edit-input"
          aria-label={`Edit ${task.text}`}
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') cancelEdit()
          }}
        />
      ) : (
        <span className={'task-text' + (task.completed ? ' completed' : '')}>
          {task.text}
        </span>
      )}
      {/* Renaming is a real button rather than a hidden double-click on the
          text, so it can be seen, reached by keyboard, and named out loud.
          While an edit is open it steps aside: the field is the only thing
          to aim at, and a stray click on the pencil would commit or cancel
          the edit under the person's cursor. */}
      {!editing && (
        <button
          className="rename-btn"
          onClick={() => { setEditText(task.text); setEditing(true) }}
          aria-label={`Rename ${task.text}`}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
            <path
              d="M11.1 1.6l3.3 3.3-8.4 8.4-4.1.8.8-4.1 8.4-8.4z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <button
        className="delete-btn"
        onClick={() => onDelete(task.id)}
        aria-label={`Remove ${task.text}`}
      >&times;</button>
    </li>
  )
}
