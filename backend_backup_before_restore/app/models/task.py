from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.connection import Base


class AgentTask(Base):
    __tablename__ = "agent_tasks"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        String(36),
        ForeignKey("documents.document_id"),
        nullable=True,
        index=True
    )

    task_name = Column(String(150), nullable=False)
    task_type = Column(String(50), nullable=False)

    status = Column(
        String(30),
        default="pending",
        nullable=False
    )

    result = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    completed_at = Column(DateTime(timezone=True), nullable=True)
