from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.policy import Policy


def check_expense_policy(
    db: Session,
    amount: float,
    category: str,
    receipt_provided: bool
):
    # Validate the expense amount
    if amount <= 0:
        return {
            "decision": "blocked",
            "reason": "Expense amount must be greater than zero.",
            "policy_id": None
        }

    # Validate the category
    if not category or not category.strip():
        return {
            "decision": "blocked",
            "reason": "Expense category is missing.",
            "policy_id": None
        }

    # Find an active policy for this category
    policy = db.query(Policy).filter(
        func.lower(Policy.expense_category) == category.strip().lower(),
        Policy.is_active == True
    ).first()

    # Fail closed if no policy exists
    if policy is None:
        return {
            "decision": "blocked",
            "reason": "No active policy exists for this expense category.",
            "policy_id": None
        }

    # Check whether a receipt is mandatory
    if policy.receipt_required and not receipt_provided:
        return {
            "decision": "blocked",
            "reason": "A receipt is required for this expense.",
            "policy_id": policy.id
        }

    # Check the hard maximum amount first
    if policy.max_amount is not None and amount > policy.max_amount:
        return {
            "decision": "blocked",
            "reason": "Expense exceeds the maximum permitted amount.",
            "policy_id": policy.id
        }

    # Check whether human approval is required
    if (
        policy.approval_threshold is not None
        and amount > policy.approval_threshold
    ):
        return {
            "decision": "approval_required",
            "reason": "Expense requires human approval.",
            "policy_id": policy.id
        }

    # Expense passed all policy checks
    return {
        "decision": "allowed",
        "reason": "Expense passed all policy checks.",
        "policy_id": policy.id
    }
