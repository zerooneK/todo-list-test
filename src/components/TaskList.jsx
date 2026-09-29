import TaskItem from './TaskItem'

export default function TaskList({ tasks, currentView, onToggle, onDelete, onEdit }) {
  const filtered = tasks.filter(t => {
    if (currentView === 'open') return !t.completed
    if (currentView === 'done') return t.completed
    return true
  })

  if (filtered.length === 0) {
    const msg = currentView === 'done'
      ? 'No done tasks yet.'
      : currentView === 'open' ? 'No open tasks. Enjoy the quiet.' : 'No tasks yet. Add one above!'
    return <p className="empty-msg">{msg}</p>
  }

  return (
    <ul id="task-list">
      {filtered.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </ul>
  )
}
