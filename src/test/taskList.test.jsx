import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

// Pretend the person's device is set to light or dark, so the app's
// "follow the device" behaviour can be exercised.
function setDeviceTheme(isDark) {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: query.includes('dark') ? isDark : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

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

  it('shows one short calm line when there is nothing to show', () => {
    render(<App />)

    const line = screen.getByText('Nothing here yet.')
    expect(line).toBeInTheDocument()
    // One short line, not a paragraph of instructions.
    expect(line.textContent.trim().split('\n')).toHaveLength(1)
  })

  it('shows a calm line for the open view when everything is done', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('What needs doing?'), 'Buy milk')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Open' }))

    expect(screen.getByText('Nothing left to do.')).toBeInTheDocument()
  })

  it('shows a calm line for the done view when nothing is done yet', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(screen.getByText('Nothing done yet.')).toBeInTheDocument()
  })
})

describe('the theme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('offers a single small toggle', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: /look$/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /look$/ })).toHaveLength(1)
  })

  it('starts in the light look when the device is light', () => {
    setDeviceTheme(false)
    render(<App />)

    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('follows the device when I have never chosen', () => {
    setDeviceTheme(true)
    render(<App />)

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('switches to the dark look when I use the toggle', async () => {
    const user = userEvent.setup()
    setDeviceTheme(false)
    render(<App />)

    await user.click(screen.getByRole('button', { name: /look$/ }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('switches back to the light look', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /look$/ }))
    await user.click(screen.getByRole('button', { name: /look$/ }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('opens in the look I chose last time', () => {
    localStorage.setItem('theme', 'dark')
    setDeviceTheme(false)
    render(<App />)

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('remembers the look I just chose for next time', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /look$/ }))

    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('keeps my tasks and the current view when I switch look', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('What needs doing?'), 'Call the plumber')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('button', { name: /look$/ }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    // Still in the done view, and the task is untouched.
    expect(screen.getByRole('button', { name: 'Done' }).className).toContain('active')
    expect(screen.getByText('1 open task')).toBeInTheDocument()
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