export default function UndoOffer({ removal, onUndo }) {
  if (!removal) return null

  return (
    <div className="undo-offer" role="status">
      <span className="undo-offer-text">Removed</span>
      <button className="undo-offer-btn" onClick={onUndo}>Undo</button>
    </div>
  )
}
