// The offer, in the app's own plain voice: what was removed, and — only when it
// is true — what can no longer be put back.
//
// It used to say only "Removed", which described none of the cases it actually
// covered: a sweep of fourteen read exactly like a removal of one, and a second
// removal silently ended the first one's undo without a word. This says what is
// actually held, and admits the loss when there is one. Nothing here scolds or
// explains itself at length; it states the fact and gets out of the way.
function describeRemoval({ removed, displaced }) {
  const count = removed.length
  const removedText = `${count} task${count === 1 ? '' : 's'} removed`

  if (displaced === 0) return removedText

  return `${removedText}. ${displaced} earlier task${displaced === 1 ? '' : 's'} can no longer be undone`
}

export default function UndoOffer({ removal, onUndo }) {
  // The live region is always in the page, even when there is nothing to say.
  // A region that is inserted together with its first words is commonly missed
  // by screen readers; an empty one that then fills is what they announce. It
  // is the same reason the region stays put between removals, so the second
  // message is announced as a change rather than a new arrival.
  return (
    <div className="undo-offer" role="status">
      {removal && (
        <>
          <span className="undo-offer-text">{describeRemoval(removal)}</span>
          <button className="undo-offer-btn" onClick={onUndo}>Undo</button>
        </>
      )}
    </div>
  )
}
