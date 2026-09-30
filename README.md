# tasks

A calm, personal task list. Live at **https://todo-app-react-zeta-nine.vercel.app**

[![checks](https://github.com/zerooneK/todo-list-test/actions/workflows/checks.yml/badge.svg)](https://github.com/zerooneK/todo-list-test/actions/workflows/checks.yml)

Tasks live in the browser, on one device. Use an ordinary window rather than a
private one, and download a backup from the app now and then: that file is the
only copy you can restore from.

Working on it: `npm install` also points git at the pre-push hook in
`.githooks`, so the same checks run before anything is pushed. Skip one push
with `git push --no-verify`.

---

The notes below are left over from the Vite template this project started from.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
