from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import uuid4

from app.schemas.expense import ExpenseCreate, ExpenseResponse
from app.services.agent_service import process_expense
from app.database.connection import get_db

router = APIRouter(
    prefix="/api/v1/expenses",
    tags=["Expenses"]
)


@router.post("/submit", response_model=ExpenseResponse)
def submit_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db)
):
    expense_id = str(uuid4())

    try:
        result = process_expense(
            db,
            expense_id,
            expense.model_dump()
        )

        return ExpenseResponse(
            expense_id=expense_id,
            status=result["status"],
            message=result["message"],
            approval_id=result.get("approval_id")
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )