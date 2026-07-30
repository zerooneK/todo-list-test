import { useState } from 'react'

export default function TodoInput({ onAdd }) {
  const [text, setText] = useState('')

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setText('')
  }

  return (
    <div className="input-row">
      <input
        id="todo-input"
        type="text"
        placeholder="What needs to be done?"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        autoFocus
      />
      <button id="add-btn" onClick={handleSubmit}>Add</button>
    </div>
  )
}
