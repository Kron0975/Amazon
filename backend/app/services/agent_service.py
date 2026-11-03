from app.services.execution_service import execute_expense
from app.services.approval_service import create_approval_request
from app.models.expense import Expense


def process_expense(db, expense_id: str, expense_data: dict):

    # STEP 1: Save expense
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
    db.commit()
    db.refresh(expense)

    # STEP 2: Temporary policy decision
    decision = "REQUIRE_APPROVAL"
    reason = "Expense requires human approval."

    # STEP 3: Create persistent approval request
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

    return {
        "status": "BLOCKED",
        "message": "Expense was not permitted."
    }