import TaskItem from './TaskItem'

export default function TaskList({ tasks, currentView, onToggle, onDelete, onEdit }) {
  const filtered = tasks.filter(t => {
    if (currentView === 'open') return !t.completed
    if (currentView === 'done') return t.completed
    return true
  })

  if (filtered.length === 0) {
    const msg = currentView === 'done'
      ? 'Nothing done yet.'
      : currentView === 'open' ? 'Nothing left to do.' : 'Nothing here yet.'
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
