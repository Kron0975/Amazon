 (function () {
    "use strict";

    const STORAGE_KEY = "scannedFiles";

    function init() {
        const list = document.getElementById("scannedFilesList");
        const search = document.getElementById("fileSearch");
        const filter = document.getElementById("fileStatusFilter");
        if (!list) return;

        function getFiles() {
            try {
                const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
                return Array.isArray(data) ? data : [];
            } catch {
                return [];
            }
        }

        function escapeHtml(value) {
            return String(value ?? "").replace(/[&<>"']/g, c => ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
            }[c]));
        }

        function issueText(issue) {
            if (typeof issue === "string") return issue;
            return issue?.title || issue?.message || "Issue";
        }

        function formatDate(value) {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "Unknown date";
            return date.toLocaleString(undefined, {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
            });
        }

        function render() {
            const query = (search?.value || "").trim().toLowerCase();
            const mode = filter?.value || "all";
            const all = getFiles();

            const files = all.filter(file => {
                const count = (file.issues || []).length;
                const matchesSearch =
                    !query || String(file.name || "").toLowerCase().includes(query);
                const matchesMode =
                    mode === "all" ||
                    (mode === "issues" && count > 0) ||
                    (mode === "clean" && count === 0);
                return matchesSearch && matchesMode;
            });

            if (!files.length) {
                list.innerHTML =
                    '<p class="sf-empty">' +
                    (all.length
                        ? "No files match your search or filter."
                        : "No scanned files yet. Attach files to a task or scan one in Repair Studio.") +
                    "</p>";
                return;
            }

            list.innerHTML = files.map(file => {
                const issues = file.issues || [];
                const count = issues.length;
                const shown = issues.slice(0, 3).map(issue =>
                    "<li>" + escapeHtml(issueText(issue)) + "</li>"
                ).join("");
                const more = count > 3
                    ? '<li class="sf-more">+' + (count - 3) + " more</li>"
                    : "";

                return (
                    '<article class="sf-card">' +
                    '<div class="sf-icon">📄</div>' +
                    '<div class="sf-main">' +
                    '<div class="sf-top">' +
                    '<strong class="sf-name">' + escapeHtml(file.name || "Unnamed file") + "</strong>" +
                    '<span class="sf-badge ' + (count ? "sf-issues-badge" : "sf-clean-badge") + '">' +
                    (count ? count + (count === 1 ? " issue" : " issues") : "No issues") +
                    "</span></div>" +
                    '<div class="sf-meta">' +
                    "<span>" + escapeHtml(file.status || "Scanned") + "</span>" +
                    (file.source ? "<span>" + escapeHtml(file.source) + "</span>" : "") +
                    "<span>" + formatDate(file.scannedAt) + "</span></div>" +
                    (count ? '<ul class="sf-issue-list">' + shown + more + "</ul>" : "") +
                    "</div></article>"
                );
            }).join("");
        }

        // Run after any other script that also writes to this list
        const schedule = () => setTimeout(render, 0);

        window.addEventListener("scannedFilesUpdated", schedule);
        window.addEventListener("storage", schedule);
        if (search) search.addEventListener("input", schedule);
        if (filter) filter.addEventListener("change", schedule);
        document.querySelectorAll("[data-view]").forEach(el =>
            el.addEventListener("click", schedule)
        );

        // If another script overwrites the list, put ours back
        new MutationObserver(() => {
            if (list.childNodes.length && !list.querySelector(".sf-card, .sf-empty")) {
                render();
            }
        }).observe(list, { childList: true });

        render();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();