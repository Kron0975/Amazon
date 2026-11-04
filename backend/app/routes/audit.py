from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.agent_action import AgentAction

router = APIRouter(
    prefix="/api/v1/audit",
    tags=["Audit Trail"]
)


@router.get("/actions")
def list_audit_actions(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    limit = max(1, min(limit, 500))

    actions = (
        db.query(AgentAction)
        .order_by(AgentAction.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "total": len(actions),
        "actions": [
            {
                "id": action.id,
                "document_id": action.document_id,
                "action_name": action.action_name,
                "action_input": action.action_input,
                "action_output": action.action_output,
                "status": action.status,
                "policy_check": action.policy_check,
                "created_at": action.created_at.isoformat()
                    if action.created_at else None
            }
            for action in actions
        ]
    }
