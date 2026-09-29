export default function TaskFooter({ tasks, onClearDone }) {
  const openCount = tasks.filter(t => !t.completed).length
  const hasDone = tasks.some(t => t.completed)

  return (
    <div className="footer">
      <span id="item-count">
        {openCount} open task{openCount !== 1 ? 's' : ''}
      </span>
      <button
        id="clear-btn"
        className={hasDone ? '' : 'hidden'}
        onClick={onClearDone}
      >
        Clear done
      </button>
    </div>
  )
}
