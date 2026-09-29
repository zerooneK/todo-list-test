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
      />
      {editing ? (
        <input
          ref={inputRef}
          className="edit-input"
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') cancelEdit()
          }}
        />
      ) : (
        <span
          className={'task-text' + (task.completed ? ' completed' : '')}
          onDoubleClick={() => { setEditText(task.text); setEditing(true) }}
        >
          {task.text}
        </span>
      )}
      <button
        className="delete-btn"
        onClick={() => onDelete(task.id)}
        aria-label={`Remove ${task.text}`}
      >&times;</button>
    </li>
  )
}
