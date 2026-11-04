from app.database.connection import SessionLocal
from app.models.task import AgentTask
from app.models.approval import Approval
from app.models.agent_action import AgentAction

from app.services.evaluation_service import get_evaluation_metrics

db = SessionLocal()

try:
    metrics = get_evaluation_metrics(db)

    print("\n========== EVALUATION DASHBOARD ==========")

    print("\nTASK METRICS")
    print("Total tasks:", metrics["tasks"]["total"])
    print("Completed:", metrics["tasks"]["completed"])
    print("Failed:", metrics["tasks"]["failed"])
    print("Pending:", metrics["tasks"]["pending"])
    print("Completion rate:", metrics["tasks"]["completion_rate"], "%")

    print("\nAPPROVAL METRICS")
    print("Total approvals:", metrics["approvals"]["total"])
    print("Approved:", metrics["approvals"]["approved"])
    print("Rejected:", metrics["approvals"]["rejected"])
    print("Pending:", metrics["approvals"]["pending"])

    print("\nACTION METRICS")
    print("Total actions:", metrics["actions"]["total"])
    print("Blocked actions:", metrics["actions"]["blocked"])
    print("Policy violations:", metrics["actions"]["policy_violations"])

    print("\n==========================================")

finally:
    db.close()
