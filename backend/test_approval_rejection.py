from app.database.connection import SessionLocal
from app.services.expense_agent_service import review_expense_approval

db = SessionLocal()

try:
    result = review_expense_approval(
        db=db,
        approval_id=4,
        decision="rejected",
        reviewed_by="Test Reviewer",
        review_comment="Rejected for safety testing."
    )

    print("\nAPPROVAL REJECTION TEST")
    print("=======================")

    for key, value in result.items():
        print(f"{key}: {value}")

finally:
    db.close()
