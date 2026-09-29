// The reminder is a live region for the same reason the undo offer is: a
// region that is inserted into the page together with its first words is
// commonly missed by screen readers, so the region stays put and fills. That
// way the reminder is announced when it arrives, and again when it changes
// after being dismissed and later coming due.
//
// Announced is not a substitute for shown. The line is on the page as well,
// because most of the time the person is looking right at it.
export default function BackupHint({ show, onDismiss }) {
  return (
    <div className="backup-hint" role="status">
      {show && (
        <>
          <p className="backup-hint-text">
            It has been a while since you downloaded a backup. A backup is the
            only way your tasks are safe from being cleared.
          </p>
          <button id="backup-hint-dismiss" onClick={onDismiss}>Remind me later</button>
        </>
      )}
    </div>
  )
}
