
const taskInput = document.getElementById("taskInput");
const startTaskButton = document.getElementById("startTask");
const activityList = document.getElementById("activityList");

startTaskButton.addEventListener("click", function () {
    const task = taskInput.value.trim();

    if (task === "") {
        alert("Please describe a task first.");
        return;
    }

    const taskItem = document.createElement("div");
    taskItem.classList.add("task-item");

    const taskText = document.createElement("p");
    taskText.textContent = task;

    const taskStatus = document.createElement("span");
    taskStatus.textContent = "Queued";
    taskStatus.classList.add("task-status");

    taskItem.appendChild(taskText);
    taskItem.appendChild(taskStatus);

    activityList.prepend(taskItem);
    taskInput.value = "";
});
