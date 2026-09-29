import React from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

describe('backing up and restoring', () => {
  // Capture what the download would have written, without touching a real disk.
  let captured
  let originalCreate

  beforeEach(() => {
    captured = { blobs: [], name: null }
    originalCreate = URL.createObjectURL
    URL.createObjectURL = vi.fn(blob => {
      captured.blobs.push(blob)
      return 'blob:mock'
    })
    URL.revokeObjectURL = vi.fn()
    // Record the file name the app asks the browser to use.
    const realClick = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function patched() {
      if (this.download) captured.name = this.download
      else realClick.call(this)
    }
  })

  afterEach(() => {
    URL.createObjectURL = originalCreate
  })

  async function addTask(user, text, done = false) {
    await user.type(screen.getByPlaceholderText('What needs doing?'), text)
    await user.click(screen.getByRole('button', { name: 'Add' }))
    if (done) await user.click(screen.getByRole('checkbox', { name: `Mark ${text} as done` }))
  }

  async function downloadBackup(user) {
    await user.click(screen.getByRole('button', { name: 'Download my tasks' }))
    return captured.blobs[captured.blobs.length - 1].text()
  }

  function backupFile(contents, name = 'tasks-2026-01-01.json') {
    return new File([contents], name, { type: 'application/json' })
  }

  function backupWith(tasks) {
    return backupFile(JSON.stringify({ app: 'tasks', version: 1, tasks }))
  }

  it('saves my whole task list to the computer', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Call the dentist')
    await addTask(user, 'Water the plants', true)

    const contents = await downloadBackup(user)

    expect(captured.blobs).toHaveLength(1)
    expect(contents).toContain('Call the dentist')
    expect(contents).toContain('Water the plants')
  })

  it('names the file with today\u2019s date so backups can be told apart', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Anything')

    await downloadBackup(user)

    const now = new Date()
    const expected = `tasks-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`
    expect(captured.name).toBe(expected)
  })

  it('writes the backup in a plain, readable form', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Call the dentist')

    const contents = await downloadBackup(user)

    // Indented, with the words in it, not a single unreadable line.
    expect(contents).toContain('"tasks"')
    expect(contents).toContain('"text": "Call the dentist"')
    expect(contents).toContain('"completed": false')
  })

  it('restores a downloaded backup, once I say so', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Something current')

    await user.upload(screen.getByLabelText('Choose a backup file'), backupWith([
      { id: 1, text: 'Recovered one', completed: false },
      { id: 2, text: 'Recovered two', completed: true },
    ]))
    await user.click(screen.getByRole('button', { name: 'Replace my list' }))

    expect(screen.getByText('Recovered one')).toBeInTheDocument()
    expect(screen.getByText('Recovered two')).toBeInTheDocument()
    expect(screen.queryByText('Something current')).not.toBeInTheDocument()
  })

  it('tells me plainly what will happen before I lose anything', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Something current')
    await addTask(user, 'Another current')

    await user.upload(
      screen.getByLabelText('Choose a backup file'),
      backupWith([{ id: 1, text: 'Recovered one', completed: false }])
    )

    // The consequence is stated in words, and nothing is gone yet.
    const statement = screen.getByRole('alertdialog')
    expect(statement).toHaveTextContent('replaces your current list of 2 tasks with 1')
    expect(statement).toHaveTextContent('cannot be recovered')
    expect(screen.getByText('Something current')).toBeInTheDocument()
  })

  it('keeps my current list if I say no', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Something current')

    await user.upload(
      screen.getByLabelText('Choose a backup file'),
      backupWith([{ id: 1, text: 'Recovered one', completed: false }])
    )
    await user.click(screen.getByRole('button', { name: 'Keep my current list' }))

    expect(screen.getByText('Something current')).toBeInTheDocument()
    expect(screen.queryByText('Recovered one')).not.toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('brings back done tasks still marked as done', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.upload(
      screen.getByLabelText('Choose a backup file'),
      backupWith([{ id: 1, text: 'Already done', completed: true }])
    )
    await user.click(screen.getByRole('button', { name: 'Replace my list' }))

    expect(screen.getByRole('checkbox', { name: 'Mark Already done as done' })).toBeChecked()
  })

  it('round trips: what I download, I can restore', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Kept one')
    await addTask(user, 'Kept two', true)

    const contents = await downloadBackup(user)

    // Wipe the list, as clearing browser data would.
    await user.click(screen.getByRole('button', { name: 'Remove Kept one' }))
    await user.click(screen.getByRole('button', { name: 'Remove Kept two' }))
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()

    await user.upload(screen.getByLabelText('Choose a backup file'), backupFile(contents))
    await user.click(screen.getByRole('button', { name: 'Replace my list' }))

    expect(screen.getByText('Kept one')).toBeInTheDocument()
    expect(screen.getByText('Kept two')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Mark Kept two as done' })).toBeChecked()
  })

  it('refuses a file it cannot read, and changes nothing', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Something current')

    await user.upload(
      screen.getByLabelText('Choose a backup file'),
      backupFile('this is not a backup {{{')
    )

    expect(screen.getByRole('alert')).toHaveTextContent('could not be read')
    expect(screen.getByText('Something current')).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('refuses a file that is not a task backup, and changes nothing', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Something current')

    await user.upload(
      screen.getByLabelText('Choose a backup file'),
      backupFile(JSON.stringify({ notes: 'shopping list' }))
    )

    expect(screen.getByRole('alert')).toHaveTextContent('not a task backup')
    expect(screen.getByText('Something current')).toBeInTheDocument()
  })

  it('refuses a file whose tasks are the wrong shape', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Something current')

    await user.upload(
      screen.getByLabelText('Choose a backup file'),
      backupWith([{ text: 'No done flag' }])
    )

    expect(screen.getByRole('alert')).toHaveTextContent('not a task backup')
    expect(screen.getByText('Something current')).toBeInTheDocument()
  })

  it('leaves my view and theme undisturbed', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addTask(user, 'Kept one', true)
    await user.click(screen.getByRole('button', { name: /look$/ }))
    await user.click(screen.getByRole('button', { name: 'Done' }))

    await user.upload(
      screen.getByLabelText('Choose a backup file'),
      backupWith([{ id: 1, text: 'Recovered', completed: true }])
    )
    await user.click(screen.getByRole('button', { name: 'Replace my list' }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByText('Recovered')).toBeInTheDocument()
  })
})

