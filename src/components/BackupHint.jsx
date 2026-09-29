export default function BackupHint({ show, onDismiss }) {
  if (!show) return null

  return (
    <div className="backup-hint">
      <p className="backup-hint-text">
        It has been a while since you downloaded a backup. A backup is the only
        way your tasks are safe from being cleared.
      </p>
      <button id="backup-hint-dismiss" onClick={onDismiss}>Remind me later</button>
    </div>
  )
}
