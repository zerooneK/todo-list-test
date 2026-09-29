export default function TaskFooter({ tasks, onClearDone }) {
  const openCount = tasks.filter(t => !t.completed).length
  // Sweeping away done tasks is only offered when there is something to sweep.
  // Whether the offer is made at all is a fact about the task list, so the
  // button is simply not rendered when there is nothing to do — rather than
  // being rendered and hidden, which would leave it focusable and clickable
  // for anyone the stylesheet does not reach.
  const hasDone = tasks.some(t => t.completed)

  return (
    <div className="footer">
      <span id="item-count">
        {openCount} open task{openCount !== 1 ? 's' : ''}
      </span>
      {hasDone && (
        <button id="clear-btn" onClick={onClearDone}>
          Clear done
        </button>
      )}
    </div>
  )
}
