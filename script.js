// ============================================
// Task Manager Application
// ============================================

class TaskManager {
    constructor() {
        // DOM Elements
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.taskCount = document.getElementById('taskCount');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.editModal = document.getElementById('editModal');
        this.editForm = document.getElementById('editForm');
        this.editInput = document.getElementById('editInput');
        this.closeModal = document.getElementById('closeModal');
        this.cancelEdit = document.getElementById('cancelEdit');

        // State
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingTaskId = null;

        // Initialize
        this.init();
    }

    // ============================================
    // Initialization
    // ============================================

    init() {
        this.loadTasks();
        this.attachEventListeners();
        this.render();
    }

    attachEventListeners() {
        // Task form submission
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Filter buttons
        this.filterBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Modal controls
        this.closeModal.addEventListener('click', () => this.closeEditModal());
        this.cancelEdit.addEventListener('click', () => this.closeEditModal());
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });

        // Edit form submission
        this.editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedTask();
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editModal.classList.contains('show')) {
                this.closeEditModal();
            }
        });
    }

    // ============================================
    // CRUD Operations
    // ============================================

    /**
     * Create a new task
     */
    addTask() {
        const taskText = this.taskInput.value.trim();

        // Validation: prevent empty tasks
        if (!taskText) {
            this.showNotification('Please enter a task description', 'warning');
            this.taskInput.focus();
            return;
        }

        // Validation: prevent very long tasks
        if (taskText.length > 500) {
            this.showNotification('Task is too long (max 500 characters)', 'warning');
            return;
        }

        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdDate: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
        };

        this.tasks.unshift(newTask);
        this.saveTasks();
        this.render();
        this.taskInput.value = '';
        this.taskInput.focus();
    }

    /**
     * Get all tasks or filtered tasks
     */
    getTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter((task) => task.completed);
            case 'pending':
                return this.tasks.filter((task) => !task.completed);
            default:
                return this.tasks;
        }
    }

    /**
     * Update a task
     */
    updateTask(updatedTask) {
        const taskIndex = this.tasks.findIndex((t) => t.id === updatedTask.id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...updatedTask,
            };
            this.saveTasks();
            this.render();
        }
    }

    /**
     * Delete a task
     */
    deleteTask(taskId) {
        const confirmed = confirm('Are you sure you want to delete this task?');
        if (confirmed) {
            this.tasks = this.tasks.filter((task) => task.id !== taskId);
            this.saveTasks();
            this.render();
        }
    }

    /**
     * Toggle task completion status
     */
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    // ============================================
    // Edit Modal Functions
    // ============================================

    openEditModal(taskId) {
        const task = this.tasks.find((t) => t.id === taskId);
        if (task) {
            this.editingTaskId = taskId;
            this.editInput.value = task.text;
            this.editModal.classList.add('show');
            this.editInput.focus();
        }
    }

    closeEditModal() {
        this.editModal.classList.remove('show');
        this.editingTaskId = null;
        this.editInput.value = '';
    }

    saveEditedTask() {
        const updatedText = this.editInput.value.trim();

        if (!updatedText) {
            this.showNotification('Task cannot be empty', 'warning');
            return;
        }

        if (updatedText.length > 500) {
            this.showNotification('Task is too long (max 500 characters)', 'warning');
            return;
        }

        const task = this.tasks.find((t) => t.id === this.editingTaskId);
        if (task && task.text !== updatedText) {
            task.text = updatedText;
            this.saveTasks();
            this.render();
        }

        this.closeEditModal();
    }

    // ============================================
    // Filter Operations
    // ============================================

    setFilter(filter) {
        this.currentFilter = filter;

        // Update active filter button
        this.filterBtns.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.render();
    }

    // ============================================
    // Rendering
    // ============================================

    render() {
        this.renderTasks();
        this.updateTaskCounter();
        this.updateEmptyState();
    }

    renderTasks() {
        const filteredTasks = this.getTasks();
        this.taskList.innerHTML = '';

        filteredTasks.forEach((task) => {
            const taskElement = this.createTaskElement(task);
            this.taskList.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.taskId = task.id;

        li.innerHTML = `
            <input
                type="checkbox"
                class="task-checkbox"
                ${task.completed ? 'checked' : ''}
                aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
            >
            <div class="task-content">
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <div class="task-date">${task.createdDate}</div>
            </div>
            <div class="task-actions">
                <button class="btn btn-edit" aria-label="Edit task">Edit</button>
                <button class="btn btn-delete" aria-label="Delete task">Delete</button>
            </div>
        `;

        // Event listeners for task item
        const checkbox = li.querySelector('.task-checkbox');
        const editBtn = li.querySelector('.btn-edit');
        const deleteBtn = li.querySelector('.btn-delete');

        checkbox.addEventListener('change', () => {
            this.toggleTaskCompletion(task.id);
        });

        editBtn.addEventListener('click', () => {
            this.openEditModal(task.id);
        });

        deleteBtn.addEventListener('click', () => {
            this.deleteTask(task.id);
        });

        return li;
    }

    updateTaskCounter() {
        const pendingTasks = this.tasks.filter((task) => !task.completed);
        this.taskCount.textContent = pendingTasks.length;
    }

    updateEmptyState() {
        const filteredTasks = this.getTasks();
        if (filteredTasks.length === 0) {
            this.emptyState.classList.add('show');
        } else {
            this.emptyState.classList.remove('show');
        }
    }

    // ============================================
    // LocalStorage Operations
    // ============================================

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('tasks');
        this.tasks = saved ? JSON.parse(saved) : [];
    }

    // ============================================
    // Utility Functions
    // ============================================

    /**
     * Escape HTML special characters to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show temporary notification (could be extended with a proper notification system)
     */
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// ============================================
// Initialize App
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
