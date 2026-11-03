from app.services.execution_service import execute_expense
from app.services.approval_service import create_approval_request
from app.models.expense import Expense


def check_policy(expense_data: dict):
    # Temporary safe default.
    # Actual policy rules will be integrated next.
    return {
        "decision": "REQUIRE_APPROVAL",
        "reason": "Expense requires human approval."
    }


def process_expense(db, expense_id: str, expense_data: dict):

    try:
        # STEP 1: Save expense in database
        expense = Expense(
            expense_id=expense_id,
            employee_name=expense_data["employee_name"],
            amount=expense_data["amount"],
            merchant=expense_data["merchant"],
            expense_date=expense_data["expense_date"],
            category=expense_data["category"],
            description=expense_data.get("description"),
            status="PROCESSING"
        )

        db.add(expense)
        db.flush()

        # STEP 2: Evaluate policy
        policy_result = check_policy(expense_data)
        decision = policy_result["decision"]
        reason = policy_result["reason"]

        # STEP 3: Block prohibited actions
        if decision == "BLOCK":
            expense.status = "BLOCKED"
            db.commit()

            return {
                "status": "BLOCKED",
                "message": reason
            }

        # STEP 4: Request human approval
        if decision == "REQUIRE_APPROVAL":

            approval = create_approval_request(
                db=db,
                expense_id=expense_id,
                action_name="SUBMIT_EXPENSE",
                reason=reason
            )

            expense.status = "PENDING_APPROVAL"
            db.commit()

            return {
                "status": "PENDING_APPROVAL",
                "message": reason,
                "approval_id": approval.id
            }

        # STEP 5: Execute only when explicitly allowed
        if decision == "ALLOW":

            execution_result = execute_expense(
                expense_id,
                expense_data
            )

            expense.status = "COMPLETED"
            db.commit()

            return {
                "status": "COMPLETED",
                "message": execution_result["message"]
            }

        # Unknown decisions must fail closed
        expense.status = "BLOCKED"
        db.commit()

        return {
            "status": "BLOCKED",
            "message": "Unknown policy decision. Execution prevented."
        }

    except Exception:
        db.rollback()
        raise