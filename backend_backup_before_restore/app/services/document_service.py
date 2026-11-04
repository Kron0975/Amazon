
from sqlalchemy.orm import Session

from app.models.document import Document


# 1. Save document information in database
def create_document(
    db: Session,
    document_id: str,
    filename: str,
    file_type: str,
    file_size: int,
    storage_path: str
):
    new_document = Document(
        document_id=document_id,
        filename=filename,
        file_type=file_type,
        file_size=file_size,
        storage_path=storage_path,
        status="uploaded"
    )

    try:
        db.add(new_document)
        db.commit()
        db.refresh(new_document)
        return new_document

    except Exception:
        db.rollback()
        raise


# 2. Retrieve document using its ID
def get_document(db: Session, document_id: str):
    return db.query(Document).filter(
        Document.document_id == document_id
    ).first()


# 3. Update document processing status
def update_document_status(
    db: Session,
    document_id: str,
    new_status: str
):
    document = get_document(db, document_id)

    if document is None:
        return None

    document.status = new_status

    try:
        db.commit()
        db.refresh(document)
        return document

    except Exception:
        db.rollback()
        raise
