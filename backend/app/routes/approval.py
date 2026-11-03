
from fastapi import APIRouter, Depends, HTTPException
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
