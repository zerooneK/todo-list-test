import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('the task list', () => {
  it('shows a task I typed', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('What needs to be done?'), 'Buy milk')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('shows a task as done once I tick it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('What needs to be done?'), 'Buy milk')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await user.click(screen.getByRole('checkbox'))

    // The person sees two things change: the box is ticked, and the count
    // drops. Both are asserted here. jsdom cannot resolve the stylesheet
    // cascade, so the strikethrough is deliberately not asserted.
    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.getByText('0 items left')).toBeInTheDocument()
  })
})