from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.connection import Base


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        String(36),
        ForeignKey("documents.document_id"),
        nullable=False
    )

    action_name = Column(String(100), nullable=False)
    reason = Column(Text, nullable=False)

    status = Column(
        String(20),
        default="pending",
        nullable=False
    )

    reviewed_by = Column(String(100), nullable=True)
    review_comment = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    reviewed_at = Column(DateTime(timezone=True), nullable=True)
