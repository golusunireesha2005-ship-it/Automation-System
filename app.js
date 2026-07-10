/**
 * AuraTask Main Application Orchestrator
 * Coordinates routing, event bindings, rendering, and notification alarms.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Core Application State
    let currentUser = null;
    let activeView = 'landing';
    let currentTheme = 'light';
    let currentEditingTaskId = null;
    // DOM Element Selectors
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const authNavBtn = document.getElementById('auth-nav-btn');
    const userProfileMenu = document.getElementById('user-profile-menu');
    const navUserName = document.getElementById('nav-user-name');
    const logoutBtn = document.getElementById('logout-btn');
    const dashboardLink = document.querySelector('.dashboard-link');
    // Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const contactForm = document.getElementById('contact-form');
    const contactSuccess = document.getElementById('contact-success');
    const aiQuickForm = document.getElementById('ai-quick-add-form');
    const taskForm = document.getElementById('task-form');
    // Tabs
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    // Modals
    const taskModal = document.getElementById('task-modal');
    const alertModal = document.getElementById('alert-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeTaskModalBtn = document.getElementById('close-task-modal');
    const cancelTaskBtn = document.getElementById('cancel-task-btn');
    const openAddModalBtn = document.getElementById('open-add-task-modal');
    // Alert Modal Elements
    const alertTaskTitle = document.getElementById('alert-task-title');
    const alertTaskDesc = document.getElementById('alert-task-desc');
    const alertTaskPriority = document.getElementById('alert-task-priority');
    const alertTaskTime = document.getElementById('alert-task-time');
    const alertCompleteBtn = document.getElementById('alert-complete-btn');
    const alertDismissBtn = document.getElementById('alert-dismiss-btn');
    let currentActiveAlertTask = null;
    // Filters and Inputs
    const taskSearchInput = document.getElementById('task-search-input');
    const filterPriority = document.getElementById('filter-priority');
    const filterStatus = document.getElementById('filter-status');
    const aiTaskInput = document.getElementById('ai-task-input');
    // Columns
    const tasksTodayList = document.getElementById('tasks-today-list');
    const tasksUpcomingList = document.getElementById('tasks-upcoming-list');
    const tasksCompletedList = document.getElementById('tasks-completed-list');
    // Count Elements
    const countToday = document.getElementById('count-today');
    const countUpcoming = document.getElementById('count-upcoming');
    const countCompletedList = document.getElementById('count-completed-list');
    // Stats Cards Counters
    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statCompleted = document.getElementById('stat-completed');
    const statOverdue = document.getElementById('stat-overdue');
    // AI Chat Widget
    const aiChatWidget = document.getElementById('ai-chat-widget');
    const aiChatBtn = document.getElementById('ai-chat-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    // HTML5 Audio element
    const notificationSound = document.getElementById('notification-sound');
    // ==========================================================================
    // 1. Initializers & Theme Toggle
    // ==========================================================================
    
    function init() {
        // Theme Setup
        const storedTheme = localStorage.getItem('auratask_theme');
        if (storedTheme) {
            setTheme(storedTheme);
        } else {
            // Match browser media queries preference
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(prefersDark ? 'dark' : 'light');
        }
        // Auth Session Restore
        currentUser = window.Auth.getCurrentUser();
        updateAuthUI();
        // Router Setup
        navigateView(currentUser ? 'dashboard' : 'landing');
        // Request browser desktop notification permissions
        if (window.Notification && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        // Register the background Alarm callback
        window.Tasks.registerOnDue((task) => {
            triggerTaskAlarm(task);
        });
        // Initialize icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    function setTheme(theme) {
        currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('auratask_theme', theme);
        
        const darkIcon = themeToggleBtn.querySelector('.theme-icon-dark');
        const lightIcon = themeToggleBtn.querySelector('.theme-icon-light');
        
        if (theme === 'dark') {
            darkIcon.classList.add('hidden');
            lightIcon.classList.remove('hidden');
        } else {
            darkIcon.classList.remove('hidden');
            lightIcon.classList.add('hidden');
        }
    }
    themeToggleBtn.addEventListener('click', () => {
        setTheme(currentTheme === 'light' ? 'dark' : 'light');
    });
    // Mobile navigation hamburger toggle
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
    });
    // Close hamburger menu when clicking navigation links
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            navMenu.classList.remove('open');
        });
    });
    // ==========================================================================
    // 2. Client-side Router
    // ==========================================================================
    function navigateView(viewId) {
        // Validation check for Dashboard
        if (viewId === 'dashboard' && !currentUser) {
            showToast('Please log in to view your dashboard.', 'info');
            viewId = 'auth';
        }
        activeView = viewId;
        
        // Hide all views
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active');
        });
        // Show targets
        const targetSection = document.getElementById(`view-landing`);
        const matchingSection = document.getElementById(`view-${viewId}`);
        if (matchingSection) {
            matchingSection.classList.add('active');
        }
        // Highlight active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-target') === viewId) {
                item.classList.add('active');
            }
        });
        // Specific actions per view load
        if (viewId === 'dashboard') {
            renderDashboard();
            window.Tasks.startReminderEngine(currentUser.email);
            // Display today's date in dashboard header
            updateDashboardHeaderDate();
        } else {
            window.Tasks.stopReminderEngine();
        }
        // Scroll to top of window
        window.scrollTo(0, 0);
    }
    // Attach navigation router click handlers globally
    document.querySelectorAll('[data-target]').forEach(elem => {
        elem.addEventListener('click', (e) => {
            e.preventDefault();
            const target = elem.getAttribute('data-target');
            navigateView(target);
        });
    });
    function updateDashboardHeaderDate() {
        const dateDisplay = document.getElementById('current-date-display');
        if (dateDisplay) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
        }
    }
    // ==========================================================================
    // 3. User Authentication Flows
    // ==========================================================================
    function updateAuthUI() {
        if (currentUser) {
            // Session active
            authNavBtn.classList.add('hidden');
            userProfileMenu.classList.remove('hidden');
            navUserName.textContent = currentUser.name.split(' ')[0];
            dashboardLink.classList.remove('hidden');
            document.getElementById('dashboard-user-name').textContent = currentUser.name;
        } else {
            // Anonymous
            authNavBtn.classList.remove('hidden');
            userProfileMenu.classList.add('hidden');
            dashboardLink.classList.add('hidden');
        }
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    // Tab switcher between login and register
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    });
    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });
    // Registration Handler
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        if (password !== confirmPassword) {
            showToast("Passwords do not match.", "danger");
            return;
        }
        const res = window.Auth.register(name, email, password);
        if (res.success) {
            showToast(res.message, "success");
            // Inject mock tasks to welcome user!
            injectMockTasks(email);
            // Switch tabs to Login
            tabLogin.click();
            loginForm.reset();
            registerForm.reset();
        } else {
            showToast(res.message, "danger");
        }
    });
    // Login Handler
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const res = window.Auth.login(email, password);
        if (res.success) {
            currentUser = res.user;
            updateAuthUI();
            loginForm.reset();
            showToast(res.message, "success");
            navigateView('dashboard');
        } else {
            showToast(res.message, "danger");
        }
    });
    // Logout Handler
    logoutBtn.addEventListener('click', () => {
        window.Auth.logout();
        currentUser = null;
        updateAuthUI();
        showToast("You have been logged out.", "info");
        navigateView('landing');
    });
    // ==========================================================================
    // 4. Mock Data Injection
    // ==========================================================================
    function injectMockTasks(email) {
        const todayStr = getLocalDateString(0);
        const tomorrowStr = getLocalDateString(1);
        const yesterdayStr = getLocalDateString(-1);
        const mockTasks = [
            {
                title: "Fix legacy database schema",
                description: "Overdue task demo. Review MySQL table indexing to speed up retrieval speeds for landing queries.",
                priority: "High",
                dueDate: yesterdayStr,
                dueTime: "09:00",
                completed: false,
                notified: true
            },
            {
                title: "AI System integration review",
                description: "Due today demo. Run local NLP test cases to verify string parameter matching for calendar variables.",
                priority: "Medium",
                dueDate: todayStr,
                dueTime: "20:00",
                completed: false,
                notified: false
            },
            {
                title: "Weekly team sync meeting",
                description: "Upcoming task demo. Connect with engineering leads to map sprints, milestones, and release schedules.",
                priority: "Low",
                dueDate: tomorrowStr,
                dueTime: "10:30",
                completed: false,
                notified: false
            }
        ];
        // Retrieve existing
        const storageKey = window.Tasks.getStorageKey(email);
        localStorage.setItem(storageKey, JSON.stringify(mockTasks.map((t, index) => ({
            ...t,
            id: 'task_mock_' + index + '_' + Date.now()
        }))));
    }
    function getLocalDateString(offsetDays) {
        const date = new Date();
        date.setDate(date.getDate() + offsetDays);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    // ==========================================================================
    // 5. Dashboard task renderer
    // ==========================================================================
    function renderDashboard() {
        if (!currentUser) return;
        const tasks = window.Tasks.getAll(currentUser.email);
        const searchQuery = taskSearchInput.value.toLowerCase().trim();
        const prioFilter = filterPriority.value;
        const statusFilter = filterStatus.value;
        // Apply filters
        let filteredTasks = tasks.filter(task => {
            // Text Search matching Title/Desc
            const matchesSearch = task.title.toLowerCase().includes(searchQuery) || 
                                  task.description.toLowerCase().includes(searchQuery);
            
            // Priority matching
            const matchesPriority = prioFilter === 'all' || task.priority === prioFilter;
            // Status matching
            const isOverdue = window.Tasks.isOverdue(task);
            let matchesStatus = true;
            if (statusFilter === 'pending') {
                matchesStatus = !task.completed;
            } else if (statusFilter === 'completed') {
                matchesStatus = task.completed;
            } else if (statusFilter === 'overdue') {
                matchesStatus = isOverdue;
            }
            return matchesSearch && matchesPriority && matchesStatus;
        });
        // Compute Statistics (based on total unfiltered tasks for accuracy)
        const totalCount = tasks.length;
        const pendingCount = tasks.filter(t => !t.completed).length;
        const completedCount = tasks.filter(t => t.completed).length;
        const overdueCount = tasks.filter(t => window.Tasks.isOverdue(t)).length;
        // Update Counter Labels
        statTotal.textContent = totalCount;
        statPending.textContent = pendingCount;
        statCompleted.textContent = completedCount;
        statOverdue.textContent = overdueCount;
        // Highlight overdue card border if overdueCount > 0
        const overdueCard = document.getElementById('overdue-stat-card');
        if (overdueCount > 0) {
            overdueCard.classList.add('animate-pulse-border');
        } else {
            overdueCard.classList.remove('animate-pulse-border');
        }
        // Clear layout lists
        tasksTodayList.innerHTML = '';
        tasksUpcomingList.innerHTML = '';
        tasksCompletedList.innerHTML = '';
        // Sort Tasks
        const sortedTasks = window.Tasks.sortTasks(filteredTasks);
        let todayCounter = 0;
        let upcomingCounter = 0;
        let completedCounter = 0;
        const todayDateStr = getLocalDateString(0);
        // Populate lists
        sortedTasks.forEach(task => {
            const taskCard = createTaskCardDOM(task);
            if (task.completed) {
                tasksCompletedList.appendChild(taskCard);
                completedCounter++;
            } else {
                // Today column displays today's tasks OR overdue tasks from previous days
                const isTaskOverdue = window.Tasks.isOverdue(task);
                const isDueToday = task.dueDate === todayDateStr;
                if (isDueToday || isTaskOverdue) {
                    tasksTodayList.appendChild(taskCard);
                    todayCounter++;
                } else {
                    tasksUpcomingList.appendChild(taskCard);
                    upcomingCounter++;
                }
            }
        });
        // Update column lists count labels
        countToday.textContent = todayCounter;
        countUpcoming.textContent = upcomingCounter;
        countCompletedList.textContent = completedCounter;
        // Render empty states if necessary
        checkEmptyStates(tasksTodayList, todayCounter, "No tasks due today.");
        checkEmptyStates(tasksUpcomingList, upcomingCounter, "No upcoming tasks scheduled.");
        checkEmptyStates(tasksCompletedList, completedCounter, "No completed tasks yet.");
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    function checkEmptyStates(container, count, message) {
        if (count === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="inbox" class="empty-icon"></i>
                    <p class="empty-text">${message}</p>
                </div>
            `;
        }
    }
    function createTaskCardDOM(task) {
        const isOverdue = window.Tasks.isOverdue(task);
        const card = document.createElement('div');
        card.className = `task-card ${task.completed ? 'completed-task' : ''} ${isOverdue ? 'overdue' : ''}`;
        card.setAttribute('data-id', task.id);
        // Priority Badge Class mapping
        const prioClass = `priority-${task.priority.toLowerCase()}`;
        // Format date display nicely
        const formattedDate = formatCardDate(task.dueDate);
        card.innerHTML = `
            <div class="task-card-header">
                <button class="btn-complete-checkbox ${task.completed ? 'checked' : ''}" title="Toggle Complete">
                    <i data-lucide="check"></i>
                </button>
                <div style="flex: 1; min-width: 0;">
                    <h4 class="task-title-text">${escapeHTML(task.title)}</h4>
                </div>
                <div class="task-card-actions">
                    <button class="icon-btn btn-edit-task" title="Edit Task">
                        <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
                    </button>
                    <button class="icon-btn btn-delete-task" title="Delete Task" style="color: var(--danger);">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                </div>
            </div>
            ${task.description ? `<p class="task-card-desc">${escapeHTML(task.description)}</p>` : ''}
            <div class="task-card-footer">
                <span class="badge ${prioClass}">${task.priority} Priority</span>
                <span class="task-due-badge">
                    <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
                    ${isOverdue ? 'Overdue: ' : ''}${formattedDate} at ${task.dueTime}
                </span>
            </div>
        `;
        // Event: Checkbox Complete
        const checkbox = card.querySelector('.btn-complete-checkbox');
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            window.Tasks.toggleComplete(currentUser.email, task.id);
            showToast(task.completed ? "Task set to pending." : "Task marked as completed!", "success");
            renderDashboard();
        });
        // Event: Edit Task
        const editBtn = card.querySelector('.btn-edit-task');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openTaskModal(task);
        });
        // Event: Delete Task
        const deleteBtn = card.querySelector('.btn-delete-task');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this task?")) {
                window.Tasks.delete(currentUser.email, task.id);
                showToast("Task deleted successfully.", "info");
                renderDashboard();
            }
        });
        return card;
    }
    function formatCardDate(dateStr) {
        const today = getLocalDateString(0);
        const tomorrow = getLocalDateString(1);
        const yesterday = getLocalDateString(-1);
        if (dateStr === today) return 'Today';
        if (dateStr === tomorrow) return 'Tomorrow';
        if (dateStr === yesterday) return 'Yesterday';
        try {
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }
    // Re-render when filters or search fields input changes
    taskSearchInput.addEventListener('input', renderDashboard);
    filterPriority.addEventListener('change', renderDashboard);
    filterStatus.addEventListener('change', renderDashboard);
    // Re-render callback from Tasks module updates
    window.addEventListener('tasks-updated', renderDashboard);
    // ==========================================================================
    // 6. Manual Task Dialog Modals Actions
    // ==========================================================================
    function openTaskModal(task = null) {
        taskForm.reset();
        
        if (task) {
            // Edit Mode
            currentEditingTaskId = task.id;
            modalTitle.textContent = "Edit Task Details";
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-desc').value = task.description;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-due-date').value = task.dueDate;
            document.getElementById('task-due-time').value = task.dueTime;
        } else {
            // Create Mode
            currentEditingTaskId = null;
            modalTitle.textContent = "Create New Task";
            
            // Set defaults (due today, hour rounded up)
            document.getElementById('task-id').value = '';
            document.getElementById('task-due-date').value = getLocalDateString(0);
            
            const now = new Date();
            let hours = String(now.getHours() + 1).padStart(2, '0');
            if (parseInt(hours) > 23) hours = '12';
            document.getElementById('task-due-time').value = `${hours}:00`;
        }
        taskModal.classList.remove('hidden');
    }
    function closeTaskModal() {
        taskModal.classList.add('hidden');
        currentEditingTaskId = null;
    }
    openAddModalBtn.addEventListener('click', () => openTaskModal());
    closeTaskModalBtn.addEventListener('click', closeTaskModal);
    cancelTaskBtn.addEventListener('click', closeTaskModal);
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeTaskModal();
        }
    });
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-desc').value,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value,
            dueTime: document.getElementById('task-due-time').value
        };
        if (currentEditingTaskId) {
            // Update
            window.Tasks.update(currentUser.email, currentEditingTaskId, taskData);
            showToast("Task updated successfully.", "success");
        } else {
            // Create
            window.Tasks.create(currentUser.email, taskData);
            showToast("New task created.", "success");
        }
        closeTaskModal();
        renderDashboard();
    });
    // ==========================================================================
    // 7. AI Smart Parser Form Actions
    // ==========================================================================
    aiQuickForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputString = aiTaskInput.value;
        
        if (!inputString.trim()) return;
        const parsed = window.AI.parseTaskString(inputString);
        
        if (parsed.success) {
            // Save parsed task
            window.Tasks.create(currentUser.email, {
                title: parsed.title,
                description: `Created automatically using Aura AI Parser. Source: "${inputString}"`,
                priority: parsed.priority,
                dueDate: parsed.dueDate,
                dueTime: parsed.dueTime
            });
            // UI visual feedback
            aiTaskInput.value = '';
            showToast(`AI Structured: "${parsed.title}" scheduled!`, "success");
            renderDashboard();
        } else {
            showToast("Could not parse task details. Try manual inputs.", "danger");
        }
    });
    // ==========================================================================
    // 8. Due Alarms & Reminders Engine
    // ==========================================================================
    function triggerTaskAlarm(task) {
        currentActiveAlertTask = task;
        
        // 1. Play Alarm Audio Sound
        try {
            notificationSound.currentTime = 0;
            notificationSound.play();
        } catch (e) {
            console.warn("Could not play alarm sound automatically due to browser user-gesture restrictions.");
        }
        // 2. Trigger HTML5 Native System Desktop Notification
        if (window.Notification && Notification.permission === 'granted') {
            const dateStr = formatCardDate(task.dueDate);
            new Notification(`Task Due: ${task.title}`, {
                body: `${task.description || 'No description provided.'}\nPriority: ${task.priority} | Due: ${dateStr} at ${task.dueTime}`,
                icon: 'https://unpkg.com/lucide-static/icons/bell.png'
            });
        }
        // 3. Show Modal overlay
        alertTaskTitle.textContent = task.title;
        alertTaskDesc.textContent = task.description || 'No description provided for this task.';
        alertTaskPriority.textContent = `${task.priority} Priority`;
        
        // Map badge class priority
        alertTaskPriority.className = `badge priority-${task.priority.toLowerCase()}`;
        alertTaskTime.textContent = `Due today at ${task.dueTime}`;
        
        alertModal.classList.remove('hidden');
    }
    // Dismiss Alert
    alertDismissBtn.addEventListener('click', () => {
        alertModal.classList.add('hidden');
        currentActiveAlertTask = null;
        try {
            notificationSound.pause();
        } catch (e) {}
    });
    // Mark completed from Alarm Dialog
    alertCompleteBtn.addEventListener('click', () => {
        if (currentActiveAlertTask) {
            window.Tasks.toggleComplete(currentUser.email, currentActiveAlertTask.id);
            showToast("Task completed!", "success");
            renderDashboard();
        }
        alertModal.classList.add('hidden');
        currentActiveAlertTask = null;
        try {
            notificationSound.pause();
        } catch (e) {}
    });
    // ==========================================================================
    // 9. Floating AI Assistant Chat Bot
    // ==========================================================================
    aiChatBtn.addEventListener('click', () => {
        aiChatWidget.classList.toggle('closed');
        const isClosed = aiChatWidget.classList.contains('closed');
        
        aiChatBtn.querySelector('.chat-icon-open').classList.toggle('hidden', !isClosed);
        aiChatBtn.querySelector('.chat-icon-close').classList.toggle('hidden', isClosed);
        
        // Remove pulse notice dot
        const pulseDot = aiChatBtn.querySelector('.ai-pulse-dot');
        if (pulseDot) pulseDot.remove();
        // Scroll to bottom when opening
        if (!isClosed) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });
    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    function sendChatMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        // Render user message bubble
        appendChatBubble(text, 'user');
        chatInput.value = '';
        // Typing indicator
        const typingId = 'typing_' + Date.now();
        const typingBubble = document.createElement('div');
        typingBubble.className = 'chat-bubble ai';
        typingBubble.id = typingId;
        typingBubble.innerHTML = `<span class="text-muted">Aura is analyzing...</span>`;
        chatMessages.appendChild(typingBubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        // Fetch task list for AI context
        const tasks = currentUser ? window.Tasks.getAll(currentUser.email) : [];
        // Simulate short network lag for authenticity
        setTimeout(() => {
            typingBubble.remove();
            
            // Generate coach advice
            const coachReply = window.AI.generateCoachResponse(text, tasks);
            appendChatBubble(coachReply, 'ai');
        }, 800);
    }
    function appendChatBubble(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;
        
        // Support markdown bold/bullet formatting
        let formatted = escapeHTML(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '•&nbsp;');
            
        bubble.innerHTML = formatted;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    // ==========================================================================
    // 10. Contact Form Submissions
    // ==========================================================================
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Hide form fields
        contactForm.classList.add('hidden');
        contactSuccess.classList.remove('hidden');
        // Reset details after short time
        setTimeout(() => {
            contactSuccess.classList.add('hidden');
            contactForm.classList.remove('hidden');
            contactForm.reset();
        }, 5000);
    });
    // ==========================================================================
    // 11. Toast System Alert Utility
    // ==========================================================================
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Setup icon class based on toast type
        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'danger') iconName = 'alert-triangle';
        toast.innerHTML = `
            <i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i>
            <span class="toast-message">${escapeHTML(message)}</span>
            <button class="toast-close-btn">&times;</button>
        `;
        // Register dismiss handler
        toast.querySelector('.toast-close-btn').addEventListener('click', () => {
            toast.remove();
        });
        container.appendChild(toast);
        if (window.lucide) {
            window.lucide.createIcons();
        }
        // Auto close after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'fadeOut 0.3s forwards';
                toast.addEventListener('animationend', () => toast.remove());
            }
        }, 4000);
    }
    // ==========================================================================
    // 12. Security Escaping Utils
    // ==========================================================================
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    // Start App
    init();
});