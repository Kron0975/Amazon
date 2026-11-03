
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class Document(Base):

    __tablename__ = "documents"

    # Unique document ID
    document_id = Column(String(36), primary_key=True, index=True)

    # Original uploaded filename
    filename = Column(String(255), nullable=False)

    # Document format: pdf, docx, png, etc.
    file_type = Column(String(20), nullable=False)

    # File size in bytes
    file_size = Column(Integer, nullable=False)

    # Location where the document is stored
    storage_path = Column(String(500), nullable=False)

    # Document processing status
    status = Column(
        String(30),
        default="uploaded",
        nullable=False
    )

    # Upload timestamp
    upload_date = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
