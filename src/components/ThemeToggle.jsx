export default function ThemeToggle({ theme, onToggleTheme }) {
  const label = theme === 'dark' ? 'Light' : 'Dark'

  return (
    <button
      id="theme-toggle"
      onClick={onToggleTheme}
      aria-label={`Use the ${label.toLowerCase()} look`}
      title={`Use the ${label.toLowerCase()} look`}
    >
      {label}
    </button>
  )
}
