import os
import uuid

from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.services.pdf_extractor import extract_text_from_pdf
from app.services.document_service import create_document
from app.database.connection import get_db

router = APIRouter(
    prefix="/api/v1/documents",
    tags=["Documents"]
)

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg"
}

MAX_FILE_SIZE = 10 * 1024 * 1024

UPLOAD_DIR = Path("storage/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename provided"
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format"
        )

    document_id = str(uuid.uuid4())
    storage_filename = f"{document_id}{extension}"
    file_path = UPLOAD_DIR / storage_filename

    file_size = 0

    try:
        with open(file_path, "wb") as uploaded_file:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                file_size += len(chunk)

                if file_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="File size exceeds 10 MB limit"
                    )

                uploaded_file.write(chunk)

        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )

    except Exception:
        if file_path.exists():
            os.remove(file_path)
        raise

    finally:
        await file.close()

    try:
        document = create_document(
            db=db,
            document_id=document_id,
            filename=file.filename,
            file_type=extension.replace(".", ""),
            file_size=file_size,
            storage_path=str(file_path)
        )

    except Exception:
        if file_path.exists():
            os.remove(file_path)

        raise HTTPException(
            status_code=500,
            detail="Could not save document details to database."
        )

    return {
        "success": True,
        "document_id": document.document_id,
        "filename": document.filename,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "status": document.status
    }


@router.get("/{document_id}/extract")
async def extract_document_text(document_id: str):

    matching_files = list(
        UPLOAD_DIR.glob(f"{document_id}.pdf")
    )

    if not matching_files:
        raise HTTPException(
            status_code=404,
            detail="PDF document not found"
        )

    file_path = matching_files[0]

    try:
        extracted_text = extract_text_from_pdf(str(file_path))

        if not extracted_text:
            raise HTTPException(
                status_code=422,
                detail="No readable text found in this PDF"
            )

        return {
            "success": True,
            "document_id": document_id,
            "extracted_text": extracted_text
        }

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error)
        )
