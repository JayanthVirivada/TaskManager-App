Here's the Taskflow README content as plain text:

---

Taskflow — Task Manager

A clean, responsive task management web app built with vanilla HTML, CSS, and JavaScript. No frameworks, no dependencies — just fast, lightweight task tracking that works right in your browser.

---

Features

Create, edit and delete tasks with a smooth modal form. Priority levels include Low, Medium, and High with visual badges and alerts. Category filtering lets you switch between Personal, Work, and Urgent views. You can sort tasks by priority in default order, low to high, or high to low. Live search filters tasks instantly by title or description. Completion tracking lets you check off tasks and monitor progress. A stats sidebar shows total, completed, and high-priority task counts at a glance. Dark and light theme toggling is available with persistence across sessions. Tasks are saved to LocalStorage so they survive page refreshes. Toast notifications provide real-time feedback on every action.

---

Project Structure

The project contains three files inside a folder called task Manager. index.html handles the app layout, modal, sidebar, and task board. style.css handles all styling with CSS variables for theming. script.js contains all the app logic including the Task, TaskManager, App, and NotificationManager classes.

---

Getting Started

No build tools or installs are required. Clone or download the repository, open index.html in any modern browser, and start adding tasks.

---

How It Works

The app is built around four ES6 classes. The Task class is the data model and stores the title, description, priority, category, and completion state of each task. The TaskManager class handles business logic including CRUD operations, filtering, sorting, and LocalStorage read and write. The NotificationManager class renders auto-dismissing toast notifications. The App class is the UI controller that binds DOM elements, handles events, and renders task cards.

---

Data Persistence

Tasks are saved to localStorage under the key taskflow_tasks. The theme preference is saved under taskflow_theme. No backend or account is needed.

---

Browser Support

The app works in all modern browsers that support ES2020 features like private class fields and crypto.randomUUID, as well as localStorage. This includes Chrome 92 and above, Firefox 90 and above, Safari 15 and above, and Edge 92 and above.

---

License

MIT — feel free to use, modify, and share.
