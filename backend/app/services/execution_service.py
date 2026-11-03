from datetime import datetime
from uuid import uuid4


def execute_expense(expense_id: str, expense_data: dict):
    return {
        "transaction_id": str(uuid4()),
        "expense_id": expense_id,
        "execution_status": "SUCCESS",
        "executed_at": datetime.now().isoformat(),
        "message": "Expense claim successfully submitted to the mock system."
    }