from app.database.connection import SessionLocal
from app.services.document_service import (
    create_document,
    get_document,
    update_document_status
)

db = SessionLocal()

try:
    sample = create_document(
        db=db,
        document_id="test-doc-001",
        filename="sample.pdf",
        file_type="pdf",
        file_size=245678,
        storage_path="storage/uploads/sample.pdf"
    )

    print("1. Document saved:", sample.filename)

    document = get_document(db, "test-doc-001")

    print("2. Document retrieved:", document.filename)
    print("3. Current status:", document.status)

    updated = update_document_status(
        db,
        "test-doc-001",
        "processing"
    )

    print("4. Updated status:", updated.status)

finally:
    db.close()