describe('the private window warning', () => {
  const warning = () => screen.queryByText(/This is a private window/)

  // Some private windows refuse every write. Make the real thing behave that
  // way rather than asserting on internals.
  function breakStorageWrites() {
    const realSet = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new DOMException('QuotaExceededError')
    }
    return () => { Storage.prototype.setItem = realSet }
  }

  let restoreWrites = () => {}

  afterEach(() => {
    restoreWrites()
    restoreWrites = () => {}
  })

  it('warns me when the window will not save tasks', () => {
    restoreWrites = breakStorageWrites()

    render(<App />)

    expect(warning()).toBeInTheDocument()
  })

  it('says plainly that tasks will not be saved here', () => {
    restoreWrites = breakStorageWrites()

    render(<App />)

    expect(warning()).toHaveTextContent('will not be saved')
    expect(warning()).toHaveTextContent('lost when this window is closed')
  })

  it('points me at what to do instead', () => {
    restoreWrites = breakStorageWrites()

    render(<App />)

    expect(warning()).toHaveTextContent('ordinary window')
    expect(warning()).toHaveTextContent('download a backup')
  })

  it('still works in a private window, rather than failing', async () => {
    restoreWrites = breakStorageWrites()
    const user = userEvent.setup()

    render(<App />)

    await user.type(screen.getByPlaceholderText('What needs doing?'), 'Written in private{Enter}')
    await user.click(screen.getByRole('checkbox', { name: 'Mark Written in private as done' }))
    await user.click(screen.getByRole('button', { name: 'All' }))

    expect(screen.getByText('Written in private')).toBeInTheDocument()
  })

  it('does not get in the way of the rest of the app', async () => {
    restoreWrites = breakStorageWrites()
    const user = userEvent.setup()

    render(<App />)
    await user.type(screen.getByPlaceholderText('What needs doing?'), 'Still usable{Enter}')

    expect(screen.getByText('Still usable')).toBeInTheDocument()
    expect(warning()).toBeInTheDocument()
  })

  it('still lets me take a backup from a private window', async () => {
    restoreWrites = breakStorageWrites()
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByPlaceholderText('What needs doing?'), 'Worth keeping{Enter}')

    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
    const blobs = []
    const realCreate = URL.createObjectURL
    URL.createObjectURL = vi.fn(blob => { blobs.push(blob); return realCreate(blob) })

    await user.click(screen.getByRole('button', { name: 'Download my tasks' }))

    expect(await blobs[0].text()).toContain('Worth keeping')
  })

  it('stays quiet in an ordinary window', () => {
    render(<App />)

    expect(warning()).not.toBeInTheDocument()
  })

  it('stays quiet even with tasks saved, in an ordinary window', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByPlaceholderText('What needs doing?'), 'An ordinary task{Enter}')

    expect(warning()).not.toBeInTheDocument()
  })

  it('does not fail when the browser has no storage at all', () => {
    const real = window.localStorage
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() { throw new Error('storage disabled') },
    })

    try {
      render(<App />)
      expect(screen.getByPlaceholderText('What needs doing?')).toBeInTheDocument()
      expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
    } finally {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: real,
      })
    }
  })

  it('does not warn when detection is simply not possible', () => {
    // No localStorage to inspect at all: carry on quietly rather than guess.
    const real = window.localStorage
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() { return undefined },
    })

    try {
      render(<App />)
      expect(screen.getByPlaceholderText('What needs doing?')).toBeInTheDocument()
      expect(warning()).not.toBeInTheDocument()
    } finally {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: real,
      })
    }
  })

  it('survives unreadable saved data', () => {
    localStorage.setItem('tasks', 'not json at all {{{')

    render(<App />)

    expect(screen.getByPlaceholderText('What needs doing?')).toBeInTheDocument()
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
  })
})

