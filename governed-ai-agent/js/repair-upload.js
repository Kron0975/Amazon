(function () {
    "use strict";

    function init() {
        const fileInput = document.getElementById("repairFileInput");
        const scanButton = document.getElementById("repairScanButton");
        const statusEl = document.getElementById("repairUploadStatus");
        const findingsEl = document.getElementById("repairFindings");

        if (!fileInput || !scanButton || !findingsEl) {
            console.warn("repair-upload: required elements not found");
            return;
        }

        const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
        let currentScan = null; // { name, findings, decisions }

        /* ------------------------------------------------------------
           ADAPTER: connect your real scanner here, for example:
               window.repairScanAdapter = (file) => scanFile(file);
           Each finding: { title, description, suggestion, severity }
           severity is "high", "medium" or "low".
        ------------------------------------------------------------ */
        async function runScan(file) {
            if (typeof window.repairScanAdapter === "function") {
                const result = await window.repairScanAdapter(file);
                return Array.isArray(result) ? result : [];
            }
            return basicScan(file);
        }

        async function basicScan(file) {
            const findings = [];
            const isText =
                file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name);

            if (file.size === 0) {
                return [{
                    title: "File is empty",
                    description: "The uploaded file contains no data.",
                    suggestion: "Re-export the document and upload it again.",
                    severity: "high"
                }];
            }

            if (isText) {
                const text = await file.text();

                if (text.trim().length < 50) {
                    findings.push({
                        title: "Very little content",
                        description: "The document has fewer than 50 characters of text.",
                        suggestion: "Check that the full document was uploaded.",
                        severity: "medium"
                    });
                }
                if (/lorem ipsum/i.test(text)) {
                    findings.push({
                        title: "Placeholder text found",
                        description: "The document contains 'lorem ipsum' filler text.",
                        suggestion: "Replace the placeholder text with real content.",
                        severity: "medium"
                    });
                }
                if (/\b(TBD|TODO)\b|\[insert[^\]]*\]/i.test(text)) {
                    findings.push({
                        title: "Unfinished sections",
                        description: "Markers such as TBD, TODO, or [insert ...] were found.",
                        suggestion: "Fill in or remove the unfinished sections.",
                        severity: "high"
                    });
                }
                if (/ {2,}\S/.test(text)) {
                    findings.push({
                        title: "Irregular spacing",
                        description: "Multiple consecutive spaces were found in the text.",
                        suggestion: "Normalize spacing to single spaces.",
                        severity: "low"
                    });
                }
            } else {
                findings.push({
                    title: "Limited analysis for this file type",
                    description:
                        "Only basic checks ran on this file. Deep content analysis needs the full scanner.",
                    suggestion: "Connect the scanner via window.repairScanAdapter.",
                    severity: "low"
                });
            }

            return findings;
        }

        /* ---------------- UI wiring ---------------- */

        function setStatus(message, isError) {
            statusEl.textContent = message;
            statusEl.style.color = isError ? "#b42318" : "";
        }

        function updateButtonState() {
            const hasFile = fileInput.files && fileInput.files.length > 0;
            scanButton.disabled = !hasFile;
            setStatus(hasFile ? fileInput.files[0].name : "", false);
        }

        // Button is enabled only when a file is selected
        fileInput.addEventListener("change", updateButtonState);
        fileInput.addEventListener("input", updateButtonState);
        updateButtonState();

     //edited//

          function saveToTaskCenter(fileName, findings) {
    try {
        const key = "scannedFiles";
        const saved = JSON.parse(localStorage.getItem(key) || "[]");
        const list = Array.isArray(saved) ? saved : [];

        list.unshift({
            id: fileName + "-" + Date.now(),
            name: fileName,
            status: findings.length ? "Issues found" : "No issues found",
            issues: findings.map(f => f.title),
            findings: findings,
            source: "Repair Studio",
            scannedAt: new Date().toISOString()
        });

        localStorage.setItem(key, JSON.stringify(list));
        window.dispatchEvent(new Event("scannedFilesUpdated"));
    } catch (error) {
        console.warn("Could not save scan to Task Center", error);
    }
}                  ////// edit ended /////

        scanButton.addEventListener("click", async () => {
            const file = fileInput.files[0];
            if (!file) return;

            if (file.size > MAX_SIZE) {
                setStatus("File is too large (max 10 MB).", true);
                return;
            }

            scanButton.disabled = true;
            setStatus("Scanning " + file.name + "…", false);

            try {
                const findings = await runScan(file);
                currentScan = {
                    name: file.name,
                    findings: findings.map((f, i) => ({ ...f, id: i })),
                    decisions: {}
                };
                renderFindings();
                setStatus("Scan complete: " + findings.length + " finding(s).", false);
                fileInput.value = "";
                scanButton.disabled = true; // no file selected anymore
            } catch (error) {
                console.error(error);
                setStatus("Scan failed. Please try again.", true);
                scanButton.disabled = false;
            }
        });

        function escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, (c) => ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
            }[c]));
        }

        function renderFindings() {
            if (!currentScan) return;

            const header =
                '<p class="file-upload-hint">Results for <strong>' +
                escapeHtml(currentScan.name) + "</strong></p>";

            if (!currentScan.findings.length) {
                findingsEl.innerHTML =
                    header +
                    '<div class="empty-state repair-empty">' +
                    '<span class="empty-icon">✓</span>' +
                    "<h3>No issues found</h3>" +
                    "<p>This document passed all checks.</p></div>";
                return;
            }

            findingsEl.innerHTML = header + currentScan.findings.map((f) => {
                const decision = currentScan.decisions[f.id] || "";
                return (
                    '<article class="finding-card ' + decision + '" data-finding="' + f.id + '">' +
                    '<div class="finding-top">' +
                    '<span class="severity ' + escapeHtml(f.severity || "low") + '">' +
                    escapeHtml(f.severity || "low") + "</span>" +
                    "<h3>" + escapeHtml(f.title) + "</h3></div>" +
                    "<p>" + escapeHtml(f.description || "") + "</p>" +
                    (f.suggestion
                        ? '<div class="finding-suggestion"><strong>Suggested fix:</strong> ' +
                          escapeHtml(f.suggestion) + "</div>"
                        : "") +
                    '<div class="finding-actions">' +
                    (decision
                        ? "<span>" + (decision === "accepted" ? "Accepted ✓" : "Dismissed") + "</span>"
                        : '<button type="button" class="accept" data-action="accepted">Accept</button>' +
                          '<button type="button" data-action="dismissed">Dismiss</button>') +
                    "</div></article>"
                );
            }).join("");
        }

        findingsEl.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-action]");
            const card = event.target.closest(".finding-card");
            if (!button || !card || !currentScan) return;

            currentScan.decisions[card.dataset.finding] = button.dataset.action;
            renderFindings();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();