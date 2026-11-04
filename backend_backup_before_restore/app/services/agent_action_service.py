from sqlalchemy.orm import Session
from app.models.agent_action import AgentAction


def log_agent_action(
    db: Session,
    document_id: str,
    action_name: str,
    status: str,
    action_input: str = None,
    action_output: str = None,
    policy_check: str = None
):
    action = AgentAction(
        document_id=document_id,
        action_name=action_name,
        status=status,
        action_input=action_input,
        action_output=action_output,
        policy_check=policy_check
    )

    try:
        db.add(action)
        db.commit()
        db.refresh(action)
        return action
    except Exception:
        db.rollback()
        raise


def get_document_actions(db: Session, document_id: str):
    return db.query(AgentAction).filter(
        AgentAction.document_id == document_id
    ).order_by(AgentAction.created_at.asc()).all()
