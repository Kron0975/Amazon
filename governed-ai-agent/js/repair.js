 document.addEventListener("DOMContentLoaded", () => {
    const documentSelect = document.getElementById("repairDocumentSelect");
    const findingsContainer = document.getElementById("repairFindings");

    if (!documentSelect || !findingsContainer) {
        console.error("Repair Studio elements not found. Check the IDs in index.html.");
        return;
    }

    function getScannedFiles() {
        try {
            return JSON.parse(localStorage.getItem("scannedFiles")) || [];
        } catch (error) {
            console.error("Could not read scanned files:", error);
            return [];
        }
    }

    function populateDocuments() {
        const files = getScannedFiles();
        const previousValue = documentSelect.value;

        documentSelect.innerHTML = "";

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = files.length
            ? "Select a document"
            : "No scanned documents yet";
        documentSelect.appendChild(placeholder);

        files.forEach((file, index) => {
            const option = document.createElement("option");
            option.value = file.id || file.name || String(index);
            option.textContent = file.name || "Untitled document";
            documentSelect.appendChild(option);
        });

        if (files.some(file => (file.id || file.name) === previousValue)) {
            documentSelect.value = previousValue;
        }

        renderSelectedDocument();
    }

    function renderSelectedDocument() {
        const selectedId = documentSelect.value;

        if (!selectedId) {
            findingsContainer.innerHTML =
                '<p class="empty-state">Select a scanned document to view its findings.</p>';
            return;
        }

        const file = getScannedFiles().find(
            (item, index) => (item.id || item.name || String(index)) === selectedId
        );

        if (!file) {
            findingsContainer.innerHTML =
                '<p class="empty-state">Document not found. Scan it again.</p>';
            return;
        }

        // Demo findings until real document-content analysis is connected.
        findingsContainer.innerHTML = `
            <div class="finding-card">
                <h3>Document review recommended</h3>
                <p>Demo finding for: ${escapeHTML(file.name || "Untitled document")}</p>
                <span class="severity medium">Medium</span>
            </div>
            <div class="finding-card">
                <h3>Check formatting consistency</h3>
                <p>This is a sample finding. Actual document analysis is not connected yet.</p>
                <span class="severity low">Low</span>
            </div>
        `;
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character]));
    }

    documentSelect.addEventListener("change", renderSelectedDocument);
    window.addEventListener("scannedFilesUpdated", populateDocuments);

    populateDocuments();
});