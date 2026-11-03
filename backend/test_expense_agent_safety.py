from app.database.connection import SessionLocal
from app.models.document import Document
from app.services.expense_agent_service import process_expense_claim

db = SessionLocal()

try:
    document = db.query(Document).filter(
        Document.filename == "sample_travel_expense_receipt.pdf"
    ).first()

    if document is None:
        print("Test receipt not found.")
    else:
        test_cases = [
            (4000, "Travel", "approval_required"),
            (6000, "Travel", "blocked")
        ]

        for amount, category, expected in test_cases:
            print("\n" + "=" * 40)
            print(f"Testing amount: INR {amount}")

            result = process_expense_claim(
                db=db,
                document_id=document.document_id,
                amount=amount,
                category=category
            )

            print("Actual decision:", result["decision"])
            print("Expected decision:", expected)
            print("Test passed:", result["decision"] == expected)

            if "approval_id" in result:
                print("Approval ID:", result["approval_id"])
                print("Approval status:", result["approval_status"])

finally:
    db.close()
