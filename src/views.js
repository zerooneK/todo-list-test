// What a view is.
//
// A view is which subset of the task list is shown. Each one owns its label,
// which tasks it shows, and what it says when there is nothing to show — three
// facts that used to be spread across the button list and the empty-list
// wording, so a new view meant editing three places.
//
// `value` is a plain string because that is all the app stores. Everything a
// caller needs to render a view comes from here, so no caller branches on the
// view names itself.
export const VIEWS = [
  {
    value: 'all',
    label: 'All',
    shows: () => true,
    whenEmpty: 'Nothing here yet.',
  },
  {
    value: 'open',
    label: 'Open',
    shows: task => !task.completed,
    whenEmpty: 'Nothing left to do.',
  },
  {
    value: 'done',
    label: 'Done',
    shows: task => task.completed,
    whenEmpty: 'Nothing done yet.',
  },
]

const ALL = VIEWS[0]

// A view that is not one of ours falls back to showing everything, so an
// unexpected stored value can never leave the app with nothing to show.
export function viewFor(value) {
  return VIEWS.find(view => view.value === value) ?? ALL
}

// The tasks this view shows, in the order they were added.
export function tasksIn(tasks, value) {
  return tasks.filter(viewFor(value).shows)
}
