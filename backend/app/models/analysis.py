from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.connection import Base


class AnalysisResult(Base):

    __tablename__ = "analysis_results"

    # Unique analysis record ID
    id = Column(Integer, primary_key=True, index=True)

    # Link analysis to its document
    document_id = Column(
        String(36),
        ForeignKey("documents.document_id"),
        nullable=False,
        index=True
    )

    # Type of detected issue
    issue_type = Column(String(100), nullable=False)

    # Explanation of the issue
    description = Column(Text, nullable=False)

    # Issue severity: low, medium or high
    severity = Column(String(20), nullable=False)

    # Recommended correction
    suggested_fix = Column(Text, nullable=True)

    # Analysis creation timestamp
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
