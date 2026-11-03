from pydantic import BaseModel, Field
from typing import Optional


class ExpenseCreate(BaseModel):
    employee_name: str = Field(min_length=2)
    amount: float = Field(gt=0)
    merchant: str = Field(min_length=2)
    expense_date: str
    category: str
    description: Optional[str] = None


class ExpenseResponse(BaseModel):
    expense_id: str
    status: str
    message: str