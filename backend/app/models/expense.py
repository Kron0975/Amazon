from sqlalchemy import Column, String, Float, Text, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class Expense(Base):
    __tablename__ = "expenses"

    expense_id = Column(String(36), primary_key=True, index=True)
    employee_name = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    merchant = Column(String(150), nullable=False)
    expense_date = Column(String(30), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    status = Column(String(30), default="SUBMITTED", nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )