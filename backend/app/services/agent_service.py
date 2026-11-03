from app.services.execution_service import execute_expense


def check_policy(expense_data: dict):
    # Temporary placeholder until Member 3's policy engine is integrated.
    return {
        "decision": "REQUIRE_APPROVAL",
        "reason": "Policy engine integration is pending."
    }


def process_expense(expense_id: str, expense_data: dict):

    policy_result = check_policy(expense_data)
    decision = policy_result["decision"]

    if decision == "BLOCK":
        return {
            "status": "BLOCKED",
            "message": policy_result["reason"]
        }

    if decision == "REQUIRE_APPROVAL":
        return {
            "status": "PENDING_APPROVAL",
            "message": policy_result["reason"]
        }

    if decision == "ALLOW":
        execution_result = execute_expense(
            expense_id,
            expense_data
        )

        return {
            "status": "COMPLETED",
            "message": execution_result["message"]
        }

    return {
        "status": "BLOCKED",
        "message": "Unknown policy decision. Execution prevented."
    }