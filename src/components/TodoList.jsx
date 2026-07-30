import TodoItem from './TodoItem'

export default function TodoList({ todos, currentFilter, onToggle, onDelete, onEdit }) {
  const filtered = todos.filter(t => {
    if (currentFilter === 'active') return !t.completed
    if (currentFilter === 'completed') return t.completed
    return true
  })

  if (filtered.length === 0) {
    const msg = currentFilter === 'completed' ? 'No completed todos.' : 'No todos yet. Add one above!'
    return <p className="empty-msg">{msg}</p>
  }

  return (
    <ul id="todo-list">
      {filtered.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </ul>
  )
}
