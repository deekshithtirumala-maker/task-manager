// ============================================
// Advanced Productivity Task Manager
// ============================================

class TaskFlowApp {
    constructor() {
        // Core DOM Elements
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.searchInput = document.getElementById('searchInput');

        // Sidebar
        this.sidebar = document.querySelector('.sidebar');
        this.navItems = document.querySelectorAll('.nav-item');
        this.sidebarClose = document.querySelector('.sidebar-close');
        this.sidebarOverlay = document.querySelector('.sidebar-overlay');
        this.menuToggle = document.querySelector('.menu-toggle');

        // Stats
        this.totalCount = document.getElementById('totalCount');
        this.pendingCount = document.getElementById('pendingCount');
        this.priorityCount = document.getElementById('priorityCount');
        this.headerTaskCount = document.getElementById('headerTaskCount');
        this.todayCount = document.getElementById('todayCount');
        this.streakCount = document.getElementById('streakCount');

        // Filters & Tabs
        this.filterTabs = document.querySelectorAll('.filter-tab');

        // Edit Modal
        this.editModal = document.getElementById('editModal');
        this.editForm = document.getElementById('editForm');
        this.editInput = document.getElementById('editInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.closeModal = document.getElementById('closeModal');
        this.cancelEdit = document.getElementById('cancelEdit');

        // Focus Mode
        this.focusModal = document.getElementById('focusModal');
        this.focusBtn = document.getElementById('focusBtn');
        this.closeFocusModal = document.getElementById('closeFocusModal');
        this.exitFocusBtn = document.getElementById('exitFocusBtn');
        this.focusCompleteBtn = document.getElementById('focusCompleteBtn');
        this.focusSkipBtn = document.getElementById('focusSkipBtn');
        this.focusTaskContainer = document.getElementById('focusTaskContainer');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startTimerBtn = document.getElementById('startTimerBtn');
        this.pauseTimerBtn = document.getElementById('pauseTimerBtn');
        this.resetTimerBtn = document.getElementById('resetTimerBtn');

        // Snooze Modal
        this.snoozeModal = document.getElementById('snoozeModal');
        this.closeSnoozeModalBtn = document.getElementById('closeSnoozeModal');
        this.snoozeBtns = document.querySelectorAll('.snooze-btn');

        // Theme Toggle
        this.themeToggle = document.getElementById('themeToggle');

        // Import/Export
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');

        // State
        this.tasks = [];
        this.currentView = 'all';
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.editingTaskId = null;
        this.snoozingTaskId = null;
        this.focusTaskId = null;
        this.timerInterval = null;
        this.timerSeconds = 1500; // 25 minutes
        this.isTimerRunning = false;
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';

        // Drag & Drop
        this.draggedTask = null;

        // Initialize
        this.init();
    }

    // ============================================
    // Core Initialization
    // ============================================

    init() {
        this.loadTasks();
        this.applyTheme();
        this.attachEventListeners();
        this.processSnoozedTasks();
        this.render();
    }

    attachEventListeners() {
        // Navigation
        this.navItems.forEach((item) => {
            item.addEventListener('click', (e) => {
                this.setView(e.currentTarget.dataset.view);
            });
        });

        // Mobile Menu
        this.menuToggle.addEventListener('click', () => this.toggleSidebar());
        this.sidebarClose.addEventListener('click', () => this.closeSidebar());
        this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());

        // Task Management
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Search
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.currentTarget.value.toLowerCase();
            this.render();
        });

        // Filters
        this.filterTabs.forEach((tab) => {
            tab.addEventListener('click', (e) => {
                this.setFilter(e.currentTarget.dataset.filter);
            });
        });

        // Edit Modal
        this.editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedTask();
        });
        this.closeModal.addEventListener('click', () => this.closeEditModal());
        this.cancelEdit.addEventListener('click', () => this.closeEditModal());

        // Focus Mode
        this.focusBtn.addEventListener('click', () => this.openFocusMode());
        this.closeFocusModal.addEventListener('click', () => this.closeFocusMode());
        this.exitFocusBtn.addEventListener('click', () => this.closeFocusMode());
        this.focusCompleteBtn.addEventListener('click', () => this.focusCompleteTask());
        this.focusSkipBtn.addEventListener('click', () => this.focusSkipTask());

        // Timer Controls
        this.startTimerBtn.addEventListener('click', () => this.startTimer());
        this.pauseTimerBtn.addEventListener('click', () => this.pauseTimer());
        this.resetTimerBtn.addEventListener('click', () => this.resetTimer());

        // Snooze
        this.closeSnoozeModalBtn.addEventListener('click', () => this.closeSnoozeModal());
        this.snoozeBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.currentTarget.dataset.minutes);
                this.snoozeTask(minutes);
            });
        });

        // Theme
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Import/Export
        this.exportBtn.addEventListener('click', () => this.exportTasks());
        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.importTasks(e));

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.editModal.classList.contains('show')) {
                    this.closeEditModal();
                }
                if (this.focusModal.classList.contains('show')) {
                    this.closeFocusMode();
                }
                if (this.snoozeModal.classList.contains('show')) {
                    this.closeSnoozeModal();
                }
            }
        });

        // Close sidebar on resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeSidebar();
            }
        });
    }

    // ============================================
    // CRUD Operations
    // ============================================

    addTask() {
        let taskText = this.taskInput.value.trim();
        if (!taskText || taskText.length > 500) return;

        // Detect priority from keywords
        const priority = this.detectPriority(taskText);

        // Clean task text
        taskText = this.cleanTaskText(taskText);

        const newTask = {
            id: Date.now(),
            text: taskText,
            priority: priority,
            completed: false,
            pinned: false,
            createdDate: new Date().toISOString(),
            snoozedUntil: null,
        };

        this.tasks.unshift(newTask);
        this.saveTasks();
        this.render();
        this.taskInput.value = '';
        this.taskInput.focus();
    }

    detectPriority(text) {
        const priorityKeywords = {
            urgent: ['urgent', 'asap', 'critical', 'emergency'],
            high: ['important', 'high', 'priority'],
            medium: [],
            low: ['later', 'someday', 'optional'],
        };

        const lowerText = text.toLowerCase();
        for (const [priority, keywords] of Object.entries(priorityKeywords)) {
            if (keywords.some((keyword) => lowerText.includes(keyword))) {
                return priority;
            }
        }
        return 'medium';
    }

    cleanTaskText(text) {
        // Remove priority keywords
        const keywords = ['urgent:', 'asap:', 'critical:', 'emergency:', 'important:', 'high:', 'later:', 'someday:', 'optional:'];
        let cleaned = text;
        keywords.forEach((keyword) => {
            cleaned = cleaned.replace(new RegExp(`^${keyword}\\s*`, 'i'), '').trim();
        });
        return cleaned;
    }

    updateTask(taskId, updates) {
        const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...updates,
            };
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(taskId) {
        if (confirm('Delete this task?')) {
            this.tasks = this.tasks.filter((task) => task.id !== taskId);
            this.saveTasks();
            this.render();
        }
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.updateProductivityStats();
            this.render();
        }
    }

    toggleTaskPin(taskId) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            task.pinned = !task.pinned;
            this.saveTasks();
            this.render();
        }
    }

    // ============================================
    // Priority & Snooze Management
    // ============================================

    showSnoozeModal(taskId) {
        this.snoozingTaskId = taskId;
        this.snoozeModal.classList.add('show');
    }

    closeSnoozeModal() {
        this.snoozeModal.classList.remove('show');
        this.snoozingTaskId = null;
    }

    snoozeTask(minutes) {
        if (!this.snoozingTaskId) return;

        const task = this.tasks.find((t) => t.id === this.snoozingTaskId);
        if (task) {
            const now = new Date();
            const snoozeUntil = new Date(now.getTime() + minutes * 60000);
            task.snoozedUntil = snoozeUntil.toISOString();
            this.saveTasks();
            this.render();

            // Show confirmation
            const timeStr = this.formatTimeUntil(snoozeUntil);
            this.showToast(`⏱️ Task snoozed for ${timeStr}`);
        }

        this.closeSnoozeModal();
    }

    processSnoozedTasks() {
        const now = new Date();
        this.tasks.forEach((task) => {
            if (task.snoozedUntil && new Date(task.snoozedUntil) <= now) {
                task.snoozedUntil = null;
            }
        });
        this.saveTasks();
    }

    // ============================================
    // Focus Mode
    // ============================================

    openFocusMode() {
        const pendingTasks = this.getFilteredTasks().filter((t) => !t.completed);
        if (pendingTasks.length === 0) {
            alert('No pending tasks to focus on!');
            return;
        }

        this.focusTaskId = pendingTasks[0].id;
        this.resetTimer();
        this.focusModal.classList.add('show');
        this.renderFocusTask();
    }

    closeFocusMode() {
        this.focusModal.classList.remove('show');
        this.stopTimer();
        this.focusTaskId = null;
    }

    renderFocusTask() {
        if (!this.focusTaskId) return;

        const task = this.tasks.find((t) => t.id === this.focusTaskId);
        if (!task) {
            this.closeFocusMode();
            return;
        }

        const priorityColor = {
            urgent: '#ef4444',
            high: '#f59e0b',
            medium: '#2563eb',
            low: '#10b981',
        };

        this.focusTaskContainer.innerHTML = `
            <div class="focus-task-text" style="color: ${priorityColor[task.priority]}">
                ${this.escapeHtml(task.text)}
            </div>
            <div style="font-size: 0.9rem; color: var(--text-tertiary);">
                ${task.priority.toUpperCase()} PRIORITY
            </div>
        `;
    }

    focusCompleteTask() {
        if (this.focusTaskId) {
            this.toggleTaskCompletion(this.focusTaskId);
            this.stopTimer();

            const pendingTasks = this.getFilteredTasks().filter((t) => !t.completed);
            if (pendingTasks.length === 0) {
                this.closeFocusMode();
            } else {
                this.focusTaskId = pendingTasks[0].id;
                this.resetTimer();
                this.renderFocusTask();
            }
        }
    }

    focusSkipTask() {
        const pendingTasks = this.getFilteredTasks().filter((t) => !t.completed && t.id !== this.focusTaskId);
        if (pendingTasks.length === 0) {
            this.closeFocusMode();
        } else {
            this.focusTaskId = pendingTasks[0].id;
            this.resetTimer();
            this.renderFocusTask();
        }
    }

    // ============================================
    // Timer Management (Pomodoro)
    // ============================================

    startTimer() {
        if (this.isTimerRunning) return;

        this.isTimerRunning = true;
        this.startTimerBtn.style.display = 'none';
        this.pauseTimerBtn.style.display = 'block';

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;

            if (this.timerSeconds <= 0) {
                this.stopTimer();
                this.notifyTimer();
            } else {
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isTimerRunning = false;
        this.pauseTimerBtn.style.display = 'none';
        this.startTimerBtn.style.display = 'block';
        clearInterval(this.timerInterval);
    }

    stopTimer() {
        this.isTimerRunning = false;
        this.pauseTimerBtn.style.display = 'none';
        this.startTimerBtn.style.display = 'block';
        clearInterval(this.timerInterval);
    }

    resetTimer() {
        this.stopTimer();
        this.timerSeconds = 1500; // 25 minutes
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timerSeconds / 60);
        const seconds = this.timerSeconds % 60;
        this.timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    notifyTimer() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('TaskFlow', {
                body: 'Pomodoro session complete!',
                icon: '⏱️',
            });
        }
    }

    // ============================================
    // Navigation & Views
    // ============================================

    setView(view) {
        this.currentView = view;

        this.navItems.forEach((item) => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        this.pageTitle = document.querySelector('.page-title');
        const titleMap = {
            all: 'All Tasks',
            pinned: 'Pinned',
            pending: 'Pending',
            completed: 'Completed',
        };
        this.pageTitle.textContent = titleMap[view] || 'Tasks';

        if (window.innerWidth <= 768) {
            this.closeSidebar();
        }

        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;

        this.filterTabs.forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });

        this.render();
    }

    toggleSidebar() {
        const isOpen = this.sidebar.classList.contains('show');
        if (isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        this.sidebar.classList.add('show');
        this.sidebarOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        this.sidebar.classList.remove('show');
        this.sidebarOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    // ============================================
    // Filtering & Search
    // ============================================

    getFilteredTasks() {
        let filtered = this.tasks;

        // Apply snooze filter based on tab selection
        if (this.currentFilter === 'snoozed') {
            // Show only snoozed tasks (with future snoozeUntil time)
            filtered = filtered.filter((task) => task.snoozedUntil && new Date(task.snoozedUntil) > new Date());
        } else {
            // Show only non-snoozed tasks
            filtered = filtered.filter((task) => !task.snoozedUntil || new Date(task.snoozedUntil) <= new Date());
        }

        // Apply view filter
        if (this.currentView === 'pinned') {
            filtered = filtered.filter((task) => task.pinned);
        } else if (this.currentView === 'pending') {
            filtered = filtered.filter((task) => !task.completed);
        } else if (this.currentView === 'completed') {
            filtered = filtered.filter((task) => task.completed);
        }

        // Apply tab filter (status only, not snooze)
        if (this.currentFilter === 'pending') {
            filtered = filtered.filter((task) => !task.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter((task) => task.completed);
        }

        // Apply search
        if (this.searchQuery) {
            filtered = filtered.filter((task) =>
                task.text.toLowerCase().includes(this.searchQuery)
            );
        }

        // Sort: pinned first, then by creation date
        filtered.sort((a, b) => {
            if (a.pinned !== b.pinned) return b.pinned - a.pinned;
            return new Date(b.createdDate) - new Date(a.createdDate);
        });

        return filtered;
    }

    // ============================================
    // Edit Modal
    // ============================================

    openEditModal(taskId) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            this.editingTaskId = taskId;
            this.editInput.value = task.text;
            this.prioritySelect.value = task.priority;
            this.editModal.classList.add('show');
            this.editInput.focus();
            this.editInput.select();
        }
    }

    closeEditModal() {
        this.editModal.classList.remove('show');
        this.editingTaskId = null;
        this.editInput.value = '';
    }

    saveEditedTask() {
        const updatedText = this.editInput.value.trim();
        const priority = this.prioritySelect.value;

        if (!updatedText || updatedText.length > 500) {
            alert('Invalid task text');
            return;
        }

        const task = this.tasks.find((t) => t.id === this.editingTaskId);
        if (task) {
            task.text = updatedText;
            task.priority = priority;
            this.saveTasks();
            this.render();
        }

        this.closeEditModal();
    }

    // ============================================
    // Rendering
    // ============================================

    render() {
        this.renderTasks();
        this.updateStats();
        this.updateEmptyState();
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        this.taskList.innerHTML = '';

        filteredTasks.forEach((task) => {
            const taskElement = this.createTaskElement(task);
            this.taskList.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const row = document.createElement('div');
        row.className = `task-row ${task.completed ? 'completed' : ''} ${task.pinned ? 'pinned' : ''}`;
        row.dataset.taskId = task.id;
        row.draggable = true;

        const statusLabel = task.completed ? 'Completed' : 'Pending';
        const statusClass = task.completed ? 'completed' : 'pending';

        // Format snooze info if task is snoozed
        let snoozeInfo = '';
        if (task.snoozedUntil) {
            const snoozeTime = new Date(task.snoozedUntil);
            const now = new Date();
            if (snoozeTime > now) {
                const timeUntil = this.formatTimeUntil(snoozeTime);
                snoozeInfo = `<span style="color: #8b5cf6;">⏱️ Snoozed until ${timeUntil}</span>`;
            }
        }

        row.innerHTML = `
            <input
                type="checkbox"
                class="task-checkbox"
                ${task.completed ? 'checked' : ''}
                aria-label="Mark as complete"
            >
            <div class="task-content">
                <div>
                    <span class="task-text">${this.escapeHtml(task.text)}</span>
                    <span class="priority-badge ${task.priority}">${task.priority}</span>
                </div>
                <div class="task-meta">
                    <div class="task-date">📅 ${new Date(task.createdDate).toLocaleDateString()}</div>
                    <div class="task-status ${statusClass}">${statusLabel}</div>
                    ${task.pinned ? '<span style="color: #f59e0b;">📌 Pinned</span>' : ''}
                    ${snoozeInfo}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-icon btn-pin" title="Pin task">📌</button>
                <button class="btn-icon btn-snooze" title="Snooze">⏱️</button>
                <button class="btn-icon btn-edit" title="Edit">✏️</button>
                <button class="btn-icon btn-delete" title="Delete">🗑️</button>
            </div>
        `;

        // Events
        const checkbox = row.querySelector('.task-checkbox');
        const pinBtn = row.querySelector('.btn-pin');
        const snoozeBtn = row.querySelector('.btn-snooze');
        const editBtn = row.querySelector('.btn-edit');
        const deleteBtn = row.querySelector('.btn-delete');

        checkbox.addEventListener('change', () => this.toggleTaskCompletion(task.id));
        pinBtn.addEventListener('click', () => this.toggleTaskPin(task.id));
        snoozeBtn.addEventListener('click', () => this.showSnoozeModal(task.id));
        editBtn.addEventListener('click', () => this.openEditModal(task.id));
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        // Drag & drop
        row.addEventListener('dragstart', () => {
            this.draggedTask = task.id;
            row.classList.add('dragging');
        });

        row.addEventListener('dragend', () => {
            row.classList.remove('dragging');
            this.draggedTask = null;
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedTask && this.draggedTask !== task.id) {
                row.classList.add('drag-over');
            }
        });

        row.addEventListener('dragleave', () => {
            row.classList.remove('drag-over');
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            row.classList.remove('drag-over');
            if (this.draggedTask && this.draggedTask !== task.id) {
                this.reorderTasks(this.draggedTask, task.id);
            }
        });

        return row;
    }

    reorderTasks(fromId, toId) {
        const fromIndex = this.tasks.findIndex((t) => t.id === fromId);
        const toIndex = this.tasks.findIndex((t) => t.id === toId);

        if (fromIndex !== -1 && toIndex !== -1) {
            const [task] = this.tasks.splice(fromIndex, 1);
            this.tasks.splice(toIndex, 0, task);
            this.saveTasks();
            this.render();
        }
    }

    updateStats() {
        const totalTasks = this.tasks.filter((t) => !t.snoozedUntil || new Date(t.snoozedUntil) <= new Date()).length;
        const pendingTasks = this.tasks.filter((t) => !t.completed && (!t.snoozedUntil || new Date(t.snoozedUntil) <= new Date())).length;
        const priorityTasks = this.tasks.filter((t) => (t.priority === 'urgent' || t.priority === 'high') && !t.completed).length;

        this.totalCount.textContent = totalTasks;
        this.pendingCount.textContent = pendingTasks;
        this.priorityCount.textContent = priorityTasks;
        this.headerTaskCount.textContent = pendingTasks;

        this.updateProductivityStats();
    }

    updateProductivityStats() {
        const today = new Date().toDateString();
        const completedToday = this.tasks.filter((t) => {
            return t.completed && new Date(t.createdDate).toDateString() === today;
        }).length;

        this.todayCount.textContent = completedToday;

        // Calculate streak
        const completionDates = [...new Set(
            this.tasks
                .filter((t) => t.completed)
                .map((t) => new Date(t.createdDate).toDateString())
        )].sort().reverse();

        let streak = 0;
        if (completionDates.length > 0) {
            const today = new Date();
            let currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            for (const dateStr of completionDates) {
                const taskDate = new Date(dateStr);
                if (currentDate.getTime() === taskDate.getTime()) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        this.streakCount.textContent = streak;
    }

    updateEmptyState() {
        const filteredTasks = this.getFilteredTasks();
        const isEmpty = filteredTasks.length === 0;

        if (isEmpty) {
            this.emptyState.classList.add('show');
            this.taskList.style.display = 'none';
        } else {
            this.emptyState.classList.remove('show');
            this.taskList.style.display = 'flex';
        }
    }

    // ============================================
    // Theme Management
    // ============================================

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.applyTheme();
    }

    applyTheme() {
        const html = document.documentElement;
        if (this.isDarkMode) {
            html.classList.add('dark-mode');
            this.themeToggle.innerHTML = '<span class="theme-icon">☀️</span>';
        } else {
            html.classList.remove('dark-mode');
            this.themeToggle.innerHTML = '<span class="theme-icon">🌙</span>';
        }
    }

    // ============================================
    // Import / Export
    // ============================================

    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    const confirmed = confirm(`Import ${imported.length} tasks? This will add to existing tasks.`);
                    if (confirmed) {
                        this.tasks = [...this.tasks, ...imported];
                        this.saveTasks();
                        this.render();
                    }
                }
            } catch (error) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);

        // Reset input
        this.importFile.value = '';
    }

    // ============================================
    // Storage
    // ============================================

    saveTasks() {
        localStorage.setItem('tasksData', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('tasksData');
        this.tasks = saved ? JSON.parse(saved) : [];
    }

    // ============================================
    // Utility
    // ============================================

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTimeUntil(futureDate) {
        const now = new Date();
        const diffMs = futureDate - now;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays}d ${diffHours % 24}h`;
        } else if (diffHours > 0) {
            return `${diffHours}h ${diffMins % 60}m`;
        } else if (diffMins > 0) {
            return `${diffMins}m`;
        } else {
            return 'now';
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            font-size: 14px;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    new TaskFlowApp();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});
