// Receipt upload and PDF extraction are handled by dashboard.js.
// This file is intentionally kept safe because the original standalone
// scanner controls are not present in the current index.html.
document.addEventListener("DOMContentLoaded", () => {
    const scannedFilesList = document.getElementById("scannedFilesList");
    if (scannedFilesList) {
        scannedFilesList.innerHTML =
            '<p class="empty-state">Receipt documents are uploaded and checked during expense claim submission.</p>';
    }
});