const taskHistoryList = document.getElementById("taskHistoryList");
const scannedFilesList = document.getElementById("scannedFilesList");
const fileSearch = document.getElementById("fileSearch");
const fileStatusFilter = document.getElementById("fileStatusFilter");

function getAgentTasks() {
    return JSON.parse(localStorage.getItem("agentTasks") || "[]");
}

function renderTaskHistory() {
    if (!taskHistoryList) return;

    const tasks = getAgentTasks();

    if (tasks.length === 0) {
        taskHistoryList.innerHTML = "<p>No tasks submitted yet.</p>";
        return;
    }

    taskHistoryList.innerHTML = tasks.map(task => `
        <article class="recent-task">
            <div>
                <strong>${escapeTasksHTML(task.text)}</strong>
                <p>${escapeTasksHTML(task.currentStep || task.status)}</p>
                <small>Status: ${escapeTasksHTML(task.status)}</small>
            </div>
            <span>${Number(task.progress) || 0}%</span>
        </article>
    `).join("");
}

function getScannedFiles() {
    return JSON.parse(localStorage.getItem("scannedFiles") || "[]");
}

function renderScannedFiles() {
    if (!scannedFilesList) return;

    const searchTerm = fileSearch?.value.trim().toLowerCase() || "";
    const statusFilter = fileStatusFilter?.value || "all";

    let files = getScannedFiles();

    files = files.filter(file => {
        const matchesSearch = (file.name || "").toLowerCase().includes(searchTerm);

        const hasIssues = Array.isArray(file.issues) && file.issues.length > 0;
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "issues" && hasIssues) ||
            (statusFilter === "clean" && !hasIssues);

        return matchesSearch && matchesStatus;
    });

    if (files.length === 0) {
        scannedFilesList.innerHTML = "<p>No matching scanned files.</p>";
        return;
    }

    scannedFilesList.innerHTML = files.map(file => `
        <article class="recent-task">
            <div>
                <strong>${escapeTasksHTML(file.name)}</strong>
                <p>${escapeTasksHTML(file.status || "Scanned")}</p>
                <small>${file.scannedAt ? new Date(file.scannedAt).toLocaleString() : ""}</small>
                <p>${Array.isArray(file.issues) && file.issues.length
                    ? `${file.issues.length} issue(s) reported`
                    : "No reported issues"}</p>
            </div>
        </article>
    `).join("");
}

function escapeTasksHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[character]));
}

fileSearch?.addEventListener("input", renderScannedFiles);
fileStatusFilter?.addEventListener("change", renderScannedFiles);

window.addEventListener("agentTasksUpdated", renderTaskHistory);
window.addEventListener("scannedFilesUpdated", renderScannedFiles);

window.addEventListener("storage", event => {
    if (event.key === "agentTasks") renderTaskHistory();
    if (event.key === "scannedFiles") renderScannedFiles();
});

renderTaskHistory();
renderScannedFiles();