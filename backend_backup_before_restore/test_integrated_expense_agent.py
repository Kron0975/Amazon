from uuid import uuid4

from app.database.connection import SessionLocal
from app.models.document import Document
from app.models.expense import Expense
from app.models.approval import Approval
from app.models.task import AgentTask
from app.models.agent_action import AgentAction

from app.services.agent_service import (
    process_expense,
    review_expense_approval
)


db = SessionLocal()


def submit_test_expense(amount):
    document = db.query(Document).filter(
        Document.filename == "sample_travel_expense_receipt.pdf"
    ).first()

    if document is None:
        raise RuntimeError("Sample receipt not found.")

    expense_id = str(uuid4())

    expense_data = {
        "document_id": document.document_id,
        "employee_name": "Safety Test Employee",
        "amount": amount,
        "merchant": "ABC Travels",
        "expense_date": "2026-11-03",
        "category": "Travel",
        "description": "Automated safety test"
    }

    result = process_expense(db, expense_id, expense_data)

    return expense_id, document.document_id, result


try:
    print("\n1. ALLOWED EXPENSE TEST")
    expense_id, document_id, result = submit_test_expense(2000)
    print(result)
    assert result["status"] == "COMPLETED"

    expense = db.query(Expense).filter(
        Expense.expense_id == expense_id
    ).first()
    assert expense.status == "COMPLETED"
    print("PASSED: Allowed expense executed.")

    print("\n2. APPROVAL REQUIRED TEST")
    expense_id, document_id, result = submit_test_expense(4000)
    print(result)
    assert result["status"] == "PENDING_APPROVAL"

    approval_id = result["approval_id"]
    approval = db.query(Approval).filter(
        Approval.id == approval_id
    ).first()
    assert approval.status == "pending"
    print("PASSED: Expense waits for human approval.")

    print("\n3. BLOCKED EXPENSE TEST")
    expense_id, document_id, result = submit_test_expense(6000)
    print(result)
    assert result["status"] == "BLOCKED"

    expense = db.query(Expense).filter(
        Expense.expense_id == expense_id
    ).first()
    assert expense.status == "BLOCKED"
    print("PASSED: Prohibited expense was blocked.")

    print("\n4. HUMAN APPROVAL TEST")
    expense_id, document_id, result = submit_test_expense(4000)
    approval_id = result["approval_id"]

    result = review_expense_approval(
        db=db,
        approval_id=approval_id,
        decision="approved",
        reviewed_by="Safety Test Reviewer",
        review_comment="Approved for integration testing."
    )
    print(result)
    assert result["status"] == "COMPLETED"

    expense = db.query(Expense).filter(
        Expense.expense_id == expense_id
    ).first()
    assert expense.status == "COMPLETED"
    print("PASSED: Approved expense executed.")

    print("\n5. HUMAN REJECTION TEST")
    expense_id, document_id, result = submit_test_expense(4000)
    approval_id = result["approval_id"]

    result = review_expense_approval(
        db=db,
        approval_id=approval_id,
        decision="rejected",
        reviewed_by="Safety Test Reviewer",
        review_comment="Rejected for safety testing."
    )
    print(result)
    assert result["status"] == "stopped"

    expense = db.query(Expense).filter(
        Expense.expense_id == expense_id
    ).first()
    assert expense.status == "REJECTED"

    execution_action = db.query(AgentAction).filter(
        AgentAction.document_id == document_id,
        AgentAction.action_name == "Execute approved expense submission"
    ).count()

    print("PASSED: Rejected expense was stopped.")

    print("\nALL FIVE INTEGRATION SCENARIOS PASSED.")

except Exception as error:
    db.rollback()
    print("\nINTEGRATION TEST FAILED:")
    print(type(error).__name__, str(error))
    raise

finally:
    db.close()
