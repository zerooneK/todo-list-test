import TaskItem from './TaskItem'
import { tasksIn, viewFor } from '../views'

export default function TaskList({ tasks, currentView, onToggle, onDelete, onEdit }) {
  // What this view shows, and what it says when it shows nothing, both come
  // from the view itself. Neither is decided here.
  const view = viewFor(currentView)
  const shown = tasksIn(tasks, currentView)

  if (shown.length === 0) {
    return <p className="empty-msg">{view.whenEmpty}</p>
  }

  return (
    <ul id="task-list">
      {shown.map(task => (
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
