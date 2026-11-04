const navLinks = document.querySelectorAll("[data-view]");
const pageViews = document.querySelectorAll(".page-view");
const pageTitle = document.getElementById("pageTitle");

async function loadAuditTrail() {
    const tableBody = document.getElementById("auditTableBody");
    const summary = document.getElementById("auditSummary");
    const message = document.getElementById("auditMessage");

    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5">Loading actions...</td></tr>';
    if (message) message.textContent = "";

    try {
        const response = await fetch("/api/v1/audit/actions");

        if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        const actions = data.actions || [];

        if (summary) {
            summary.textContent = `${data.total ?? actions.length} recorded actions`;
        }

        tableBody.replaceChildren();

        if (actions.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="5">No recorded actions found.</td></tr>';
            return;
        }

        actions.forEach(function (action) {
            const row = document.createElement("tr");

            const values = [
                action.action_name || "Unknown action",
                action.status || "Unknown",
                action.policy_check || "Not recorded",
                action.document_id || "N/A",
                action.created_at
                    ? new Date(action.created_at).toLocaleString()
                    : "N/A"
            ];

            values.forEach(function (value) {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });

    } catch (error) {
        tableBody.innerHTML =
            '<tr><td colspan="5">Could not load audit records.</td></tr>';

        if (message) {
            message.textContent = `Error: ${error.message}`;
        }

        if (summary) {
            summary.textContent = "Unable to connect to the audit API.";
        }

        console.error("Audit Trail error:", error);
    }
}

navLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
        event.preventDefault();

        const viewName = link.dataset.view;

        pageViews.forEach(function (view) {
            view.hidden = view.id !== `${viewName}View`;
        });

        document.querySelectorAll(".nav-link").forEach(function (navLink) {
            navLink.classList.remove("active");
        });

        document.querySelectorAll(`.nav-link[data-view="${viewName}"]`)
            .forEach(function (navLink) {
                navLink.classList.add("active");
            });

        const titles = {
            dashboard: "Dashboard",
            expense: "Submit Expense",
            tasks: "Tasks",
            approvals: "Approvals",
            policies: "Policies",
            evaluations: "Evaluations",
            repair: "Repair Studio",
            playground: "Evaluation Playground",
            audit: "Audit Trail"
        };

        if (pageTitle) {
            pageTitle.textContent = titles[viewName] || "Dashboard";
        }

        const topbarEyebrow = document.querySelector(".topbar .eyebrow");

        if (topbarEyebrow) {
            topbarEyebrow.textContent =
                `WORKSPACE / ${titles[viewName] || "Dashboard"}`.toUpperCase();
        }

        if (viewName === "audit") {
            loadAuditTrail();
        }
    });
});

const refreshAuditButton = document.getElementById("refreshAudit");

if (refreshAuditButton) {
    refreshAuditButton.addEventListener("click", loadAuditTrail);
}
