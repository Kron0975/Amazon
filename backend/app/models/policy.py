from sqlalchemy import Column, Integer, String, Boolean, Float, Text
from app.database.connection import Base


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)

    policy_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    expense_category = Column(String(50), nullable=False)

    max_amount = Column(Float, nullable=True)
    approval_threshold = Column(Float, nullable=True)

    receipt_required = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
