const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const recentTasks = document.getElementById("recentTasks");

let tasks = JSON.parse(localStorage.getItem("agentTasks") || "[]");
let taskCounter = tasks.reduce((max, task) => Math.max(max, Number(task.id) || 0), 0);

const taskStages = [
    { label: "Task received", progress: 10, delay: 700 },
    { label: "Analyzing request", progress: 30, delay: 1400 },
    { label: "Working on task", progress: 60, delay: 2200 },
    { label: "Checking results", progress: 85, delay: 1500 },
    { label: "Task completed", progress: 100, delay: 900 }
];

function saveTasks() {
    localStorage.setItem("agentTasks", JSON.stringify(tasks));
    window.dispatchEvent(new Event("agentTasksUpdated"));
}

taskForm?.addEventListener("submit", function (event) {
    event.preventDefault();

    const taskText = taskInput.value.trim();
    if (!taskText) return;

    const task = {
        id: ++taskCounter,
        text: taskText,
        status: "In progress",
        progress: 0,
        currentStep: "Starting task",
        activity: []
    };

    tasks.unshift(task);
    taskInput.value = "";

    saveTasks();
    renderTasks();
    runTaskProgress(task);
});

function runTaskProgress(task) {
    let stageIndex = 0;

    function advanceStage() {
        if (stageIndex >= taskStages.length) return;

        const stage = taskStages[stageIndex];

        task.progress = stage.progress;
        task.currentStep = stage.label;

        task.activity.unshift({
            label: stage.label,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
        });

        if (stage.progress === 100) {
            task.status = "Completed";
        }

        saveTasks();
        renderTasks();

        stageIndex++;

        if (stageIndex < taskStages.length) {
            setTimeout(advanceStage, stage.delay);
        }
    }

    advanceStage();
}

function renderTasks() {
    if (!recentTasks) return;

    if (tasks.length === 0) {
        recentTasks.innerHTML = "<p>No tasks yet. Submit a task to get started.</p>";
        return;
    }

    recentTasks.innerHTML = tasks.slice(0, 5).map(task => `
        <div class="recent-task">
            <div>
                <strong>${escapeDashboardHTML(task.text)}</strong>
                <p>${escapeDashboardHTML(task.currentStep || task.status)}</p>
            </div>
            <span>${Number(task.progress) || 0}%</span>
        </div>
    `).join("");
}

function escapeDashboardHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[character]));
}

renderTasks();
