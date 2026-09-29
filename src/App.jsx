import { useState, useEffect } from 'react'
import TaskInput from './components/TaskInput'
import Filters from './components/Filters'
import TaskList from './components/TaskList'
import TaskFooter from './components/TaskFooter'
import ThemeToggle from './components/ThemeToggle'
import UndoOffer from './components/UndoOffer'
import BackupControls from './components/BackupControls'
import BackupHint from './components/BackupHint'
import PrivateWindowWarning from './components/PrivateWindowWarning'
import {
  detectStorage,
  readJson,
  readNumber,
  writeJson,
  writeNumber,
} from './storage'
import './App.css'

// The task list is saved under the newer name. The older name is still read
// as a fallback, and is never deleted, so a person's tasks survive even if
// the move to the new name does not happen.
const STORAGE_KEY = 'tasks'
const LEGACY_STORAGE_KEY = 'todos'
const THEME_KEY = 'theme'
const LAST_BACKUP_KEY = 'lastBackup'
// The moment the person dismissed the hint, so it does not come back.
const HINT_DISMISSED_KEY = 'backupHintDismissed'
// How long the Undo offer stays before it clears itself.
const UNDO_TIMEOUT_MS = 5000
// A quiet nudge after this long without a download.
const BACKUP_INTERVAL_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

// Read a stored timestamp, or null when it is absent or unreadable.
function readStamp(key) {
  const value = Number(readNumber(key))
  return Number.isFinite(value) && value > 0 ? value : null
}

function readTasks() {
  const stored = readJson(STORAGE_KEY, null)
  if (Array.isArray(stored)) return stored

  // The older name is still read as a fallback, so a list saved before the
  // rename survives.
  const legacy = readJson(LEGACY_STORAGE_KEY, null)
  if (Array.isArray(legacy)) return legacy

  return []
}

function readTheme() {
  const stored = readNumber(THEME_KEY)
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
  // When a backup was last downloaded, and when the hint was last dismissed.
  // The hint is derived from these timestamps rather than counted, so an app
  // left unused for a long time never piles up reminders.
  const [lastBackup, setLastBackup] = useState(() => readStamp(LAST_BACKUP_KEY))
  const [hintDismissed, setHintDismissed] = useState(() => readStamp(HINT_DISMISSED_KEY))
  // A private window throws its data away when closed, so tasks added there
  // are lost silently. Where that can be detected, say so rather than let it
  // be discovered the hard way.
  // Detected once on load. A private window is not something that changes
  // while the app is open, so this never needs to be recalculated.
  const [storageState] = useState(detectStorage)

  // Shown when it has been a week or more since the last download, unless the
  // person has dismissed it since then. Never downloaded at all counts as due:
  // the list has never been backed up.
  const daysSinceBackup = lastBackup === null
    ? Infinity
    : (Date.now() - lastBackup) / DAY_MS
  // A dismissal only counts until the next download; acting on the hint by
  // backing up brings the reminder back for the next cycle, not before.
  const dismissedSinceLastBackup = hintDismissed !== null
    && (lastBackup === null || hintDismissed > lastBackup)
  const hintShouldShow = daysSinceBackup >= BACKUP_INTERVAL_DAYS
    && !dismissedSinceLastBackup

  // Saving is best-effort: if the browser refuses to store anything, the app
  // still works for this session rather than falling over.
  useEffect(() => {
    writeJson(STORAGE_KEY, tasks)
  }, [tasks])

  // The offer clears itself; the person never has to dismiss it.
  useEffect(() => {
    if (!removal) return
    const timer = setTimeout(() => setRemoval(null), UNDO_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [removal])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    writeNumber(THEME_KEY, theme)
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

  // Downloading is acting on the hint, so it records the moment and the hint
  // goes quiet on its own.
  function recordBackup() {
    const now = Date.now()
    setLastBackup(now)
    writeNumber(LAST_BACKUP_KEY, now)
  }

  // Dismissed is remembered, so returning to the app stays calm.
  function dismissHint() {
    const now = Date.now()
    setHintDismissed(now)
    writeNumber(HINT_DISMISSED_KEY, now)
  }

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
      <PrivateWindowWarning storageState={storageState} />
      <BackupHint show={hintShouldShow} onDismiss={dismissHint} />
      <BackupControls
        tasks={tasks}
        onRestore={restoreTasks}
        onDownloaded={recordBackup}
      />
      <UndoOffer removal={removal} onUndo={undoRemoval} />
    </div>
  )
}
