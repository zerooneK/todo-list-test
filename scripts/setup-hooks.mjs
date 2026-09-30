// Turn on the pre-push hook.
//
// The hook itself is committed, because it is part of the project. What is not
// committed is the one line of git config that points git at it, so a fresh
// clone has to be told. npm runs `prepare` on `npm install`, so installing is
// enough — and `npm ci` deliberately does not run `prepare`, because a CI
// machine has no reason to change its own git configuration.
import { execFileSync } from 'child_process'
import { join } from 'path'

const HOOKS_DIR = '.githooks'

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

let root
try {
  root = git('rev-parse', '--show-toplevel')
} catch {
  // Not a repository. Nothing to turn on, and nothing to complain about: npm
  // runs this on any install, including somewhere this is only a dependency.
  console.log(`No git repository here, so the ${HOOKS_DIR} hook is not being turned on.`)
  process.exit(0)
}

try {
  git('config', 'core.hooksPath', HOOKS_DIR)
} catch {
  // A missing hook is a convenience, not a broken install. Failing here would
  // make `npm install` fail over something the checks themselves do not need.
  console.log(`Could not set core.hooksPath, so the ${HOOKS_DIR} hook is not active.`)
  console.log(`Turn it on by hand:  git config core.hooksPath ${HOOKS_DIR}`)
  process.exit(0)
}

console.log(`Pre-push hook on. Git will run ${join(HOOKS_DIR, 'pre-push')} before every push.`)
console.log('Skip it for one push with:  git push --no-verify')
