import json

from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.expense import Expense
from app.models.task import AgentTask

from app.services.policy_service import check_expense_policy
from app.services.approval_service import (
    create_approval_request,
    get_approval,
    review_approval
)
from app.services.agent_action_service import log_agent_action
from app.services.task_service import (
    create_task,
    update_task_status
)
from app.services.execution_service import execute_expense


APPROVAL_ACTION = "SUBMIT_EXPENSE"


def process_expense(db: Session, expense_id: str, expense_data: dict):
    document_id = expense_data["document_id"]

    try:
        # 1. Verify receipt
        document = db.query(Document).filter(
            Document.document_id == document_id
        ).first()

        if document is None:
            raise ValueError("Uploaded receipt was not found.")

        # 2. Save expense
        expense = Expense(
            expense_id=expense_id,
            document_id=document_id,
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

        # 3. Create agent task
        task = create_task(
            db=db,
            task_name="Process expense claim",
            task_type="expense_claim",
            document_id=document_id
        )

        update_task_status(
            db=db,
            task_id=task.id,
            new_status="processing"
        )

        task_payload = {
            "expense_id": expense_id,
            "expense_data": expense_data
        }

        # 4. Check actual policy
        policy_result = check_expense_policy(
            db=db,
            amount=expense_data["amount"],
            category=expense_data["category"],
            receipt_provided=True
        )

        decision = policy_result["decision"]
        reason = policy_result["reason"]

        # 5. Block prohibited expenses
        if decision == "blocked":
            expense.status = "BLOCKED"

            log_agent_action(
                db=db,
                document_id=document_id,
                action_name="Check expense policy",
                status="blocked",
                action_input=json.dumps(task_payload),
                action_output=reason,
                policy_check="blocked"
            )

            update_task_status(
                db=db,
                task_id=task.id,
                new_status="completed",
                result=json.dumps({
                    **task_payload,
                    "decision": "blocked",
                    "reason": reason
                })
            )

            db.commit()

            return {
                "status": "BLOCKED",
                "message": reason
            }

        # 6. Request human approval
        if decision == "approval_required":
            expense.status = "PENDING_APPROVAL"

            update_task_status(
                db=db,
                task_id=task.id,
                new_status="waiting_approval",
                result=json.dumps({
                    **task_payload,
                    "decision": "approval_required",
                    "reason": reason
                })
            )

            approval = create_approval_request(
                db=db,
                document_id=document_id,
                expense_id=expense_id,
                task_id=task.id,
                action_name=APPROVAL_ACTION,
                reason=reason
            )

            log_agent_action(
                db=db,
                document_id=document_id,
                action_name="Request human approval",
                status="waiting_approval",
                action_input=f"Expense ID: {expense_id}",
                action_output=f"Approval ID: {approval.id}",
                policy_check="passed"
            )

            db.commit()

            return {
                "status": "PENDING_APPROVAL",
                "message": reason,
                "approval_id": approval.id
            }

        # 7. Execute allowed expenses
        if decision == "allowed":
            execution_result = execute_expense(
                expense_id,
                expense_data
            )

            expense.status = "COMPLETED"

            log_agent_action(
                db=db,
                document_id=document_id,
                action_name="Check expense policy",
                status="success",
                action_input=f"Expense ID: {expense_id}",
                action_output="Expense passed policy checks.",
                policy_check="passed"
            )

            log_agent_action(
                db=db,
                document_id=document_id,
                action_name="Execute expense submission",
                status="success",
                action_input=f"Expense ID: {expense_id}",
                action_output=json.dumps(execution_result),
                policy_check="passed"
            )

            update_task_status(
                db=db,
                task_id=task.id,
                new_status="completed",
                result=json.dumps({
                    **task_payload,
                    "decision": "allowed",
                    "execution": execution_result
                })
            )

            db.commit()

            return {
                "status": "COMPLETED",
                "message": execution_result["message"]
            }

        # 8. Unknown decisions fail closed
        expense.status = "BLOCKED"

        log_agent_action(
            db=db,
            document_id=document_id,
            action_name="Reject unknown policy decision",
            status="blocked",
            action_input=f"Expense ID: {expense_id}",
            action_output="Unknown decision. Execution prevented.",
            policy_check="blocked"
        )

        update_task_status(
            db=db,
            task_id=task.id,
            new_status="failed",
            error_message="Unknown policy decision."
        )

        db.commit()

        return {
            "status": "BLOCKED",
            "message": "Unknown policy decision. Execution prevented."
        }

    except Exception:
        db.rollback()
        raise


def review_expense_approval(
    db: Session,
    approval_id: int,
    decision: str,
    reviewed_by: str,
    review_comment: str = None
):
    if decision not in ("approved", "rejected"):
        raise ValueError("Decision must be approved or rejected.")

    try:
        # 1. Find approval
        approval = get_approval(db, approval_id)

        if approval is None:
            raise ValueError("Approval request not found.")

        if not approval.expense_id or not approval.task_id:
            raise ValueError("Approval is not linked to an expense task.")

        if approval.action_name != APPROVAL_ACTION:
            raise ValueError("Invalid expense approval action.")

        # 2. Find exact expense and task
        expense = db.query(Expense).filter(
            Expense.expense_id == approval.expense_id
        ).first()

        task = db.query(AgentTask).filter(
            AgentTask.id == approval.task_id,
            AgentTask.status == "waiting_approval"
        ).first()

        if expense is None or task is None:
            raise ValueError("Associated expense or waiting task not found.")

        saved_result = json.loads(task.result or "{}")
        expense_data = saved_result.get("expense_data")

        if not expense_data:
            raise ValueError("Saved expense data is missing.")

        # 3. Record human decision
        reviewed = review_approval(
            db=db,
            approval_id=approval_id,
            decision=decision,
            reviewed_by=reviewed_by,
            review_comment=review_comment
        )

        if reviewed is None:
            raise ValueError("Approval request not found.")

        # 4. Rejection: never execute
        if decision == "rejected":
            expense.status = "REJECTED"

            log_agent_action(
                db=db,
                document_id=expense.document_id,
                action_name="Human approval rejected",
                status="rejected",
                action_input=f"Approval ID: {approval_id}",
                action_output=f"Rejected by {reviewed_by}. No execution performed.",
                policy_check="passed"
            )

            update_task_status(
                db=db,
                task_id=task.id,
                new_status="completed",
                result=json.dumps({
                    **saved_result,
                    "decision": "rejected",
                    "reason": review_comment
                })
            )

            db.commit()

            return {
                "success": True,
                "decision": "rejected",
                "approval_id": approval_id,
                "task_id": task.id,
                "status": "stopped"
            }

        # 5. Approval: execute mock submission
        execution_result = execute_expense(
            expense.expense_id,
            expense_data
        )

        expense.status = "COMPLETED"

        log_agent_action(
            db=db,
            document_id=expense.document_id,
            action_name="Human approval received",
            status="success",
            action_input=f"Approval ID: {approval_id}",
            action_output=f"Approved by {reviewed_by}.",
            policy_check="passed"
        )

        log_agent_action(
            db=db,
            document_id=expense.document_id,
            action_name="Execute approved expense submission",
            status="success",
            action_input=f"Expense ID: {expense.expense_id}",
            action_output=json.dumps(execution_result),
            policy_check="passed"
        )

        update_task_status(
            db=db,
            task_id=task.id,
            new_status="completed",
            result=json.dumps({
                **saved_result,
                "decision": "approved",
                "execution": execution_result
            })
        )

        db.commit()

        return {
            "success": True,
            "decision": "approved",
            "approval_id": approval_id,
            "task_id": task.id,
            "status": "COMPLETED",
            "message": execution_result["message"]
        }

    except Exception:
        db.rollback()
        raise
