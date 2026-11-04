
from fastapi import APIRouter, Depends, HTTPException
<<<<<<< HEAD
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.approval_service import (
    get_pending_approvals,
    get_approval
)
from app.services.agent_service import review_expense_approval


router = APIRouter(
    prefix="/api/v1/approvals",
    tags=["Approvals"]
)


class ApprovalReviewRequest(BaseModel):
    decision: str
    reviewed_by: str
    review_comment: str | None = None


@router.get("/pending")
def list_pending_approvals(
    db: Session = Depends(get_db)
):
    approvals = get_pending_approvals(db)

    return {
        "total": len(approvals),
        "approvals": [
            {
                "id": approval.id,
                "document_id": approval.document_id,
                "expense_id": approval.expense_id,
                "task_id": approval.task_id,
                "action_name": approval.action_name,
                "reason": approval.reason,
                "status": approval.status,
                "created_at": approval.created_at
            }
            for approval in approvals
        ]
    }


@router.post("/{approval_id}/review")
def review_approval(
    approval_id: int,
    request: ApprovalReviewRequest,
    db: Session = Depends(get_db)
):
    if request.decision.lower() not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Decision must be approved or rejected."
        )

    approval = get_approval(db, approval_id)

    if approval is None:
        raise HTTPException(
            status_code=404,
            detail="Approval request not found."
        )

    try:
        return review_expense_approval(
            db=db,
            approval_id=approval_id,
            decision=request.decision.lower(),
            reviewed_by=request.reviewed_by,
            review_comment=request.review_comment
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to process approval request."
        )
=======
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.expense import Expense
from app.services.approval_service import (
    get_pending_approvals,
    get_approval,
    review_approval
)
from app.services.execution_service import execute_expense

router = APIRouter(
    prefix="/api/v1/approvals",
    tags=["Human Approvals"]
)


@router.get("/pending")
def pending_approvals(db: Session = Depends(get_db)):
    approvals = get_pending_approvals(db)

    return [
        {
            "id": item.id,
            "expense_id": item.expense_id,
            "action_name": item.action_name,
            "reason": item.reason,
            "status": item.status
        }
        for item in approvals
    ]


@router.post("/{approval_id}/approve")
def approve_expense(
    approval_id: int,
    reviewer: dict,
    db: Session = Depends(get_db)
):
    approval = get_approval(db, approval_id)

    if approval is None:
        raise HTTPException(404, "Approval request not found.")

    expense = db.query(Expense).filter(
        Expense.expense_id == approval.expense_id
    ).first()

    if expense is None:
        raise HTTPException(404, "Related expense not found.")

    if expense.status != "PENDING_APPROVAL":
        raise HTTPException(400, "Expense is not awaiting approval.")

    try:
        reviewed = review_approval(
            db,
            approval_id,
            "approved",
            reviewer.get("reviewed_by", ""),
            reviewer.get("review_comment")
        )

        if reviewed is None:
            raise HTTPException(404, "Approval request not found.")

        execution = execute_expense(
            expense.expense_id,
            {
                "employee_name": expense.employee_name,
                "amount": expense.amount,
                "merchant": expense.merchant,
                "category": expense.category
            }
        )

        expense.status = "COMPLETED"
        db.commit()

        return {
            "message": "Expense approved and executed.",
            "expense_id": expense.expense_id,
            "status": expense.status,
            "execution": execution
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(400, str(e))

    except Exception:
        db.rollback()
        raise HTTPException(500, "Approval processing failed.")


@router.post("/{approval_id}/reject")
def reject_expense(
    approval_id: int,
    reviewer: dict,
    db: Session = Depends(get_db)
):
    approval = get_approval(db, approval_id)

    if approval is None:
        raise HTTPException(404, "Approval request not found.")

    expense = db.query(Expense).filter(
        Expense.expense_id == approval.expense_id
    ).first()

    if expense is None:
        raise HTTPException(404, "Related expense not found.")

    if expense.status != "PENDING_APPROVAL":
        raise HTTPException(400, "Expense is not awaiting approval.")

    try:
        review_approval(
            db,
            approval_id,
            "rejected",
            reviewer.get("reviewed_by", ""),
            reviewer.get("review_comment")
        )

        expense.status = "REJECTED"
        db.commit()

        return {
            "message": "Expense rejected. No execution performed.",
            "expense_id": expense.expense_id,
            "status": expense.status
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(400, str(e))

    except Exception:
        db.rollback()
        raise HTTPException(500, "Rejection processing failed.")
>>>>>>> parent of f6afb7d (Merge branch 'main' of https://github.com/Kron0975/Amazon)
