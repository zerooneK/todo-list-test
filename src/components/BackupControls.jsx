import { useRef, useState } from 'react'

// The backup file is plain, indented JSON so it stays readable to the person
// who opens it in a text editor years from now.
function buildFileContents(tasks) {
  return JSON.stringify(
    {
      app: 'tasks',
      version: 1,
      exported: new Date().toISOString(),
      tasks: tasks.map(t => ({ id: t.id, text: t.text, completed: t.completed })),
    },
    null,
    2
  )
}

// "tasks-2026-09-29.json" — the date lets backups be told apart at a glance.
function fileNameForToday() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `tasks-${now.getFullYear()}-${month}-${day}.json`
}

export default function BackupControls({ tasks, onRestore, onDownloaded }) {
  const fileRef = useRef(null)
  // A file the app has read but not yet acted on, waiting for the person to
  // confirm the consequence.
  const [pending, setPending] = useState(null)
  const [problem, setProblem] = useState(null)

  function downloadBackup() {
    const blob = new Blob([buildFileContents(tasks)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileNameForToday()
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    onDownloaded()
  }

  async function chooseFile(event) {
    const file = event.target.files?.[0]
    // Let the same file be chosen again after a refusal.
    event.target.value = ''
    if (!file) return

    let parsed
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      setPending(null)
      setProblem('That file could not be read, so nothing was changed.')
      return
    }

    const isList = Array.isArray(parsed?.tasks)
    const usable = isList && parsed.tasks.every(
      t => t && typeof t.text === 'string' && typeof t.completed === 'boolean'
    )
    if (!usable) {
      setPending(null)
      setProblem('That file is not a task backup, so nothing was changed.')
      return
    }

    setProblem(null)
    setPending({
      // The ids here are placeholders only. The list is re-identified when the
      // restore is confirmed, so whatever a file carried is never trusted.
      tasks: parsed.tasks.map((t, i) => ({
        id: Number.isFinite(t.id) ? t.id : i,
        text: t.text,
        completed: t.completed,
      })),
      count: parsed.tasks.length,
    })
  }

  function confirmRestore() {
    onRestore(pending.tasks)
    setPending(null)
  }

  function cancelRestore() {
    setPending(null)
  }

  return (
    <div className="backup">
      <button id="download-btn" onClick={downloadBackup}>Download my tasks</button>
      <button id="restore-btn" onClick={() => fileRef.current?.click()}>Restore from a backup</button>
      <input
        ref={fileRef}
        id="restore-input"
        type="file"
        accept="application/json,.json"
        onChange={chooseFile}
        aria-label="Choose a backup file"
      />

      {problem && <p className="backup-problem" role="alert">{problem}</p>}

      {pending && (
        <div className="backup-confirm" role="alertdialog" aria-label="Confirm restore">
          <p className="backup-confirm-text">
            {`This replaces your current list of ${tasks.length} task${tasks.length !== 1 ? 's' : ''} with ${pending.count} from the backup. The current list cannot be recovered afterwards.`}
          </p>
          <div className="backup-confirm-actions">
            <button id="restore-confirm" onClick={confirmRestore}>Replace my list</button>
            <button id="restore-cancel" onClick={cancelRestore}>Keep my current list</button>
          </div>
        </div>
      )}
    </div>
  )
}
