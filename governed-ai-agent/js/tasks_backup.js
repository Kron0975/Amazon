(() => {
    "use strict";

    const STORAGE_KEY = "shieldaiTasks";
    const LEGACY_STORAGE_KEY = "shieldaiTaskHistory";

    const STATUS = {
        RUNNING: "running",
        PAUSED: "paused",
        APPROVAL: "approval",
        COMPLETED: "completed",
        FAILED: "failed",
        CANCELLED: "cancelled"
    };

    const STATUS_LABELS = {
        running: "In progress",
        paused: "Paused",
        approval: "Needs approval",
        completed: "Completed",
        failed: "Failed",
        cancelled: "Cancelled"
    };

    const RISK_LABELS = {
        low: "Low",
        medium: "Medium",
        high: "High"
    };

    let selectedTaskId = null;
    let progressTimer = null;

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        if (!document.getElementById("tasksView")) return;

        bindTaskForm();
        bindTaskCenterControls();
        bindTaskActions();
        migrateLegacyTasks();
        renderAll();
        startProgressSimulation();
    }

    // --------------------------------------------------
    // Storage
    // --------------------------------------------------

    function getTasks() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(stored) ? stored : [];
        } catch {
            return [];
        }
    }

    function saveTasks(tasks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    function updateTask(taskId, updates) {
        const tasks = getTasks();
        const index = tasks.findIndex(task => task.id === taskId);

        if (index === -1) return null;

        tasks[index] = {
            ...tasks[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        saveTasks(tasks);
        renderAll();

        return tasks[index];
    }

    function migrateLegacyTasks() {
        const currentTasks = getTasks();
        if (currentTasks.length > 0) return;

        let legacyTasks = [];

        try {
            legacyTasks = JSON.parse(
                localStorage.getItem(LEGACY_STORAGE_KEY) || "[]"
            );
        } catch {
            legacyTasks = [];
        }

        if (!Array.isArray(legacyTasks) || legacyTasks.length === 0) return;

        const migrated = legacyTasks.map((task, index) => normalizeTask(task, index));
        saveTasks(migrated);
    }

    function normalizeTask(task, index = 0) {
        const description =
            task.description ||
            task.title ||
            task.name ||
            "Untitled task";

        return {
            id: task.id || createTaskId(),
            description,
            status: validStatus(task.status) ? task.status : STATUS.COMPLETED,
            risk: validRisk(task.risk) ? task.risk : inferRisk(description),
            progress: Number.isFinite(Number(task.progress))
                ? Math.max(0, Math.min(100, Number(task.progress)))
                : task.status === STATUS.COMPLETED ? 100 : 0,
            createdAt: task.createdAt || task.timestamp || new Date().toISOString(),
            updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
            steps: Array.isArray(task.steps) && task.steps.length
                ? task.steps
                : defaultSteps(task.status || STATUS.RUNNING),
            events: Array.isArray(task.events) ? task.events : [],
            approvalRequired: Boolean(task.approvalRequired),
            error: task.error || "",
            retryCount: Number(task.retryCount || 0)
        };
    }

    function validStatus(status) {
        return Object.values(STATUS).includes(status);
    }

    function validRisk(risk) {
        return ["low", "medium", "high"].includes(risk);
    }

    // --------------------------------------------------
    // Task creation
    // --------------------------------------------------

    function bindTaskForm() {
        const form = document.getElementById("taskForm");
        const input = document.getElementById("taskInput");

        if (!form || !input) return;

        /*
         * Capture the submit event before dashboard.js can process it.
         * This avoids duplicate task creation if dashboard.js also
         * has a taskForm listener.
         */
        form.addEventListener("submit", event => {
            event.preventDefault();
            event.stopImmediatePropagation();

            const description = input.value.trim();
            if (!description) {
                input.focus();
                return;
            }

            const task = createTask(description);
            const tasks = getTasks();

            tasks.unshift(task);
            saveTasks(tasks);

            selectedTaskId = task.id;
            input.value = "";

            renderAll();
            showTaskCenter();
        }, true);
    }

    function createTask(description) {
        const risk = inferRisk(description);
        const approvalRequired = risk === "high";

        return {
            id: createTaskId(),
            description,
            status: approvalRequired ? STATUS.APPROVAL : STATUS.RUNNING,
            risk,
            progress: approvalRequired ? 0 : 8,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvalRequired,
            retryCount: 0,
            steps: defaultSteps(approvalRequired ? STATUS.APPROVAL : STATUS.RUNNING),
            events: [
                {
                    time: new Date().toISOString(),
                    message: approvalRequired
                        ? "Task created. High-risk activity flagged for human review."
                        : "Task created and queued for processing."
                }
            ],
            error: ""
        };
    }

    function createTaskId() {
        return "TASK-" + Date.now().toString(36).toUpperCase() +
            "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    }

    function inferRisk(description) {
        const text = description.toLowerCase();

        const highRiskTerms = [
            "delete", "remove permanently", "transfer money",
            "send payment", "purchase", "publish", "share externally",
            "send email", "submit application", "change password",
            "modify account", "sign", "approve"
        ];

        const mediumRiskTerms = [
            "upload", "download", "edit", "modify", "update",
            "external", "personal data", "confidential", "sensitive"
        ];

        if (highRiskTerms.some(term => text.includes(term))) return "high";
        if (mediumRiskTerms.some(term => text.includes(term))) return "medium";
        return "low";
    }

    function defaultSteps(status) {
        const steps = [
            { title: "Task received", state: "completed" },
            { title: "Analyze request", state: "pending" },
            { title: "Check policy requirements", state: "pending" },
            { title: "Execute task", state: "pending" },
            { title: "Verify results", state: "pending" }
        ];

        if (status === STATUS.APPROVAL) {
            steps[1].state = "completed";
            steps[2].state = "current";
            steps[2].title = "Waiting for human approval";
        } else if (status === STATUS.RUNNING) {
            steps[1].state = "current";
        } else if (status === STATUS.COMPLETED) {
            steps.forEach(step => step.state = "completed");
        }

        return steps;
    }

    // --------------------------------------------------
    // UI bindings
    // --------------------------------------------------

    function bindTaskCenterControls() {
        const search = document.getElementById("taskSearch");
        const statusFilter = document.getElementById("taskStatusFilter");
        const riskFilter = document.getElementById("taskRiskFilter");
        const clearButton = document.getElementById("clearTaskFilters");
        const newTaskButton = document.getElementById("createTaskFromTasks");

        [search, statusFilter, riskFilter].forEach(element => {
            if (!element) return;
            element.addEventListener("input", renderTaskList);
            element.addEventListener("change", renderTaskList);
        });

        if (clearButton) {
            clearButton.addEventListener("click", () => {
                if (search) search.value = "";
                if (statusFilter) statusFilter.value = "all";
                if (riskFilter) riskFilter.value = "all";
                renderTaskList();
            });
        }

        if (newTaskButton) {
            newTaskButton.addEventListener("click", () => {
                showDashboard();
                const input = document.getElementById("taskInput");
                if (input) input.focus();
            });
        }

        const historyList = document.getElementById("taskHistoryList");
        if (historyList) {
            historyList.addEventListener("click", event => {
                const card = event.target.closest("[data-task-id]");
                if (!card) return;

                selectedTaskId = card.dataset.taskId;
                renderTaskList();
                renderTaskDetails();
            });
        }
    }

    function bindTaskActions() {
        const detailPanel = document.getElementById("taskDetailPanel");
        if (!detailPanel) return;

        detailPanel.addEventListener("click", event => {
            const button = event.target.closest("[data-task-action]");
            if (!button) return;

            const action = button.dataset.taskAction;
            const taskId = button.dataset.taskId || selectedTaskId;

            if (!taskId) return;

            switch (action) {
                case "pause":
                    pauseTask(taskId);
                    break;
                case "resume":
                    resumeTask(taskId);
                    break;
                case "retry":
                    retryTask(taskId);
                    break;
                case "cancel":
                    cancelTask(taskId);
                    break;
                case "approve":
                    approveTask(taskId);
                    break;
            }
        });
    }

    // --------------------------------------------------
    // Task actions
    // --------------------------------------------------

    function pauseTask(taskId) {
        const task = getTasks().find(item => item.id === taskId);
        if (!task || task.status !== STATUS.RUNNING) return;

        updateTask(taskId, {
            status: STATUS.PAUSED,
            events: addEvent(task, "Task paused by user.")
        });
    }

    function resumeTask(taskId) {
        const task = getTasks().find(item => item.id === taskId);
        if (!task || task.status !== STATUS.PAUSED) return;

        updateTask(taskId, {
            status: STATUS.RUNNING,
            events: addEvent(task, "Task resumed.")
        });
    }

    function retryTask(taskId) {
        const task = getTasks().find(item => item.id === taskId);
        if (!task || ![STATUS.FAILED, STATUS.CANCELLED].includes(task.status)) return;

        updateTask(taskId, {
            status: STATUS.RUNNING,
            progress: 0,
            error: "",
            retryCount: Number(task.retryCount || 0) + 1,
            steps: defaultSteps(STATUS.RUNNING),
            events: addEvent(task, "Task restarted.")
        });
    }

    function cancelTask(taskId) {
        const task = getTasks().find(item => item.id === taskId);
        if (!task || ![STATUS.RUNNING, STATUS.PAUSED, STATUS.APPROVAL].includes(task.status)) return;

        updateTask(taskId, {
            status: STATUS.CANCELLED,
            events: addEvent(task, "Task cancelled by user.")
        });
    }

    function approveTask(taskId) {
        const task = getTasks().find(item => item.id === taskId);
        if (!task || task.status !== STATUS.APPROVAL) return;

        updateTask(taskId, {
            status: STATUS.RUNNING,
            approvalRequired: false,
            steps: defaultSteps(STATUS.RUNNING),
            events: addEvent(task, "Human approval recorded. Task resumed.")
        });
    }

    function addEvent(task, message) {
        const events = Array.isArray(task.events) ? [...task.events] : [];
        events.unshift({
            time: new Date().toISOString(),
            message
        });
        return events;
    }

    // --------------------------------------------------
    // Demo progress simulation
    // --------------------------------------------------

    function startProgressSimulation() {
        if (progressTimer) clearInterval(progressTimer);

        progressTimer = setInterval(() => {
            const tasks = getTasks();
            let changed = false;

            const updatedTasks = tasks.map(task => {
                if (task.status !== STATUS.RUNNING) return task;

                const nextProgress = Math.min(100, Number(task.progress || 0) + randomProgressStep());
                const nextSteps = updateSteps(task.steps, nextProgress);
                changed = true;

                if (nextProgress >= 100) {
                    return {
                        ...task,
                        progress: 100,
                        status: STATUS.COMPLETED,
                        steps: nextSteps.map(step => ({ ...step, state: "completed" })),
                        updatedAt: new Date().toISOString(),
                        events: addEvent(task, "Task completed successfully.")
                    };
                }

                return {
                    ...task,
                    progress: nextProgress,
                    steps: nextSteps,
                    updatedAt: new Date().toISOString()
                };
            });

            if (changed) {
                saveTasks(updatedTasks);
                renderAll();
            }
        }, 2200);
    }

    function randomProgressStep() {
        return Math.floor(Math.random() * 13) + 7;
    }

    function updateSteps(steps, progress) {
        const safeSteps = Array.isArray(steps) && steps.length
            ? steps.map(step => ({ ...step }))
            : defaultSteps(STATUS.RUNNING);

        const currentIndex = Math.min(
            safeSteps.length - 1,
            Math.floor((progress / 100) * safeSteps.length)
        );

        return safeSteps.map((step, index) => {
            if (index < currentIndex) return { ...step, state: "completed" };
            if (index === currentIndex) return { ...step, state: "current" };
            return { ...step, state: "pending" };
        });
    }

    // --------------------------------------------------
    // Rendering
    // --------------------------------------------------

    function renderAll() {
        renderTaskSummary();
        renderTaskList();
        renderTaskDetails();
        renderRecentTasks();
        renderDashboardStats();
    }

    function renderTaskSummary() {
        const tasks = getTasks();

        setText("taskCountTotal", tasks.length);
        setText("taskCountRunning", tasks.filter(task => task.status === STATUS.RUNNING).length);
        setText(
            "taskCountAttention",
            tasks.filter(task => [STATUS.APPROVAL, STATUS.FAILED].includes(task.status)).length
        );
        setText("taskCountCompleted", tasks.filter(task => task.status === STATUS.COMPLETED).length);
    }

    function renderTaskList() {
        const container = document.getElementById("taskHistoryList");
        if (!container) return;

        const tasks = getFilteredTasks();

        setText("taskResultCount", `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`);

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No matching tasks</h3>
                    <p>Try changing your search or filters.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tasks.map(task => `
            <button
                type="button"
                class="task-history-card ${task.id === selectedTaskId ? "selected" : ""}"
                data-task-id="${escapeHTML(task.id)}"
                aria-pressed="${task.id === selectedTaskId}"
            >
                <div class="task-card-top">
                    <span class="task-id">${escapeHTML(task.id)}</span>
                    <span class="task-status status-${task.status}">
                        ${escapeHTML(STATUS_LABELS[task.status] || task.status)}
                    </span>
                </div>

                <h3>${escapeHTML(task.description)}</h3>

                <div class="task-card-meta">
                    <span class="task-risk risk-${task.risk}">
                        ${escapeHTML(RISK_LABELS[task.risk] || task.risk)} risk
                    </span>
                    <span>${formatDate(task.createdAt)}</span>
                </div>

                ${task.status === STATUS.RUNNING || task.status === STATUS.PAUSED ? `
                    <div class="task-progress-track">
                        <span style="width: ${clampProgress(task.progress)}%"></span>
                    </div>
                    <div class="task-progress-label">${clampProgress(task.progress)}% complete</div>
                ` : ""}
            </button>
        `).join("");
    }

    function getFilteredTasks() {
        const tasks = getTasks();
        const searchValue = (document.getElementById("taskSearch")?.value || "")
            .trim()
            .toLowerCase();
        const statusValue = document.getElementById("taskStatusFilter")?.value || "all";
        const riskValue = document.getElementById("taskRiskFilter")?.value || "all";

        return tasks.filter(task => {
            const matchesSearch =
                !searchValue ||
                task.description.toLowerCase().includes(searchValue) ||
                task.id.toLowerCase().includes(searchValue);

            const matchesStatus = statusValue === "all" || task.status === statusValue;
            const matchesRisk = riskValue === "all" || task.risk === riskValue;

            return matchesSearch && matchesStatus && matchesRisk;
        });
    }

    function renderTaskDetails() {
        const panel = document.getElementById("taskDetailPanel");
        if (!panel) return;

        const task = getTasks().find(item => item.id === selectedTaskId);

        if (!task) {
            panel.innerHTML = `
                <div class="task-detail-empty">
                    <span class="task-detail-empty-icon">☷</span>
                    <h3>Select a task</h3>
                    <p>Choose a task from the list to view its progress and available actions.</p>
                </div>
            `;
            return;
        }

        const actions = getTaskActions(task);

        panel.innerHTML = `
            <div class="task-detail-header">
                <div>
                    <span class="eyebrow">TASK DETAILS</span>
                    <h2>${escapeHTML(task.id)}</h2>
                </div>
                <span class="task-status status-${task.status}">
                    ${escapeHTML(STATUS_LABELS[task.status] || task.status)}
                </span>
            </div>

            <h3 class="task-detail-description">${escapeHTML(task.description)}</h3>

            <div class="task-detail-meta">
                <div>
                    <span>Risk level</span>
                    <strong class="task-risk risk-${task.risk}">
                        ${escapeHTML(RISK_LABELS[task.risk] || task.risk)}
                    </strong>
                </div>
                <div>
                    <span>Created</span>
                    <strong>${formatDate(task.createdAt)}</strong>
                </div>
                <div>
                    <span>Progress</span>
                    <strong>${clampProgress(task.progress)}%</strong>
                </div>
            </div>

            <div class="task-detail-progress">
                <div class="task-progress-track">
                    <span style="width: ${clampProgress(task.progress)}%"></span>
                </div>
            </div>

            ${task.status === STATUS.APPROVAL ? `
                <div class="task-approval-notice">
                    <strong>Human approval required</strong>
                    <p>This task was flagged as high risk. Review it before allowing execution.</p>
                </div>
            ` : ""}

            <div class="task-detail-actions">
                ${actions.map(action => `
                    <button
                        type="button"
                        class="${action.className}"
                        data-task-action="${action.action}"
                        data-task-id="${escapeHTML(task.id)}"
                    >
                        ${action.label}
                    </button>
                `).join("")}
            </div>

            <div class="task-steps-section">
                <h3>Execution steps</h3>
                <ol class="task-steps">
                    ${(task.steps || []).map(step => `
                        <li class="task-step step-${step.state}">
                            <span class="step-marker">${step.state === "completed" ? "✓" : step.state === "current" ? "•" : "○"}</span>
                            <span>${escapeHTML(step.title)}</span>
                            <small>${step.state === "completed" ? "Done" : step.state === "current" ? "Current" : "Pending"}</small>
                        </li>
                    `).join("")}
                </ol>
            </div>

            <div class="task-events-section">
                <h3>Activity log</h3>
                ${(task.events || []).length ? `
                    <ul class="task-event-list">
                        ${task.events.slice(0, 6).map(event => `
                            <li>
                                <span>${escapeHTML(event.message)}</span>
                                <time>${formatTime(event.time)}</time>
                            </li>
                        `).join("")}
                    </ul>
                ` : `<p class="task-muted">No activity recorded yet.</p>`}
            </div>
        `;
    }

    function getTaskActions(task) {
        switch (task.status) {
            case STATUS.RUNNING:
                return [
                    { action: "pause", label: "Ⅱ Pause task", className: "secondary-button" },
                    { action: "cancel", label: "Cancel task", className: "danger-button" }
                ];

            case STATUS.PAUSED:
                return [
                    { action: "resume", label: "▶ Resume task", className: "primary-button" },
                    { action: "cancel", label: "Cancel task", className: "danger-button" }
                ];

            case STATUS.APPROVAL:
                return [
                    { action: "approve", label: "✓ Approve & continue", className: "primary-button" },
                    { action: "cancel", label: "Cancel task", className: "danger-button" }
                ];

            case STATUS.FAILED:
            case STATUS.CANCELLED:
                return [
                    { action: "retry", label: "↻ Retry task", className: "primary-button" }
                ];

            default:
                return [];
        }
    }

    function renderRecentTasks() {
        const container = document.getElementById("recentTasks");
        if (!container) return;

        const tasks = getTasks().slice(0, 4);

        if (tasks.length === 0) {
            container.innerHTML = `
                <p class="empty-state">No tasks yet. Create your first task above.</p>
            `;
            return;
        }

        container.innerHTML = tasks.map(task => `
            <button type="button" class="recent-task-item" data-open-task="${escapeHTML(task.id)}">
                <span class="recent-task-main">
                    <strong>${escapeHTML(task.description)}</strong>
                    <small>${escapeHTML(task.id)} · ${formatDate(task.createdAt)}</small>
                </span>
                <span class="task-status status-${task.status}">
                    ${escapeHTML(STATUS_LABELS[task.status] || task.status)}
                </span>
            </button>
        `).join("");

        container.querySelectorAll("[data-open-task]").forEach(button => {
            button.addEventListener("click", () => {
                selectedTaskId = button.dataset.openTask;
                showTaskCenter();
                renderTaskList();
                renderTaskDetails();
            });
        });
    }

    function renderDashboardStats() {
        const tasks = getTasks();

        setText("totalTasks", tasks.length);
        setText("runningTasks", tasks.filter(task => task.status === STATUS.RUNNING).length);
        setText("pendingApprovals", tasks.filter(task => task.status === STATUS.APPROVAL).length);
        setText("policyBlocks", tasks.filter(task => task.status === STATUS.FAILED).length);
    }

    // --------------------------------------------------
    // Navigation helpers
    // --------------------------------------------------

    function showTaskCenter() {
        const navLink = document.querySelector('.nav-link[data-view="tasks"]');

        if (navLink) {
            navLink.click();
        } else {
            showView("tasks");
        }
    }

    function showDashboard() {
        const navLink = document.querySelector('.nav-link[data-view="dashboard"]');

        if (navLink) {
            navLink.click();
        } else {
            showView("dashboard");
        }
    }

    function showView(viewName) {
        document.querySelectorAll(".page-view").forEach(view => {
            view.hidden = view.id !== `${viewName}View`;
        });

        document.querySelectorAll(".nav-link[data-view]").forEach(link => {
            link.classList.toggle("active", link.dataset.view === viewName);
        });

        const title = document.getElementById("pageTitle");
        if (title) {
            title.textContent = viewName === "tasks" ? "Task Center" : "Dashboard";
        }
    }

    // --------------------------------------------------
    // Utilities
    // --------------------------------------------------

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function clampProgress(value) {
        return Math.max(0, Math.min(100, Number(value) || 0));
    }

    function formatDate(value) {
        if (!value) return "Unknown date";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Unknown date";

        return date.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function formatTime(value) {
        if (!value) return "";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }
})();