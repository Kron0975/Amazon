from fastapi import APIRouter, HTTPException
from uuid import uuid4

from app.schemas.expense import ExpenseCreate, ExpenseResponse
from app.services.agent_service import process_expense

router = APIRouter(prefix="/api/v1/expenses", tags=["Expenses"])


@router.post("/submit", response_model=ExpenseResponse)
def submit_expense(expense: ExpenseCreate):
    expense_id = str(uuid4())

    try:
        result = process_expense(expense_id, expense.model_dump())

        return ExpenseResponse(
            expense_id=expense_id,
            status=result["status"],
            message=result["message"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))