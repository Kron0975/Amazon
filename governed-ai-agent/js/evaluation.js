 
document.addEventListener("DOMContentLoaded", () => {
    const documentSelect = document.getElementById("repairDocumentSelect");
    const findingsContainer = document.getElementById("repairFindings");

    const scenarioSelect = document.getElementById("evaluationScenario");
    const policySelect = document.getElementById("evaluationPolicy");
    const runButton = document.getElementById("runEvaluation");
    const resultsContainer = document.getElementById("evaluationResults");

    // Demo findings for the Repair Studio
    const demoFindings = [
        {
            title: "Missing required information",
            severity: "High",
            description: "A required field appears to be incomplete.",
            suggestion: "Review the field and provide the missing information."
        },
        {
            title: "Inconsistent date format",
            severity: "Medium",
            description: "Dates use different formats in the document.",
            suggestion: "Use one consistent date format throughout."
        },
        {
            title: "Formatting inconsistency",
            severity: "Low",
            description: "Some headings use inconsistent formatting.",
            suggestion: "Apply a consistent heading style."
        }
    ];

    function getScannedFiles() {
        // Adjust this key if your scanner uses a different localStorage key.
        return JSON.parse(localStorage.getItem("shieldaiScannedFiles") || "[]");
    }

    function populateDocuments() {
        if (!documentSelect) return;

        const files = getScannedFiles();

        documentSelect.innerHTML = '<option value="">Select a document</option>';

        files.forEach((file, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = file.name || file.fileName || `Document ${index + 1}`;
            documentSelect.appendChild(option);
        });
    }

    function renderFindings() {
        if (!findingsContainer) return;

        if (!documentSelect.value) {
            findingsContainer.innerHTML =
                '<p class="empty-state">Select a document to view its findings.</p>';
            return;
        }

        findingsContainer.innerHTML = "";

        demoFindings.forEach((finding, index) => {
            const card = document.createElement("article");
            card.className = "finding-card";

            card.innerHTML = `
                <h3>${finding.title}</h3>
                <p><strong>Severity:</strong> ${finding.severity}</p>
                <p>${finding.description}</p>
                <p><strong>Suggested fix:</strong> ${finding.suggestion}</p>

                <div class="finding-actions">
                    <button type="button" data-action="accept" data-index="${index}">
                        Accept suggestion
                    </button>
                    <button type="button" data-action="ignore" data-index="${index}">
                        Ignore
                    </button>
                    <button type="button" data-action="investigate" data-index="${index}">
                        Investigate
                    </button>
                </div>
                <p class="finding-status" id="findingStatus${index}"></p>
            `;

            findingsContainer.appendChild(card);
        });
    }

    documentSelect?.addEventListener("change", renderFindings);

    findingsContainer?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const index = button.dataset.index;
        const action = button.dataset.action;
        const status = document.getElementById(`findingStatus${index}`);

        const messages = {
            accept: "Suggestion accepted in this demo.",
            ignore: "Finding marked as ignored.",
            investigate: "Investigation requested in this demo."
        };

        if (status) {
            status.textContent = messages[action] || "Action recorded.";
        }
    });

    // Demo evaluation scenarios and policy outcomes
    const evaluationData = {
        document: {
            balanced: { completion: 92, risk: 1, approval: "Not required" },
            strict: { completion: 85, risk: 0, approval: "Required for edits" },
            permissive: { completion: 98, risk: 3, approval: "Not required" }
        },
        sensitive: {
            balanced: { completion: 78, risk: 1, approval: "Required" },
            strict: { completion: 65, risk: 0, approval: "Required" },
            permissive: { completion: 95, risk: 4, approval: "Not required" }
        },
        external: {
            balanced: { completion: 70, risk: 1, approval: "Required" },
            strict: { completion: 55, risk: 0, approval: "Required" },
            permissive: { completion: 96, risk: 5, approval: "Not required" }
        }
    };

    runButton?.addEventListener("click", () => {
        const scenario = scenarioSelect.value;
        const policy = policySelect.value;
        const result = evaluationData[scenario][policy];

        resultsContainer.innerHTML = `
            <div class="evaluation-result-grid">
                <article class="stat-card">
                    <p>Task Completion</p>
                    <h3>${result.completion}%</h3>
                </article>

                <article class="stat-card">
                    <p>Risk Flags</p>
                    <h3>${result.risk}</h3>
                </article>

                <article class="stat-card">
                    <p>Human Approval</p>
                    <h3>${result.approval}</h3>
                </article>
            </div>

            <p class="evaluation-note">
                Demo results are simulated and do not represent a real AI model evaluation.
            </p>
        `;
    });

    populateDocuments();
});
