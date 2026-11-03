from app.database.connection import SessionLocal

# Load related database models
from app.models.document import Document
from app.models.agent_action import AgentAction

from app.services.agent_action_service import (
    log_agent_action,
    get_document_actions
)

db = SessionLocal()

try:
    log_agent_action(
        db=db,
        document_id="test-doc-001",
        action_name="Read Expense Receipt",
        status="success",
        action_input="sample_receipt.pdf",
        action_output="Receipt information extracted",
        policy_check="not_required"
    )

    log_agent_action(
        db=db,
        document_id="test-doc-001",
        action_name="Check Expense Policy",
        status="success",
        action_input="Travel expense: Rs. 4000",
        action_output="Human approval required",
        policy_check="passed"
    )

    log_agent_action(
        db=db,
        document_id="test-doc-001",
        action_name="Submit Expense",
        status="blocked",
        action_input="Travel expense: Rs. 6000",
        action_output="Action blocked due to maximum expense limit",
        policy_check="failed"
    )

    print("1. Three agent actions recorded successfully.")

    actions = get_document_actions(db, "test-doc-001")

    print("2. Total recorded actions:", len(actions))

    for action in actions:
        print(
            "Action:", action.action_name,
            "| Status:", action.status,
            "| Policy:", action.policy_check
        )

finally:
    db.close()
