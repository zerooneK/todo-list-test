import { useState, useEffect } from 'react'
import TaskInput from './components/TaskInput'
import Filters from './components/Filters'
import TaskList from './components/TaskList'
import TaskFooter from './components/TaskFooter'
import ThemeToggle from './components/ThemeToggle'
import UndoOffer from './components/UndoOffer'
import BackupControls from './components/BackupControls'
import './App.css'

// The task list is saved under the newer name. The older name is still read
// as a fallback, and is never deleted, so a person's tasks survive even if
// the move to the new name does not happen.
const STORAGE_KEY = 'tasks'
const LEGACY_STORAGE_KEY = 'todos'
const THEME_KEY = 'theme'
// How long the Undo offer stays before it clears itself.
const UNDO_TIMEOUT_MS = 5000

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
  // At most one removal is held at a time, so a second removal replaces the
  // first rather than stacking a second offer. A removal may be a single task
  // or a whole sweep, so it holds a list. Null means no offer is shown.
  const [removal, setRemoval] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  // The offer clears itself; the person never has to dismiss it.
  useEffect(() => {
    if (!removal) return
    const timer = setTimeout(() => setRemoval(null), UNDO_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [removal])

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
    setTasks(prev => {
      const index = prev.findIndex(t => t.id === id)
      if (index === -1) return prev

      // Hold the task and where it sat, so Undo puts it back exactly as it was.
      setRemoval({ removed: [{ task: prev[index], index }] })
      return prev.filter(t => t.id !== id)
    })
  }

  function clearDone() {
    setTasks(prev => {
      // Hold every done task and where each one sat, so the whole sweep can
      // be put back in one action. Open tasks are never touched.
      const removed = []
      prev.forEach((task, index) => {
        if (task.completed) removed.push({ task, index })
      })
      if (removed.length === 0) return prev

      setRemoval({ removed })
      return prev.filter(t => !t.completed)
    })
  }

  function undoRemoval() {
    setTasks(prev => {
      if (!removal) return prev
      const restored = [...prev]
      // Put each task back at the position it came from, in order, so the
      // list reads exactly as it did before the removal.
      for (const { task, index } of removal.removed) {
        restored.splice(index, 0, task)
      }
      return restored
    })
    // The offer is used up and never comes back.
    setRemoval(null)
  }

  function editTask(id, text) {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, text } : t)
    )
  }

  // The weekly backup hint is a later ticket; the download is recorded now so
  // the wiring is in one place.
  function recordBackup() {}

  function restoreTasks(restored) {
    setTasks(restored)
    // A restore is a deliberate replacement, not a removal, so no Undo is
    // offered for it. The person was told the consequence first.
    setRemoval(null)
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
      <BackupControls
        tasks={tasks}
        onRestore={restoreTasks}
        onDownloaded={recordBackup}
      />
      <UndoOffer removal={removal} onUndo={undoRemoval} />
    </div>
  )
}
