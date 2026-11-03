from app.database.connection import SessionLocal
from app.services.expense_agent_service import review_expense_approval

db = SessionLocal()

try:
    result = review_expense_approval(
        db=db,
        approval_id=3,
        decision="approved",
        reviewed_by="Test Reviewer",
        review_comment="Approved for testing."
    )

    print("\nAPPROVAL RESUME TEST")
    print("===================")

    for key, value in result.items():
        print(f"{key}: {value}")

finally:
    db.close()
