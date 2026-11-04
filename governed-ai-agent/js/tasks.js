(() => {
    "use strict";

    const STORAGE_KEY = "amazonExpenseClaims";

    document.addEventListener("DOMContentLoaded", () => {
        renderClaims();
        window.addEventListener("expenseClaimsUpdated", renderClaims);
        window.addEventListener("storage", event => {
            if (event.key === STORAGE_KEY) renderClaims();
        });
    });

    function getClaims() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function renderClaims() {
        const claims = getClaims();
        const history = document.getElementById("taskHistoryList");
        const recent = document.getElementById("recentTasks");

        setText("totalTasks", claims.length);
        setText("runningTasks", claims.filter(x => x.status === "COMPLETED").length);
        setText("pendingApprovals", claims.filter(x => x.status === "PENDING_APPROVAL").length);
        setText("policyBlocks", claims.filter(x => x.status === "BLOCKED").length);

        if (history) {
            history.innerHTML = claims.length ? claims.map(claim => claimCard(claim, true)).join("") :
                '<p class="empty-state">No expense claims submitted yet.</p>';
        }

        if (recent) {
            recent.innerHTML = claims.length ? claims.slice(0, 5).map(claim => claimCard(claim, false)).join("") :
                '<p class="empty-state">No expense claims submitted yet.</p>';
        }
    }

    function claimCard(claim, detailed) {
        const status = String(claim.status || "UNKNOWN");
        const badgeClass = status.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
        const amount = Number(claim.amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });
        return `<article class="panel" style="margin-bottom:12px">
            <div class="task-card-top">
                <strong>${escapeHTML(claim.category || "Expense")} · ${escapeHTML(claim.merchant || "Merchant")}</strong>
                <span class="task-status status-${badgeClass}">${escapeHTML(status.replaceAll("_", " "))}</span>
            </div>
            <p>${escapeHTML(claim.description || "Expense claim")}</p>
            <p><strong>${escapeHTML(amount)}</strong> · ${escapeHTML(claim.expense_date || "")}</p>
            ${detailed ? `<p>Employee: ${escapeHTML(claim.employee_name || "")}</p>
                <p>Expense ID: ${escapeHTML(claim.expense_id || claim.id || "")}</p>
                ${claim.approval_id ? `<p>Approval ID: ${escapeHTML(claim.approval_id)}</p>` : ""}
                <p>${escapeHTML(claim.message || "")}</p>` : ""}
        </article>`;
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value);
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[char]);
    }
})();