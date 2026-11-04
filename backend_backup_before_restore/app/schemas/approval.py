from pydantic import BaseModel
from typing import Optional


class ApprovalReviewRequest(BaseModel):
    reviewed_by: str
    review_comment: Optional[str] = None


class ApprovalResponse(BaseModel):
    id: int
    expense_id: str
    action_name: str
    reason: str
    status: str
    reviewed_by: Optional[str] = None
    review_comment: Optional[str] = None