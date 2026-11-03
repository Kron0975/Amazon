
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const recentTasks = document.getElementById("recentTasks");

const totalTasksElement = document.getElementById("totalTasks");
const runningTasksElement = document.getElementById("runningTasks");

let tasks = [];
let nextTaskId = 1;

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const description = taskInput.value.trim();

    if (!description) return;

    const task = {
        id: nextTaskId++,
        description: description,
        status: "Pending"
    };

    tasks.unshift(task);

    taskInput.value = "";

    updateDashboard();
});

function updateDashboard() {
    totalTasksElement.textContent = tasks.length;

    runningTasksElement.textContent = tasks.filter(function (task) {
        return task.status === "Running";
    }).length;

    recentTasks.innerHTML = "";

    if (tasks.length === 0) {
        recentTasks.innerHTML =
            '<p class="empty-state">No tasks yet. Create your first task above.</p>';
        return;
    }

    tasks.slice(0, 5).forEach(function (task) {
        const item = document.createElement("div");
        item.className = "recent-task";

        const description = document.createElement("p");
        description.textContent = task.description;

        const badge = document.createElement("span");
        badge.className = `task-badge ${task.status.toLowerCase()}`;
        badge.textContent = task.status;

        item.appendChild(description);
        item.appendChild(badge);

        recentTasks.appendChild(item);
    });
}