describe('fast task entry and safe editing', () => {
  const input = () => screen.getByPlaceholderText('What needs doing?')

  it('keeps the input ready after Enter, with no click back', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(input(), 'Call the dentist{Enter}')

    // The next task can be typed straight away.
    await user.type(input(), 'Water the plants{Enter}')

    expect(screen.getByText('Call the dentist')).toBeInTheDocument()
    expect(screen.getByText('Water the plants')).toBeInTheDocument()
  })

  it('holds the keyboard focus in the input after adding', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(input(), 'Call the dentist{Enter}')

    expect(input()).toHaveFocus()
  })

  it('adds a whole run of tasks with Enter alone', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(input(), 'One{Enter}Two{Enter}Three{Enter}')

    expect(screen.getByText('One')).toBeInTheDocument()
    expect(screen.getByText('Two')).toBeInTheDocument()
    expect(screen.getByText('Three')).toBeInTheDocument()
    expect(input()).toHaveValue('')
  })

  it('clears the box after adding, ready for the next one', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(input(), 'Call the dentist{Enter}')

    expect(input()).toHaveValue('')
  })

  it('still adds a task with the Add button', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(input(), 'Clicked my way in')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Clicked my way in')).toBeInTheDocument()
    expect(input()).toHaveValue('')
  })

  it('creates no task from an empty box', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(input())
    await user.keyboard('{Enter}')

    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
  })

  it('creates no task from whitespace only', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(input(), '    {Enter}')

    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
  })

  it('trims the words it saves', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(input(), '   Call the dentist   {Enter}')

    expect(screen.getByText('Call the dentist')).toBeInTheDocument()
  })

  it('saves the new words when I finish an edit', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(input(), 'Call the dentist{Enter}')

    await user.dblClick(screen.getByText('Call the dentist'))
    await user.clear(screen.getByLabelText('Edit Call the dentist'))
    await user.type(screen.getByLabelText('Edit Call the dentist'), 'Call the clinic{Enter}')

    expect(screen.getByText('Call the clinic')).toBeInTheDocument()
    expect(screen.queryByText('Call the dentist')).not.toBeInTheDocument()
  })

  it('leaves the words unchanged when I back out of an edit', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(input(), 'Call the dentist{Enter}')

    await user.dblClick(screen.getByText('Call the dentist'))
    await user.clear(screen.getByLabelText('Edit Call the dentist'))
    await user.type(screen.getByLabelText('Edit Call the dentist'), 'Something else')
    await user.keyboard('{Escape}')

    expect(screen.getByText('Call the dentist')).toBeInTheDocument()
    expect(screen.queryByText('Something else')).not.toBeInTheDocument()
  })

  it('leaves the saved words unchanged if I reload mid-edit', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(input(), 'Call the dentist{Enter}')

    // Start an edit and type a half-finished value.
    await user.dblClick(screen.getByText('Call the dentist'))
    await user.clear(screen.getByLabelText('Edit Call the dentist'))
    await user.type(screen.getByLabelText('Edit Call the dentist'), 'Half typed wo')

    // Reload, the way closing and reopening the tab would.
    cleanup()
    render(<App />)

    expect(screen.getByText('Call the dentist')).toBeInTheDocument()
    expect(screen.queryByText('Half typed wo')).not.toBeInTheDocument()
  })

  it('still adds tasks normally after an edit was left unfinished', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(input(), 'Call the dentist{Enter}')
    await user.dblClick(screen.getByText('Call the dentist'))
    await user.clear(screen.getByLabelText('Edit Call the dentist'))
    await user.type(screen.getByLabelText('Edit Call the dentist'), 'Half typed wo')

    cleanup()
    render(<App />)
    await user.type(input(), 'Water the plants{Enter}')

    expect(screen.getByText('Call the dentist')).toBeInTheDocument()
    expect(screen.getByText('Water the plants')).toBeInTheDocument()
  })
})

