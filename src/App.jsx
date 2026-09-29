import { useState, useEffect } from 'react'
import TaskInput from './components/TaskInput'
import Filters from './components/Filters'
import TaskList from './components/TaskList'
import TaskFooter from './components/TaskFooter'
import ThemeToggle from './components/ThemeToggle'
import './App.css'

// The task list is saved under the newer name. The older name is still read
// as a fallback, and is never deleted, so a person's tasks survive even if
// the move to the new name does not happen.
const STORAGE_KEY = 'tasks'
const LEGACY_STORAGE_KEY = 'todos'
const THEME_KEY = 'theme'

function readTasks() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return JSON.parse(stored)

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (legacy) return JSON.parse(legacy)

  return []
}

function readTheme() {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored

  // No choice yet, so follow the device.
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export default function App() {
  const [tasks, setTasks] = useState(readTasks)
  const [currentView, setCurrentView] = useState('all')
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  function addTask(text) {
    setTasks(prev => [
      ...prev,
      { id: Date.now(), text, completed: false },
    ])
  }

  function toggleTask(id) {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    )
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function editTask(id, text) {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, text } : t)
    )
  }

  function clearDone() {
    setTasks(prev => prev.filter(t => !t.completed))
  }

  return (
    <div className="container">
      <div className="top-row">
        <h1>tasks</h1>
        <ThemeToggle theme={theme} onToggleTheme={toggleTheme} />
      </div>
      <TaskInput onAdd={addTask} />
      <Filters currentView={currentView} onViewChange={setCurrentView} />
      <TaskList
        tasks={tasks}
        currentView={currentView}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onEdit={editTask}
      />
      <TaskFooter tasks={tasks} onClearDone={clearDone} />
    </div>
  )
}
