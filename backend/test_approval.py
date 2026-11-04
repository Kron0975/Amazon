import requests

BASE_URL = "http://127.0.0.1:8000"

# Choose: approved or rejected
decision = "rejected"

try:
    pending_response = requests.get(
        f"{BASE_URL}/api/v1/approvals/pending"
    )
    pending_response.raise_for_status()

    approvals = pending_response.json()["approvals"]

    if not approvals:
        print("No pending approvals found.")
        print("Submit a new expense first.")
        raise SystemExit

    approval = approvals[0]
    approval_id = approval["id"]

    print("Found pending approval:", approval_id)

    if decision == "approved":
        comment = "Receipt verified. Expense approved."
    elif decision == "rejected":
        comment = "Receipt details could not be verified."
    else:
        raise ValueError("Decision must be approved or rejected.")

    review_data = {
        "decision": decision,
        "reviewed_by": "Admin",
        "review_comment": comment
    }

    response = requests.post(
        f"{BASE_URL}/api/v1/approvals/{approval_id}/review",
        json=review_data
    )

    print("HTTP Status:", response.status_code)
    print("Result:", response.json())

except requests.exceptions.ConnectionError:
    print("Backend is not running.")

except requests.exceptions.RequestException as error:
    print("API error:", error)

