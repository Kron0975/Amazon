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

const addFileButton = document.getElementById("addFileButton");
const fileInput = document.getElementById("fileInput");
const uploadedFilesList = document.getElementById("uploadedFilesList");

let uploadedFiles = [];

addFileButton.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", () => {
    const selectedFiles = Array.from(fileInput.files);

    selectedFiles.forEach(file => {
        uploadedFiles.push(file);
    });

    renderUploadedFiles();
    fileInput.value = "";
});

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderUploadedFiles() {
    uploadedFilesList.innerHTML = "";

    if (uploadedFiles.length === 0) {
        uploadedFilesList.innerHTML =
            '<p class="empty-state">No files added yet.</p>';
        return;
    }

    uploadedFiles.forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "uploaded-file-item";

        const info = document.createElement("div");
        info.className = "uploaded-file-info";

        const name = document.createElement("span");
        name.className = "uploaded-file-name";
        name.textContent = file.name;

        const size = document.createElement("span");
        size.className = "uploaded-file-size";
        size.textContent = formatFileSize(file.size);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-file-button";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", () => {
            uploadedFiles.splice(index, 1);
            renderUploadedFiles();
        });

        info.append(name, size);
        item.append(info, removeButton);
        uploadedFilesList.appendChild(item);
    });
}

const taskFileInput = document.getElementById("taskFileInput");
const taskAttachedFiles = document.getElementById("taskAttachedFiles");

let taskFiles = [];

taskFileInput.addEventListener("change", () => {
    const selectedFiles = Array.from(taskFileInput.files);

    selectedFiles.forEach(file => {
        const alreadyAdded = taskFiles.some(
            existingFile =>
                existingFile.name === file.name &&
                existingFile.size === file.size &&
                existingFile.lastModified === file.lastModified
        );

        if (!alreadyAdded) {
            taskFiles.push(file);
        }
    });

    renderTaskFiles();
    taskFileInput.value = "";
});

function renderTaskFiles() {
    taskAttachedFiles.innerHTML = "";

    if (taskFiles.length === 0) {
        taskAttachedFiles.innerHTML =
            '<p class="empty-state">No files attached.</p>';
        return;
    }

    taskFiles.forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "attached-file-item";

        const name = document.createElement("span");
        name.className = "attached-file-name";
        name.textContent = `${file.name} (${formatTaskFileSize(file.size)})`;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-attached-file";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", () => {
            taskFiles.splice(index, 1);
            renderTaskFiles();
        });

        item.append(name, removeButton);
        taskAttachedFiles.appendChild(item);
    });
}

function formatTaskFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}