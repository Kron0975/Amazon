from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.approval import Approval


def create_approval_request(
    db: Session,
    expense_id: str,
    action_name: str,
    reason: str
):
    approval = Approval(
        expense_id=expense_id,
        action_name=action_name,
        reason=reason,
        status="pending"
    )

    try:
        db.add(approval)
        db.commit()
        db.refresh(approval)
        return approval
    except Exception:
        db.rollback()
        raise


def get_pending_approvals(db: Session):
    return db.query(Approval).filter(
        Approval.status == "pending"
    ).all()


def get_approval(db: Session, approval_id: int):
    return db.query(Approval).filter(
        Approval.id == approval_id
    ).first()


def review_approval(
    db: Session,
    approval_id: int,
    decision: str,
    reviewed_by: str,
    review_comment: str = None
):
    if decision not in ("approved", "rejected"):
        raise ValueError("Decision must be approved or rejected.")

    approval = get_approval(db, approval_id)

    if approval is None:
        return None

    if approval.status != "pending":
        raise ValueError("This approval request has already been reviewed.")

    if not reviewed_by or not reviewed_by.strip():
        raise ValueError("Reviewer identity is required.")

    approval.status = decision
    approval.reviewed_by = reviewed_by.strip()
    approval.review_comment = review_comment
    approval.reviewed_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(approval)
        return approval
    except Exception:
        db.rollback()
        raise