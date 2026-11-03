from sqlalchemy.orm import Session

from app.models.task import AgentTask
from app.models.approval import Approval
from app.models.agent_action import AgentAction


def get_evaluation_metrics(db: Session):

    total_tasks = db.query(AgentTask).count()

    completed_tasks = db.query(AgentTask).filter(
        AgentTask.status == "completed"
    ).count()

    failed_tasks = db.query(AgentTask).filter(
        AgentTask.status == "failed"
    ).count()

    pending_tasks = db.query(AgentTask).filter(
        AgentTask.status.in_(["pending", "processing", "waiting_approval"])
    ).count()

    total_approvals = db.query(Approval).count()

    approved_requests = db.query(Approval).filter(
        Approval.status == "approved"
    ).count()

    rejected_requests = db.query(Approval).filter(
        Approval.status == "rejected"
    ).count()

    pending_approvals = db.query(Approval).filter(
        Approval.status == "pending"
    ).count()

    total_actions = db.query(AgentAction).count()

    blocked_actions = db.query(AgentAction).filter(
        AgentAction.status == "blocked"
    ).count()

    policy_violations = db.query(AgentAction).filter(
        AgentAction.policy_check == "failed"
    ).count()

    completion_rate = (
        round((completed_tasks / total_tasks) * 100, 2)
        if total_tasks else 0
    )

    return {
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "failed": failed_tasks,
            "pending": pending_tasks,
            "completion_rate": completion_rate
        },
        "approvals": {
            "total": total_approvals,
            "approved": approved_requests,
            "rejected": rejected_requests,
            "pending": pending_approvals
        },
        "actions": {
            "total": total_actions,
            "blocked": blocked_actions,
            "policy_violations": policy_violations
        }
    }
