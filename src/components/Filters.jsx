const VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Done' },
]

export default function Filters({ currentView, onViewChange }) {
  return (
    <div className="filters">
      {VIEWS.map(view => (
        <button
          key={view.value}
          className={'filter-btn' + (currentView === view.value ? ' active' : '')}
          onClick={() => onViewChange(view.value)}
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}
