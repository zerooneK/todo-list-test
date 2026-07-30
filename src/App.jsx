import { useState, useEffect } from 'react'
import TodoInput from './components/TodoInput'
import Filters from './components/Filters'
import TodoList from './components/TodoList'
import TodoFooter from './components/TodoFooter'
import './App.css'

export default function App() {
  const [todos, setTodos] = useState(() => {
    const stored = localStorage.getItem('todos')
    return stored ? JSON.parse(stored) : []
  })
  const [currentFilter, setCurrentFilter] = useState('all')

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  function addTodo(text) {
    setTodos(prev => [
      ...prev,
      { id: Date.now(), text, completed: false },
    ])
  }

  function toggleTodo(id) {
    setTodos(prev =>
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    )
  }

  function deleteTodo(id) {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  function editTodo(id, text) {
    setTodos(prev =>
      prev.map(t => t.id === id ? { ...t, text } : t)
    )
  }

  function clearCompleted() {
    setTodos(prev => prev.filter(t => !t.completed))
  }

  return (
    <div className="container">
      <h1>todos</h1>
      <TodoInput onAdd={addTodo} />
      <Filters currentFilter={currentFilter} onFilterChange={setCurrentFilter} />
      <TodoList
        todos={todos}
        currentFilter={currentFilter}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
        onEdit={editTodo}
      />
      <TodoFooter todos={todos} onClear={clearCompleted} />
    </div>
  )
}
