from sqlalchemy.orm import Session

from app.models.document import Document

from app.services.policy_service import check_expense_policy
from app.services.approval_service import create_approval_request
from app.services.agent_action_service import log_agent_action
from app.services.task_service import create_task, update_task_status


def process_expense_claim(
    db: Session,
    document_id: str,
    amount: float,
    category: str
):
    """
    Process an expense claim using existing policy,
    approval, action logging and task services.

    This workflow does not submit or pay claims.
    It only marks permitted claims as ready for submission.
    """

    # Step 1: Verify that the uploaded receipt exists.
    document = db.query(Document).filter(
        Document.document_id == document_id
    ).first()

    if document is None:
        return {
            "success": False,
            "decision": "blocked",
            "reason": "Receipt document was not found."
        }

    # Step 2: Create and start the agent task.
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

    # Step 3: Check the expense against active policies.
    policy_result = check_expense_policy(
        db=db,
        amount=amount,
        category=category,
        receipt_provided=True
    )

    decision = policy_result["decision"]
    reason = policy_result["reason"]

    # Step 4: Handle a blocked expense.
    if decision == "blocked":

        log_agent_action(
            db=db,
            document_id=document_id,
            action_name="Check expense policy",
            status="blocked",
            action_input=f"Amount: {amount}, Category: {category}",
            action_output=reason,
            policy_check="blocked"
        )

        update_task_status(
            db=db,
            task_id=task.id,
            new_status="completed",
            result=f"Expense blocked: {reason}"
        )

        return {
            "success": True,
            "task_id": task.id,
            "document_id": document_id,
            "decision": "blocked",
            "reason": reason,
            "policy_id": policy_result["policy_id"]
        }

    # Step 5: Handle expenses requiring human approval.
    if decision == "approval_required":

        approval = create_approval_request(
            db=db,
            document_id=document_id,
            action_name="Mark expense ready for submission",
            reason=reason
        )

        log_agent_action(
            db=db,
            document_id=document_id,
            action_name="Request human approval",
            status="waiting_approval",
            action_input=f"Amount: {amount}, Category: {category}",
            action_output=f"Approval request ID: {approval.id}",
            policy_check="passed"
        )

        update_task_status(
            db=db,
            task_id=task.id,
            new_status="waiting_approval",
            result="Waiting for human approval."
        )

        return {
            "success": True,
            "task_id": task.id,
            "document_id": document_id,
            "decision": "approval_required",
            "reason": reason,
            "approval_id": approval.id,
            "approval_status": approval.status
        }

    # Step 6: Handle an allowed expense.
    if decision == "allowed":

        log_agent_action(
            db=db,
            document_id=document_id,
            action_name="Check expense policy",
            status="success",
            action_input=f"Amount: {amount}, Category: {category}",
            action_output="Expense passed policy checks.",
            policy_check="passed"
        )

        log_agent_action(
            db=db,
            document_id=document_id,
            action_name="Mark expense ready for submission",
            status="success",
            action_input=f"Document ID: {document_id}",
            action_output="Expense is ready for human submission.",
            policy_check="passed"
        )

        update_task_status(
            db=db,
            task_id=task.id,
            new_status="completed",
            result="Expense passed policy checks and is ready for submission."
        )

        return {
            "success": True,
            "task_id": task.id,
            "document_id": document_id,
            "decision": "allowed",
            "reason": reason,
            "policy_id": policy_result["policy_id"],
            "status": "ready_for_submission"
        }

    # Fail closed if the policy service returns an unexpected decision.
    update_task_status(
        db=db,
        task_id=task.id,
        new_status="failed",
        error_message="Unexpected policy decision."
    )

    return {
        "success": False,
        "task_id": task.id,
        "decision": "blocked",
        "reason": "Unexpected policy decision. No action was executed."
    }


def review_expense_approval(
    db: Session,
    approval_id: int,
    decision: str,
    reviewed_by: str,
    review_comment: str = None
):
    """
    Review a pending expense approval and safely resume its task.
    """

    from app.services.approval_service import (
        get_approval,
        review_approval
    )
    from app.models.task import AgentTask

    # Find the approval request.
    approval = get_approval(db, approval_id)

    if approval is None:
        raise ValueError("Approval request not found.")

    if approval.action_name != "Mark expense ready for submission":
        raise ValueError("This is not an expense-agent approval.")

    # Find the task waiting for this approval.
    task = db.query(AgentTask).filter(
        AgentTask.document_id == approval.document_id,
        AgentTask.task_type == "expense_claim",
        AgentTask.status == "waiting_approval"
    ).order_by(AgentTask.id.desc()).first()

    if task is None:
        raise ValueError("No waiting expense task found for this approval.")

    # Record the human decision.
    reviewed = review_approval(
        db=db,
        approval_id=approval_id,
        decision=decision,
        reviewed_by=reviewed_by,
        review_comment=review_comment
    )

    # Human approved the expense.
    if decision == "approved":

        log_agent_action(
            db=db,
            document_id=approval.document_id,
            action_name="Human approval received",
            status="success",
            action_input=f"Approval ID: {approval_id}",
            action_output=f"Approved by {reviewed_by}. Expense is ready for submission.",
            policy_check="passed"
        )

        update_task_status(
            db=db,
            task_id=task.id,
            new_status="completed",
            result="Human approved the expense. It is ready for submission."
        )

        return {
            "success": True,
            "decision": "approved",
            "approval_id": approval_id,
            "task_id": task.id,
            "status": "ready_for_submission"
        }

    # Human rejected the expense.
    if decision == "rejected":

        log_agent_action(
            db=db,
            document_id=approval.document_id,
            action_name="Human approval rejected",
            status="rejected",
            action_input=f"Approval ID: {approval_id}",
            action_output=f"Rejected by {reviewed_by}. No submission was performed.",
            policy_check="passed"
        )

        update_task_status(
            db=db,
            task_id=task.id,
            new_status="completed",
            result="Human rejected the expense. Submission was not performed."
        )

        return {
            "success": True,
            "decision": "rejected",
            "approval_id": approval_id,
            "task_id": task.id,
            "status": "stopped"
        }
