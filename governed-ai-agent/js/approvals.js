const API_BASE = "/api/v1";

document.addEventListener("DOMContentLoaded", () => {
    const view = document.getElementById("approvalsView");
    if (!view) return;

    view.innerHTML = `
        <div class="panel">
            <h2>Human Approvals</h2>
            <p>Review sensitive actions before the agent proceeds.</p>
            <button id="refreshApprovals" class="secondary-button" type="button">
                Refresh approvals
            </button>
            <div id="approvalList">
                <p>Loading approval requests...</p>
            </div>
        </div>
    `;

    document.getElementById("refreshApprovals")
        .addEventListener("click", loadApprovals);

    loadApprovals();
});

async function loadApprovals() {
    const container = document.getElementById("approvalList");
    if (!container) return;

    container.innerHTML = "<p>Loading approvals...</p>";

    try {
        const response = await fetch(`${API_BASE}/approvals/pending`);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        const approvals = Array.isArray(data) ? data : data.approvals || [];

        if (!approvals.length) {
            container.innerHTML = "<p class='empty-state'>No pending approvals.</p>";
            return;
        }

        container.innerHTML = "";

        approvals.forEach(approval => {
            const card = document.createElement("article");
            card.className = "panel";

            const heading = document.createElement("h3");
            heading.textContent = `Approval #${approval.id}`;

            const details = document.createElement("p");
            details.textContent =
                `${approval.action_name} — ${approval.reason}`;

            const status = document.createElement("p");
            status.textContent = `Status: ${approval.status}`;

            const approve = document.createElement("button");
            approve.className = "primary-button";
            approve.textContent = "Approve";

            const reject = document.createElement("button");
            reject.className = "secondary-button";
            reject.textContent = "Reject";

            approve.addEventListener("click", () =>
                reviewApproval(approval.id, "approved")
            );

            reject.addEventListener("click", () =>
                reviewApproval(approval.id, "rejected")
            );

            card.append(heading, details, status, approve, reject);
            container.appendChild(card);
        });

    } catch (error) {
        container.textContent =
            `Could not load approvals: ${error.message}`;
    }
}

async function reviewApproval(id, decision) {
    const reviewer = prompt("Enter reviewer name:");
    if (!reviewer || !reviewer.trim()) return;

    const comment = prompt("Enter review comment:") || "";

    try {
        const response = await fetch(
            `${API_BASE}/approvals/${id}/review`,
            {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    decision,
                    reviewed_by: reviewer.trim(),
                    review_comment: comment
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || "Approval action failed.");
        }

        alert(result.message || `Expense ${decision} successfully.`);
        await loadApprovals();

    } catch (error) {
        alert(error.message);
    }
}

