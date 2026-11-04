from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.connection import Base


class AgentAction(Base):
    __tablename__ = "agent_actions"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(
        String(36),
        ForeignKey("documents.document_id"),
        nullable=False,
        index=True
    )

    action_name = Column(String(100), nullable=False)

    action_input = Column(Text, nullable=True)
    action_output = Column(Text, nullable=True)

    status = Column(
        String(30),
        nullable=False
    )

    policy_check = Column(String(30), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
