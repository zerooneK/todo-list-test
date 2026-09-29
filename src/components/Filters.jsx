import { VIEWS } from '../views'

export default function Filters({ currentView, onViewChange }) {
  return (
    <div className="filters">
      {VIEWS.map(view => {
        // The selected view is stated once, here, and both the interface and
        // the underline read from it. `aria-pressed` is what a person — or a
        // screen reader — actually perceives; the class is only how that
        // reaches the stylesheet.
        const isCurrent = currentView === view.value
        return (
          <button
            key={view.value}
            className={'filter-btn' + (isCurrent ? ' active' : '')}
            aria-pressed={isCurrent}
            onClick={() => onViewChange(view.value)}
          >
            {view.label}
          </button>
        )
      })}
    </div>
  )
}
