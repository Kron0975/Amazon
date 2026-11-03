from app.database.connection import SessionLocal
from app.models.document import Document
from app.services.expense_agent_service import process_expense_claim

db = SessionLocal()

try:
    document = db.query(Document).filter(
        Document.filename == "sample_travel_expense_receipt.pdf"
    ).first()

    result = process_expense_claim(
        db=db,
        document_id=document.document_id,
        amount=4000,
        category="Travel"
    )

    print("NEW APPROVAL:", result.get("approval_id"))
    print("STATUS:", result.get("approval_status"))

finally:
    db.close()
