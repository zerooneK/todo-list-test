import React from 'react'
import { act, render, screen } from '@testing-library/react'
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

describe('removing a task', () => {
  async function addTask(user, text) {
    await user.type(screen.getByPlaceholderText('What needs doing?'), text)
    await user.click(screen.getByRole('button', { name: 'Add' }))
  }

  it('removes a task straight away, with nothing to confirm', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Buy milk')

    await user.click(screen.getByRole('button', { name: 'Remove Buy milk' }))

    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    // No confirmation dialog appeared to get in the way.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows no Undo offer when I have removed nothing', () => {
    render(<App />)

    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })

  it('offers Undo right after I remove a task', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Buy milk')

    await user.click(screen.getByRole('button', { name: 'Remove Buy milk' }))

    expect(screen.getByText('Removed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
  })

  it('brings the task back, in the right place, when I use Undo', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'First')
    await addTask(user, 'Second')
    await addTask(user, 'Third')

    await user.click(screen.getByRole('button', { name: 'Remove Second' }))
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    const shown = screen.getAllByRole('listitem').map(li => li.textContent)
    expect(shown[0]).toContain('First')
    expect(shown[1]).toContain('Second')
    expect(shown[2]).toContain('Third')
  })

  it('brings back a done task still marked as done', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Water the plants')
    await user.click(screen.getByRole('checkbox'))

    await user.click(screen.getByRole('button', { name: 'Remove Water the plants' }))
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('clears the offer on its own after a short while', async () => {
    // Type with real timers, then switch to a clock we can wind forward. The
    // fake clock advances by itself so clicking still behaves.
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Buy milk')

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: 'Remove Buy milk' }))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000)
    })

    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })

  it('never brings the offer back once it has been used', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Buy milk')

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: 'Remove Buy milk' }))
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000)
    })

    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('replaces the first offer with the second instead of stacking them', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'First')
    await addTask(user, 'Second')

    await user.click(screen.getByRole('button', { name: 'Remove First' }))
    await user.click(screen.getByRole('button', { name: 'Remove Second' }))

    // One offer only, and it belongs to the most recent removal.
    expect(screen.getAllByRole('button', { name: 'Undo' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.queryByText('First')).not.toBeInTheDocument()
  })
})

describe('clearing every done task', () => {
  async function addTask(user, text, done = false) {
    await user.type(screen.getByPlaceholderText('What needs doing?'), text)
    await user.click(screen.getByRole('button', { name: 'Add' }))
    if (done) await user.click(screen.getByRole('checkbox', { name: `Mark ${text} as done` }))
  }

  async function sweep(user) {
    await user.click(screen.getByRole('button', { name: 'Clear done' }))
  }

  function shownTasks() {
    return screen.getAllByRole('listitem').map(li => li.textContent)
  }

  it('sweeps away every done task and leaves the open ones', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Still to do')
    await addTask(user, 'Finished one', true)
    await addTask(user, 'Finished two', true)

    await sweep(user)

    const shown = shownTasks()
    expect(shownTasks()).toHaveLength(1)
    expect(shown[0]).toContain('Still to do')
  })

  it('offers Undo after the sweep, just as after one removal', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Finished one', true)

    await sweep(user)

    expect(screen.getByText('Removed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
  })

  it('brings every swept task back in one go', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Open one')
    await addTask(user, 'Finished one', true)
    await addTask(user, 'Open two')
    await addTask(user, 'Finished two', true)

    await sweep(user)
    expect(shownTasks()).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Undo' }))

    const shown = shownTasks()
    expect(shown).toHaveLength(4)
    expect(shown[0]).toContain('Open one')
    expect(shown[1]).toContain('Finished one')
    expect(shown[2]).toContain('Open two')
    expect(shown[3]).toContain('Finished two')
  })

  it('brings the swept tasks back still marked as done', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Finished one', true)
    await addTask(user, 'Finished two', true)

    await sweep(user)
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    // Both are back and both are still ticked, not reset to open.
    expect(screen.getByRole('checkbox', { name: 'Mark Finished one as done' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Mark Finished two as done' })).toBeChecked()
  })

  it('leaves open tasks exactly as they were through the sweep and the undo', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Open one')
    await addTask(user, 'Finished one', true)

    await sweep(user)
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(screen.getByRole('checkbox', { name: 'Mark Open one as done' })).not.toBeChecked()
    expect(screen.getByText('1 open task')).toBeInTheDocument()
  })

  it('clears the sweep offer on its own, like any other', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Finished one', true)

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await sweep(user)
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000)
    })

    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })

  it('replaces a single removal offer with the sweep offer, not stacking', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'To remove one at a time')
    await addTask(user, 'Finished one', true)

    await user.click(screen.getByRole('button', { name: 'Remove To remove one at a time' }))
    await sweep(user)

    expect(screen.getAllByRole('button', { name: 'Undo' })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    // The sweep was undone, not the earlier single removal.
    expect(screen.getByText('Finished one')).toBeInTheDocument()
    expect(screen.queryByText('To remove one at a time')).not.toBeInTheDocument()
  })

  it('does not offer a second Undo once the sweep has been undone', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Finished one', true)
    await sweep(user)

    await user.click(screen.getByRole('button', { name: 'Undo' }))

    // The offer is spent; the task is back and no further Undo remains.
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    expect(screen.getByText('Finished one')).toBeInTheDocument()
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