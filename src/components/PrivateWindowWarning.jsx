import { STORAGE } from '../storage'

// Quiet and factual, like everything else here. It is a notice, not an alarm:
// it says what will happen and what to do instead, without shouting.
export default function PrivateWindowWarning({ storageState }) {
  if (storageState !== STORAGE.PRIVATE) return null

  return (
    <div className="private-warning" role="status">
      <p className="private-warning-text">
        This is a private window, so tasks you add here will not be saved. They
        are lost when this window is closed. Open the app in an ordinary window
        instead, or download a backup before you close this one.
      </p>
    </div>
  )
}
