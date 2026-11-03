import os
import uuid

from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException


router = APIRouter(
    prefix="/api/v1/documents",
    tags=["Documents"]
)

# Supported document formats
ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".png",
    ".jpg",
    ".jpeg"
}

# Maximum file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Upload storage directory
UPLOAD_DIR = Path("storage/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):

    # Check filename
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename provided"
        )

    # Check file extension
    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format"
        )

    # Generate unique document ID
    document_id = str(uuid.uuid4())

    # Generate safe storage filename
    storage_filename = f"{document_id}{extension}"

    file_path = UPLOAD_DIR / storage_filename

    file_size = 0

    try:
        # Save file in chunks and enforce size limit
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

    return {
        "success": True,
        "document_id": document_id,
        "filename": file.filename,
        "file_type": extension.replace(".", ""),
        "file_size": file_size,
        "status": "uploaded"
    }