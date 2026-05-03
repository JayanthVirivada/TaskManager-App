"use strict";

/* ── TASK CLASS ─────────────────────────────────────────────── */
class Task {
  constructor({ title, description = "", priority, category }) {
    this.id          = crypto.randomUUID();
    this.title       = title.trim();
    this.description = description.trim();
    this.priority    = priority;
    this.category    = category;
    this.completed   = false;
    this.createdAt   = new Date();
  }

  toggleComplete() {
    this.completed = !this.completed;
    return this;
  }

  update({ title, description, priority, category }) {
    if (title !== undefined)       this.title       = title.trim();
    if (description !== undefined) this.description = description.trim();
    if (priority !== undefined)    this.priority    = priority;
    if (category !== undefined)    this.category    = category;
    return this;
  }

  toJSON() { return { ...this }; }

  static fromJSON(obj) {
    const task = Object.assign(
      new Task({ title: obj.title, priority: obj.priority, category: obj.category }),
      obj
    );
    task.createdAt = new Date(obj.createdAt);
    return task;
  }
}


/* ── TASK MANAGER CLASS ─────────────────────────────────────── */
class TaskManager {
  #tasks = [];
  #storageKey = "taskflow_tasks";

  constructor() { this.#loadFromStorage(); }

  addTask(data) {
    const task = new Task(data);
    this.#tasks.push(task);
    this.#saveToStorage();
    return task;
  }

  updateTask(id, data) {
    const task = this.#findById(id);
    if (!task) return null;
    task.update(data);
    this.#saveToStorage();
    return task;
  }

  deleteTask(id) {
    const idx = this.#tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.#tasks.splice(idx, 1);
    this.#saveToStorage();
    return true;
  }

  toggleComplete(id) {
    const task = this.#findById(id);
    if (!task) return null;
    task.toggleComplete();
    this.#saveToStorage();
    return task;
  }

  getTaskById(id) { return this.#findById(id); }

  getTasks({ category = "all", search = "", sort = "none" } = {}) {
    let list = [...this.#tasks];
    if (category !== "all") list = list.filter(t => t.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    const PRIO = { high: 3, medium: 2, low: 1 };
    if (sort === "asc")  list.sort((a, b) => PRIO[a.priority] - PRIO[b.priority]);
    if (sort === "desc") list.sort((a, b) => PRIO[b.priority] - PRIO[a.priority]);
    return list;
  }

  getCounts() {
    const counts = { all: this.#tasks.length, Personal: 0, Work: 0, Urgent: 0 };
    this.#tasks.forEach(t => counts[t.category]++);
    return counts;
  }

  getStats() {
    return {
      total:     this.#tasks.length,
      completed: this.#tasks.filter(t => t.completed).length,
      high:      this.#tasks.filter(t => t.priority === "high").length,
    };
  }

  #saveToStorage() {
    localStorage.setItem(this.#storageKey, JSON.stringify(this.#tasks.map(t => t.toJSON())));
  }

  #loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.#storageKey);
      if (raw) this.#tasks = JSON.parse(raw).map(Task.fromJSON);
    } catch { this.#tasks = []; }
  }

  #findById(id) { return this.#tasks.find(t => t.id === id) || null; }
}


/* ── NOTIFICATION MANAGER ───────────────────────────────────── */
class NotificationManager {
  #container;
  constructor(containerId) {
    this.#container = document.getElementById(containerId);
  }

  show(message, type = "info", duration = 4000) {
    const icons = { high: "🔴", success: "✅", info: "ℹ️", warning: "⚠️" };
    const el = document.createElement("div");
    el.className = `notif ${type}`;
    el.innerHTML = `<span class="notif-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    this.#container.appendChild(el);
    setTimeout(() => {
      el.classList.add("fade-out");
      el.addEventListener("animationend", () => el.remove());
    }, duration);
  }
}


/* ── APP CONTROLLER ─────────────────────────────────────────── */
class App {
  #manager       = new TaskManager();
  #notifications = new NotificationManager("notification-container");
  #activeCategory = "all";
  #searchQuery    = "";
  #sortOrder      = "none";
  #editingId      = null;

  constructor() {
    this.#bindElements();
    this.#attachEvents();
    this.#applyStoredTheme();
    this.#render();
  }

  #bindElements() {
    this.$overlay     = document.getElementById("modal-overlay");
    this.$form        = document.getElementById("task-form");
    this.$openBtn     = document.getElementById("open-modal-btn");
    this.$closeBtn    = document.getElementById("close-modal-btn");
    this.$cancelBtn   = document.getElementById("cancel-btn");
    this.$submitBtn   = document.getElementById("submit-btn");
    this.$titleInput  = document.getElementById("task-title");
    this.$descInput   = document.getElementById("task-desc");
    this.$prioSel     = document.getElementById("task-priority");
    this.$catSel      = document.getElementById("task-category");
    this.$editId      = document.getElementById("edit-task-id");
    this.$modalTitle  = document.getElementById("modal-title");
    this.$searchInput = document.getElementById("search-input");
    this.$taskList    = document.getElementById("task-list");
    this.$emptyState  = document.getElementById("empty-state");
    this.$boardTitle  = document.getElementById("board-title");
    this.$countLabel  = document.getElementById("task-count-label");
    this.$themeToggle = document.getElementById("theme-toggle");
    this.$catItems    = document.querySelectorAll(".cat-item");
    this.$sortBtns    = document.querySelectorAll(".sort-btn");
  }

  #attachEvents() {
    this.$openBtn.addEventListener("click",   () => this.#openModal());
    this.$closeBtn.addEventListener("click",  () => this.#closeModal());
    this.$cancelBtn.addEventListener("click", () => this.#closeModal());
    this.$overlay.addEventListener("click", e => {
      if (e.target === this.$overlay) this.#closeModal();
    });
    this.$form.addEventListener("submit", e => { e.preventDefault(); this.#handleSubmit(); });
    this.$searchInput.addEventListener("input", () => {
      this.#searchQuery = this.$searchInput.value;
      this.#render();
    });
    this.$catItems.forEach(item => {
      item.addEventListener("click", () => {
        this.#activeCategory = item.dataset.category;
        this.$catItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        this.$boardTitle.textContent = item.dataset.category === "all"
          ? "All Tasks" : item.dataset.category;
        this.#render();
      });
    });
    this.$sortBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        this.#sortOrder = btn.dataset.sort;
        this.$sortBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.#render();
      });
    });
    this.$themeToggle.addEventListener("click", () => this.#toggleTheme());
    document.addEventListener("keydown", e => { if (e.key === "Escape") this.#closeModal(); });
    this.$taskList.addEventListener("click",  e => this.#handleTaskAction(e));
    this.$taskList.addEventListener("change", e => this.#handleTaskAction(e));
  }

  #openModal(task = null) {
    this.#clearErrors();
    this.$form.reset();
    if (task) {
      this.#editingId              = task.id;
      this.$modalTitle.textContent = "Edit Task";
      this.$submitBtn.textContent  = "Save Changes";
      this.$editId.value           = task.id;
      this.$titleInput.value       = task.title;
      this.$descInput.value        = task.description;
      this.$prioSel.value          = task.priority;
      this.$catSel.value           = task.category;
    } else {
      this.#editingId              = null;
      this.$modalTitle.textContent = "New Task";
      this.$submitBtn.textContent  = "Create Task";
      this.$editId.value           = "";
    }
    this.$overlay.classList.remove("hidden");
    setTimeout(() => this.$titleInput.focus(), 50);
  }

  #closeModal() {
    this.$overlay.classList.add("hidden");
    this.#editingId = null;
    this.#clearErrors();
    this.$form.reset();
  }

  #handleSubmit() {
    if (!this.#validate()) return;
    const data = {
      title:       this.$titleInput.value,
      description: this.$descInput.value,
      priority:    this.$prioSel.value,
      category:    this.$catSel.value,
    };
    if (this.#editingId) {
      const task = this.#manager.updateTask(this.#editingId, data);
      if (task.priority === "high") {
        this.#notifications.show(`High-priority task updated: "${task.title}"`, "high");
      } else {
        this.#notifications.show(`Task updated successfully`, "success");
      }
    } else {
      const task = this.#manager.addTask(data);
      if (task.priority === "high") {
        this.#notifications.show(`🚨 High-priority task added: "${task.title}"`, "high");
      } else {
        this.#notifications.show(`Task "${task.title}" created`, "success");
      }
    }
    this.#closeModal();
    this.#render();
  }

  #validate() {
    this.#clearErrors();
    let valid = true;
    if (!this.$titleInput.value.trim()) {
      document.getElementById("title-error").textContent = "Title is required.";
      this.$titleInput.focus();
      valid = false;
    }
    if (!this.$prioSel.value) {
      document.getElementById("priority-error").textContent = "Select a priority.";
      if (valid) this.$prioSel.focus();
      valid = false;
    }
    if (!this.$catSel.value) {
      document.getElementById("category-error").textContent = "Select a category.";
      if (valid) this.$catSel.focus();
      valid = false;
    }
    return valid;
  }

  #clearErrors() {
    ["title-error", "priority-error", "category-error"].forEach(id => {
      document.getElementById(id).textContent = "";
    });
  }

  #handleTaskAction(e) {
    const card = e.target.closest(".task-card");
    if (!card) return;
    const id = card.dataset.id;

    if (e.target.classList.contains("task-check") && e.type === "change") {
      const task = this.#manager.toggleComplete(id);
      if (task.completed) {
        this.#notifications.show(`"${task.title}" marked as complete`, "success");
        if (task.priority === "high") {
          this.#notifications.show(`High-priority task completed!`, "high", 3500);
        }
      }
      this.#render();
      return;
    }
    if (e.type !== "click") return;
    if (e.target.closest(".edit-btn")) {
      const task = this.#manager.getTaskById(id);
      if (task) this.#openModal(task);
      return;
    }
    if (e.target.closest(".delete-btn")) {
      const task = this.#manager.getTaskById(id);
      const title = task ? task.title : "Task";
      if (confirm(`Delete "${title}"?`)) {
        this.#manager.deleteTask(id);
        this.#notifications.show(`Task deleted`, "info", 2500);
        this.#render();
      }
    }
  }

  #render() {
    this.#renderTaskList();
    this.#renderCounts();
    this.#renderStats();
  }

  #renderTaskList() {
    const tasks = this.#manager.getTasks({
      category: this.#activeCategory,
      search:   this.#searchQuery,
      sort:     this.#sortOrder,
    });
    [...this.$taskList.querySelectorAll(".task-card")].forEach(el => el.remove());
    if (tasks.length === 0) {
      this.$emptyState.style.display = "";
      this.$countLabel.textContent = "";
    } else {
      this.$emptyState.style.display = "none";
      this.$countLabel.textContent = `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`;
      const fragment = document.createDocumentFragment();
      tasks.forEach(task => fragment.appendChild(this.#createTaskCard(task)));
      this.$taskList.appendChild(fragment);
    }
  }

  #createTaskCard(task) {
    const card = document.createElement("div");
    card.className = `task-card${task.completed ? " completed" : ""}`;
    card.dataset.id = task.id;
    card.dataset.priority = task.priority;
    const descHtml  = task.description
      ? `<p class="task-desc">${this.#escapeHtml(task.description)}</p>` : "";
    const doneBadge = task.completed ? `<span class="badge badge-done">Done</span>` : "";
    card.innerHTML = `
      <input type="checkbox" class="task-check" title="Mark complete" ${task.completed ? "checked" : ""} />
      <div class="task-body">
        <p class="task-title">${this.#escapeHtml(task.title)}</p>
        ${descHtml}
        <div class="task-meta">
          <span class="badge badge-cat-${task.category}">${task.category}</span>
          <span class="badge badge-prio-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
          ${doneBadge}
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action-btn edit-btn" title="Edit">✎</button>
        <button class="task-action-btn delete delete-btn" title="Delete">✕</button>
      </div>
    `;
    return card;
  }

  #renderCounts() {
    const counts = this.#manager.getCounts();
    Object.entries(counts).forEach(([key, val]) => {
      const el = document.getElementById(`count-${key}`);
      if (el) el.textContent = val;
    });
  }

  #renderStats() {
    const s = this.#manager.getStats();
    document.getElementById("stat-total").textContent = s.total;
    document.getElementById("stat-done").textContent  = s.completed;
    document.getElementById("stat-high").textContent  = s.high;
  }

  #toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next    = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    this.$themeToggle.textContent = next === "dark" ? "☽" : "☀";
    localStorage.setItem("taskflow_theme", next);
  }

  #applyStoredTheme() {
    const stored = localStorage.getItem("taskflow_theme") || "dark";
    document.documentElement.setAttribute("data-theme", stored);
    this.$themeToggle.textContent = stored === "dark" ? "☽" : "☀";
  }

  #escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
}

/* ── BOOT ──────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => { window.__app = new App(); });