describe('the weekly backup hint', () => {
  // A real download, so the app has a last-backup time to work from.
  async function downloadNow(user) {
    await user.click(screen.getByRole('button', { name: 'Download my tasks' }))
  }

  function hint() {
    return screen.queryByText(/It has been a while since you downloaded/)
  }

  // Remounting is what a later visit actually looks like to the app.
  function laterVisit(daysLater) {
    vi.setSystemTime(Date.now() + daysLater * 24 * 60 * 60 * 1000)
    cleanup()
    render(<App />)
  }

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays quiet when the last download was under a week ago', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await downloadNow(user)

    laterVisit(6)

    expect(hint()).not.toBeInTheDocument()
  })

  it('appears once the last download is a week or more old', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await downloadNow(user)

    laterVisit(7)

    expect(hint()).toBeInTheDocument()
  })

  it('says why, in one quiet line', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await downloadNow(user)
    laterVisit(7)

    expect(hint()).toHaveTextContent('It has been a while since you downloaded a backup')
  })

  it('can be dismissed and does not come straight back', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await downloadNow(user)
    laterVisit(8)

    await user.click(screen.getByRole('button', { name: 'Remind me later' }))

    expect(hint()).not.toBeInTheDocument()
  })

  it('stays dismissed on a later visit', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await downloadNow(user)
    laterVisit(8)
    await user.click(screen.getByRole('button', { name: 'Remind me later' }))

    laterVisit(9)

    expect(hint()).not.toBeInTheDocument()
  })

  it('goes quiet once I download a backup', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await downloadNow(user)
    laterVisit(8)
    expect(hint()).toBeInTheDocument()

    await downloadNow(user)

    expect(hint()).not.toBeInTheDocument()
  })

  it('stays quiet for another week after I download', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await downloadNow(user)
    laterVisit(8)
    await downloadNow(user)

    laterVisit(6)
    expect(hint()).not.toBeInTheDocument()

    laterVisit(2)
    expect(hint()).toBeInTheDocument()
  })

  it('comes back for the next cycle once a dismissed person acts', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await downloadNow(user)
    laterVisit(8)
    await user.click(screen.getByRole('button', { name: 'Remind me later' }))

    // Having acted on it, a later week can reasonably mention it again.
    await downloadNow(user)
    laterVisit(8)

    expect(hint()).toBeInTheDocument()
  })

  it('never piles up when the app is left unused for a long time', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await downloadNow(user)

    // A year away: exactly one line, not one per missed week.
    laterVisit(365)

    const lines = screen.getAllByText(/It has been a while since you downloaded/)
    expect(lines).toHaveLength(1)
  })

  it('does not get in the way of using the app', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    laterVisit(30)

    await user.type(screen.getByPlaceholderText('What needs doing?'), 'Still works')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Still works')).toBeInTheDocument()
    expect(hint()).toBeInTheDocument()
  })

  it('appears for a first-time user who has never backed up', () => {
    render(<App />)

    expect(hint()).toBeInTheDocument()
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