const EVALUATION_API = "/api/v1/evaluation/metrics";

document.addEventListener("DOMContentLoaded", () => {
    const view = document.getElementById("evaluationsView");
    if (!view) return;

    if (!document.getElementById("liveMetrics")) {
        const panel = document.createElement("div");
        panel.className = "panel";
        panel.innerHTML = `
            <h2>Live Agent Evaluation</h2>
            <p>Metrics retrieved from the backend database.</p>
            <button id="refreshMetrics" class="secondary-button" type="button">
                Refresh metrics
            </button>
            <div id="liveMetrics">Loading evaluation metrics...</div>
        `;

        view.prepend(panel);
    }

    document.getElementById("refreshMetrics")
        ?.addEventListener("click", loadEvaluationMetrics);

    loadEvaluationMetrics();

    // Preserve the existing Evaluation Playground.
    const runButton = document.getElementById("runEvaluation");
    const results = document.getElementById("evaluationResults");

    runButton?.addEventListener("click", () => {
        if (!results) return;

        results.innerHTML = `
            <p><strong>Demo simulation only</strong></p>
            <p>Scenario: ${escapeHTML(
                document.getElementById("evaluationScenario")?.value || ""
            )}</p>
            <p>Policy: ${escapeHTML(
                document.getElementById("evaluationPolicy")?.value || ""
            )}</p>
            <p>For actual agent performance, see the live backend metrics above.</p>
        `;
    });
});

async function loadEvaluationMetrics() {
    const container = document.getElementById("liveMetrics");
    if (!container) return;

    container.textContent = "Loading metrics...";

    try {
        const response = await fetch(EVALUATION_API);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();

        const metrics = [
            ["Total Tasks", data.tasks.total],
            ["Completed Tasks", data.tasks.completed],
            ["Failed Tasks", data.tasks.failed],
            ["Pending Tasks", data.tasks.pending],
            ["Completion Rate", `${data.tasks.completion_rate}%`],
            ["Total Approvals", data.approvals.total],
            ["Approved", data.approvals.approved],
            ["Rejected", data.approvals.rejected],
            ["Pending Approvals", data.approvals.pending],
            ["Successful Actions", data.actions.successful],
            ["Blocked Actions", data.actions.blocked],
            ["Waiting for Approval", data.actions.waiting_approval],
            ["Rejected Actions", data.actions.rejected],
            ["Recorded Policy Violations", data.actions.policy_violations]
        ];

        container.innerHTML = `
            <div class="stats-grid">
                ${metrics.map(([label, value]) => `
                    <article class="stat-card">
                        <p>${escapeHTML(label)}</p>
                        <h3>${escapeHTML(value ?? 0)}</h3>
                    </article>
                `).join("")}
            </div>
            <p>Last updated: ${new Date().toLocaleTimeString()}</p>
        `;

    } catch (error) {
        container.textContent =
            `Could not load evaluation metrics: ${error.message}`;
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

