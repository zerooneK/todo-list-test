# Hold tasks in browser storage, not an online database

The app is deployed to Vercel but keeps its task list in the browser's own
storage, with no backend service. This was chosen over a free hosted database
(Supabase) because the app is for one person on one main browser, and a
browser-only app needs no account, no login, and no third-party service to keep
working or costing money.

The accepted cost: the task list is tied to one browser on one device, and
clearing that browser's data loses it. Because a web page cannot write files to
the computer without a click, "download my tasks" is the only backup — hence the
weekly quiet hint, and hence using the app through its Vercel address from one
main browser rather than from files on disk. If the list ever needs to be
genuinely portable across devices, moving to a hosted database is the change to
make.
