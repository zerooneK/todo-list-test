import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('the task list', () => {
  it('shows a task I typed', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('What needs doing?'), 'Buy milk')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('shows a task as done once I tick it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('What needs doing?'), 'Buy milk')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await user.click(screen.getByRole('checkbox'))

    // The person sees two things change: the box is ticked, and the count
    // drops. Both are asserted here. jsdom cannot resolve the stylesheet
    // cascade, so the strikethrough is deliberately not asserted.
    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.getByText('0 open tasks')).toBeInTheDocument()
  })

  it('offers the three views in plain language', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })
})

describe('coming back to a task list saved before the rename', () => {
  it('still shows the tasks I had before', () => {
    // Seed the data the way the previous version of the app saved it, so
    // this is a person returning to the app after the rename.
    localStorage.setItem('todos', JSON.stringify([
      { id: 1, text: 'Call the dentist', completed: false },
      { id: 2, text: 'Water the plants', completed: true },
    ]))

    render(<App />)

    expect(screen.getByText('Call the dentist')).toBeInTheDocument()
    expect(screen.getByText('Water the plants')).toBeInTheDocument()
  })

  it('does not show the same task twice after the move', () => {
    localStorage.setItem('todos', JSON.stringify([
      { id: 1, text: 'Call the dentist', completed: false },
    ]))

    render(<App />)

    expect(screen.getAllByText('Call the dentist')).toHaveLength(1)
  })

  it('keeps the old saved data readable as a fallback', () => {
    localStorage.setItem('todos', JSON.stringify([
      { id: 1, text: 'Call the dentist', completed: false },
    ]))

    render(<App />)

    // The old data is deliberately never deleted, so nothing is lost even
    // if the move to the new name goes wrong.
    expect(JSON.parse(localStorage.getItem('todos'))).toHaveLength(1)
  })

  it('reads the new saved data in preference to the old', () => {
    localStorage.setItem('tasks', JSON.stringify([
      { id: 9, text: 'A newer task', completed: false },
    ]))
    localStorage.setItem('todos', JSON.stringify([
      { id: 1, text: 'An older task', completed: false },
    ]))

    render(<App />)

    expect(screen.getByText('A newer task')).toBeInTheDocument()
    expect(screen.queryByText('An older task')).not.toBeInTheDocument()
  })
})