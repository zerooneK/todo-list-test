import { useState, useRef, useEffect } from 'react'

export default function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function saveEdit() {
    const trimmed = editText.trim()
    if (trimmed) onEdit(todo.id, trimmed)
    else onDelete(todo.id)
    setEditing(false)
  }

  function cancelEdit() {
    setEditText(todo.text)
    setEditing(false)
  }

  return (
    <li className="todo-item" data-id={todo.id}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
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
          className={'todo-text' + (todo.completed ? ' completed' : '')}
          onDoubleClick={() => { setEditText(todo.text); setEditing(true) }}
        >
          {todo.text}
        </span>
      )}
      <button className="delete-btn" onClick={() => onDelete(todo.id)}>&times;</button>
    </li>
  )
}
