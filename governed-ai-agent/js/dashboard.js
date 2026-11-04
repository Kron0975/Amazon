(() => {
    "use strict";

    const API_BASE = "http://127.0.0.1:8000/api/v1";
    const STORAGE_KEY = "amazonExpenseClaims";

    let selectedReceipt = null;
    let busy = false;

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        const form = document.getElementById("taskForm");
        const fileInput = document.getElementById("taskFileInput");

        if (!form || !fileInput) return;

        fileInput.addEventListener("change", () => {
            selectedReceipt = fileInput.files?.[0] || null;
            renderSelectedReceipt();
            clearResult();
        });

        form.addEventListener("submit", handleExpenseSubmit);
        renderSelectedReceipt();
    }

    async function handleExpenseSubmit(event) {
        event.preventDefault();
        if (busy) return;

        const form = event.currentTarget;
        if (!form.reportValidity()) return;

        if (!selectedReceipt) {
            showResult("Please attach a PDF receipt.", true);
            return;
        }

        if (
            selectedReceipt.type !== "application/pdf" &&
            !selectedReceipt.name.toLowerCase().endsWith(".pdf")
        ) {
            showResult("Only PDF receipts are supported.", true);
            return;
        }

        if (selectedReceipt.size <= 0 || selectedReceipt.size > 10 * 1024 * 1024) {
            showResult("Receipt must be larger than 0 bytes and no more than 10 MB.", true);
            return;
        }

        const payload = {
            employee_name: valueOf("employeeName"),
            amount: Number(valueOf("expenseAmount")),
            merchant: valueOf("expenseMerchant"),
            expense_date: valueOf("expenseDate"),
            category: valueOf("expenseCategory"),
            description: valueOf("taskInput")
        };

        if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
            showResult("Enter a valid amount greater than zero.", true);
            return;
        }

        setBusy(true);

        try {
            showResult("Uploading receipt...", false);

            const uploadForm = new FormData();
            uploadForm.append("file", selectedReceipt);

            const uploadResponse = await fetch(
                `${API_BASE}/documents/upload`,
                { method: "POST", body: uploadForm }
            );

            const upload = await readResponse(uploadResponse);

            if (!upload.document_id) {
                throw new Error("Backend did not return a document ID.");
            }

            payload.document_id = upload.document_id;

            try {
                const extractionResponse = await fetch(
                    `${API_BASE}/documents/${encodeURIComponent(upload.document_id)}/extract`
                );

                const extraction = await readResponse(extractionResponse);
                showExtraction(extraction.extracted_text || "No readable text found.");
            } catch (error) {
                showExtraction(
                    `Text extraction unavailable: ${error.message}. Please verify the details against your original PDF.`
                );
            }

            showResult("Receipt uploaded. Submitting expense for policy review...", false);

            const expenseResponse = await fetch(
                `${API_BASE}/expenses/submit`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }
            );

            const result = await readResponse(expenseResponse);

            const record = {
                id: result.expense_id,
                expense_id: result.expense_id,
                ...payload,
                status: result.status,
                message: result.message,
                approval_id: result.approval_id || null,
                created_at: new Date().toISOString()
            };

            const claims = getClaims();
            claims.unshift(record);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(claims.slice(0, 100)));

            window.dispatchEvent(new CustomEvent("expenseClaimsUpdated"));

            let message = `Backend decision: ${result.status}. ${result.message}`;

            if (result.approval_id) {
                message += ` Approval #${result.approval_id} is available in the Approvals page.`;
            }

            showResult(message, false);
            form.reset();
            selectedReceipt = null;
            renderSelectedReceipt();

        } catch (error) {
            showResult(`Submission failed: ${error.message}`, true);
        } finally {
            setBusy(false);
        }
    }

    async function readResponse(response) {
        let data = {};

        try {
            data = await response.json();
        } catch {}

        if (!response.ok) {
            throw new Error(
                typeof data.detail === "string"
                    ? data.detail
                    : `Server returned HTTP ${response.status}`
            );
        }

        return data;
    }

    function getClaims() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    function renderSelectedReceipt() {
        const container = document.getElementById("taskAttachedFiles");
        if (!container) return;

        if (!selectedReceipt) {
            container.innerHTML = '<p class="empty-state">No receipt attached.</p>';
            return;
        }

        const item = document.createElement("p");
        item.className = "attached-file-item";
        item.textContent =
            `${selectedReceipt.name} (${(selectedReceipt.size / 1024).toFixed(1)} KB)`;

        container.replaceChildren(item);
    }

    function showExtraction(text) {
        const panel = document.getElementById("receiptExtraction");
        if (!panel) return;

        panel.hidden = false;

        const heading = document.createElement("h3");
        heading.textContent = "Receipt text preview";

        const pre = document.createElement("pre");
        pre.style.whiteSpace = "pre-wrap";
        pre.textContent = text;

        panel.replaceChildren(heading, pre);
    }

    function showResult(message, isError) {
        const target = document.getElementById("expenseSubmissionResult");
        if (!target) return;

        target.textContent = message;
        target.style.color = isError ? "#b42318" : "inherit";
        target.setAttribute("role", isError ? "alert" : "status");
    }

    function clearResult() {
        const target = document.getElementById("expenseSubmissionResult");
        if (target) target.textContent = "";

        const panel = document.getElementById("receiptExtraction");
        if (panel) {
            panel.hidden = true;
            panel.replaceChildren();
        }
    }

    function setBusy(value) {
        busy = value;

        const button = document.getElementById("expenseSubmitButton");
        if (!button) return;

        button.disabled = value;
        button.textContent = value
            ? "Uploading & submitting..."
            : "Submit expense claim";
    }

    function valueOf(id) {
        return document.getElementById(id)?.value?.trim() || "";
    }
})();
