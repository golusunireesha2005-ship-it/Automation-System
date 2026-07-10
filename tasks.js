/**
 * AuraTask Tasks Data Management Module
 * Scopes data structure to logged-in user and manages CRUD state.
 */
const Tasks = {
    // Background polling interval reference
    reminderIntervalId: null,
    
    // Callback registers for app notification alerts
    onTaskDueCallback: null,
    /**
     * Get tasks storage key for specific user
     */
    getStorageKey(email) {
        return `auratask_tasks_${email.toLowerCase().trim()}`;
    },
    /**
     * Get all tasks for a specific user
     */
    getAll(email) {
        if (!email) return [];
        const key = this.getStorageKey(email);
        const tasksJSON = localStorage.getItem(key);
        return tasksJSON ? JSON.parse(tasksJSON) : [];
    },
    /**
     * Save tasks array to storage
     */
    saveAll(email, tasks) {
        if (!email) return;
        const key = this.getStorageKey(email);
        localStorage.setItem(key, JSON.stringify(tasks));
    },
    /**
     * Add a new task
     * @returns {Object} Newly created task
     */
    create(email, taskData) {
        const tasks = this.getAll(email);
        
        const newTask = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            title: taskData.title.trim(),
            description: (taskData.description || '').trim(),
            priority: taskData.priority || 'Medium', // High, Medium, Low
            dueDate: taskData.dueDate, // YYYY-MM-DD
            dueTime: taskData.dueTime, // HH:MM
            completed: false,
            notified: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        this.saveAll(email, tasks);
        return newTask;
    },
    /**
     * Update an existing task details
     */
    update(email, taskId, updatedData) {
        const tasks = this.getAll(email);
        const index = tasks.findIndex(t => t.id === taskId);
        
        if (index === -1) return null;
        
        // Reset notified status if date or time changes
        const dateChanged = tasks[index].dueDate !== updatedData.dueDate || tasks[index].dueTime !== updatedData.dueTime;
        
        tasks[index] = {
            ...tasks[index],
            title: updatedData.title.trim(),
            description: (updatedData.description || '').trim(),
            priority: updatedData.priority,
            dueDate: updatedData.dueDate,
            dueTime: updatedData.dueTime,
            // If the time changed, reset notified status so it can alert again at the new time
            notified: dateChanged ? false : tasks[index].notified
        };
        this.saveAll(email, tasks);
        return tasks[index];
    },
    /**
     * Delete a task
     */
    delete(email, taskId) {
        let tasks = this.getAll(email);
        tasks = tasks.filter(t => t.id !== taskId);
        this.saveAll(email, tasks);
        return true;
    },
    /**
     * Toggles task completion state
     */
    toggleComplete(email, taskId) {
        const tasks = this.getAll(email);
        const index = tasks.findIndex(t => t.id === taskId);
        
        if (index === -1) return null;
        
        tasks[index].completed = !tasks[index].completed;
        this.saveAll(email, tasks);
        return tasks[index];
    },
    /**
     * Check if a task is overdue
     */
    isOverdue(task) {
        if (task.completed) return false;
        
        try {
            const now = new Date();
            const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
            return dueDateTime < now;
        } catch (e) {
            return false;
        }
    },
    /**
     * Sort tasks: Completed at the bottom, pending ordered by dueDateTime ascending
     */
    sortTasks(tasks) {
        return tasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1; // Completed items go last
            }
            
            // Otherwise, sort by date & time ascending
            const dateA = new Date(`${a.dueDate}T${a.dueTime}`);
            const dateB = new Date(`${b.dueDate}T${b.dueTime}`);
            return dateA - dateB;
        });
    },
    /**
     * Register the due callback hook
     */
    registerOnDue(callback) {
        this.onTaskDueCallback = callback;
    },
    /**
     * Start the reminder engine checker loop
     */
    startReminderEngine(email) {
        this.stopReminderEngine(); // Make sure no duplicate intervals run
        
        const checkInterval = () => {
            if (!email) return;
            const tasks = this.getAll(email);
            const now = new Date();
            let stateUpdated = false;
            tasks.forEach(task => {
                if (!task.completed && !task.notified) {
                    try {
                        const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
                        
                        // If current time is past or equal to due time
                        if (now >= dueDateTime) {
                            task.notified = true;
                            stateUpdated = true;
                            
                            // Trigger callback alert
                            if (this.onTaskDueCallback) {
                                this.onTaskDueCallback(task);
                            }
                        }
                    } catch (e) {
                        console.error('Error checking task date:', e);
                    }
                }
            });
            if (stateUpdated) {
                this.saveAll(email, tasks);
                // Dispatch event to redraw task lists
                window.dispatchEvent(new CustomEvent('tasks-updated'));
            }
        };
        // Run checks every 10 seconds for high precision notifications
        checkInterval();
        this.reminderIntervalId = setInterval(checkInterval, 10000);
    },
    /**
     * Stop the reminder engine loop
     */
    stopReminderEngine() {
        if (this.reminderIntervalId) {
            clearInterval(this.reminderIntervalId);
            this.reminderIntervalId = null;
        }
    }
};
// Export to window scope
window.Tasks = Tasks;
