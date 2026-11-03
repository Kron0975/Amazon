
const fileInput = document.getElementById("fileInput");
const browseFilesButton = document.getElementById("browseFiles");
const uploadArea = document.getElementById("uploadArea");
const scanQueue = document.getElementById("scanQueue");
const scanFilesButton = document.getElementById("scanFiles");
const scanSummary = document.getElementById("scanSummary");

let selectedFiles = [];
let scanning = false;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".docx"];

// Open file picker
browseFilesButton.addEventListener("click", () => {
    fileInput.click();
});

// Handle selected files
fileInput.addEventListener("change", event => {
    addFiles(event.target.files);
    fileInput.value = "";
});

// Handle drag and drop
uploadArea.addEventListener("dragover", event => {
    event.preventDefault();
    uploadArea.classList.add("drag-over");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-over");
});

uploadArea.addEventListener("drop", event => {
    event.preventDefault();
    uploadArea.classList.remove("drag-over");
    addFiles(event.dataTransfer.files);
});

// Start scanning
scanFilesButton.addEventListener("click", startScanning);

function addFiles(fileList) {
    for (const file of fileList) {
        const extension = "." + file.name.split(".").pop().toLowerCase();

        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            alert(`${file.name}: Unsupported file type.`);
            continue;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert(`${file.name}: File exceeds the 10 MB limit.`);
            continue;
        }

        const alreadyAdded = selectedFiles.some(
            item =>
                item.file.name === file.name &&
                item.file.size === file.size
        );

        if (alreadyAdded) continue;

        selectedFiles.push({
            file: file,
            status: "Ready",
            detail: "Waiting to be scanned.",
            issues: []
        });
    }

    renderQueue();
}

function renderQueue() {
    scanQueue.innerHTML = "";

    if (selectedFiles.length === 0) {
        scanQueue.innerHTML = "<p>No files selected.</p>";
    }

    selectedFiles.forEach((item, index) => {
        const fileCard = document.createElement("div");
        fileCard.className = "scan-file";

        fileCard.innerHTML = `
            <div>
                <strong>${escapeHTML(item.file.name)}</strong>
                <p>${formatFileSize(item.file.size)}</p>
                <small>${escapeHTML(item.detail)}</small>
            </div>

            <span class="scan-status">${escapeHTML(item.status)}</span>

            <button
                type="button"
                class="remove-file"
                data-index="${index}"
                ${scanning ? "disabled" : ""}
            >
                Remove
            </button>
        `;

        scanQueue.appendChild(fileCard);
    });

    scanQueue.querySelectorAll(".remove-file").forEach(button => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.index);
            selectedFiles.splice(index, 1);
            renderQueue();
        });
    });

    scanFilesButton.disabled =
        scanning || !selectedFiles.some(item => item.status === "Ready");
}

async function startScanning() {
    if (scanning) return;

    scanning = true;
    scanSummary.textContent = "Scanning files...";
    renderQueue();

    for (const item of selectedFiles) {
        if (item.status !== "Ready") continue;

        item.status = "Scanning";
        item.detail = "Checking file metadata...";
        renderQueue();

        await delay(1200);

        item.status = "Demo scan complete";
        item.detail =
            "Metadata checks simulated. Content security analysis requires backend integration.";

        // Save the completed scan for the Tasks page
        saveScannedFile(item);

        renderQueue();
    }

    scanning = false;
    scanSummary.textContent = "Demo scan complete.";
    renderQueue();
}

// Save scanned file to localStorage
function saveScannedFile(item) {
    const fileName = item.file?.name || item.name || "Unnamed file";

    const scannedFiles = JSON.parse(
        localStorage.getItem("scannedFiles") || "[]"
    );

    const record = {
        id: `${fileName}-${Date.now()}`,
        name: fileName,
        status: item.status,
        issues: item.issues || [],
        scannedAt: new Date().toISOString()
    };

    scannedFiles.unshift(record);

    localStorage.setItem(
        "scannedFiles",
        JSON.stringify(scannedFiles)
    );

    window.dispatchEvent(new Event("scannedFilesUpdated"));
}

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

// Initial queue render
renderQueue();

