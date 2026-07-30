export default function TodoFooter({ todos, onClear }) {
  const activeCount = todos.filter(t => !t.completed).length
  const hasCompleted = todos.some(t => t.completed)

  return (
    <div className="footer">
      <span id="item-count">{activeCount} item{activeCount !== 1 ? 's' : ''} left</span>
      <button
        id="clear-btn"
        className={hasCompleted ? '' : 'hidden'}
        onClick={onClear}
      >
        Clear completed
      </button>
    </div>
  )
}
