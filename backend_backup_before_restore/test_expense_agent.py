from app.database.connection import SessionLocal
from app.models.document import Document
from app.services.expense_agent_service import process_expense_claim


db = SessionLocal()

try:
    document = db.query(Document).filter(
        Document.filename == "sample_travel_expense_receipt.pdf"
    ).first()

    if document is None:
        print("Test receipt not found. Upload the sample receipt first.")
    else:
        result = process_expense_claim(
            db=db,
            document_id=document.document_id,
            amount=2000,
            category="Travel"
        )

        print("\nEXPENSE AGENT TEST")
        print("==================")

        for key, value in result.items():
            print(f"{key}: {value}")

finally:
    db.close()
