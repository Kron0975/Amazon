from app.database.connection import SessionLocal

# Load related database models
from app.models.document import Document
from app.models.approval import Approval

from app.services.approval_service import (
    create_approval_request,
    get_pending_approvals,
    review_approval
)

db = SessionLocal()

try:
    first = create_approval_request(
        db=db,
        document_id="test-doc-001",
        action_name="Submit Travel Expense",
        reason="Expense of Rs. 4000 requires human approval."
    )

    print("1. Approval request created:", first.status)

    second = create_approval_request(
        db=db,
        document_id="test-doc-001",
        action_name="Submit Accommodation Expense",
        reason="Expense requires manager review."
    )

    print("2. Second request created:", second.status)

    pending = get_pending_approvals(db)
    print("3. Pending approval requests:", len(pending))

    approved = review_approval(
        db=db,
        approval_id=first.id,
        decision="approved",
        reviewed_by="Test Manager",
        review_comment="Approved for demonstration."
    )

    print("4. First request:", approved.status)

    rejected = review_approval(
        db=db,
        approval_id=second.id,
        decision="rejected",
        reviewed_by="Test Manager",
        review_comment="Rejected for demonstration."
    )

    print("5. Second request:", rejected.status)

finally:
    db.close()
