from app.database.connection import SessionLocal
from app.models.document import Document
from app.models.task import AgentTask

from app.services.task_service import (
    create_task,
    get_task,
    get_all_tasks,
    update_task_status
)

db = SessionLocal()

try:
    task = create_task(
        db=db,
        task_name="Process Travel Expense Claim",
        task_type="expense_claim",
        document_id="test-doc-001"
    )

    print("1. Task created:", task.status)

    updated = update_task_status(
        db=db,
        task_id=task.id,
        new_status="processing"
    )

    print("2. Task updated:", updated.status)

    completed = update_task_status(
        db=db,
        task_id=task.id,
        new_status="completed",
        result="Expense claim processed successfully."
    )

    print("3. Task completed:", completed.status)

    retrieved = get_task(db, task.id)
    print("4. Retrieved task:", retrieved.task_name)

    all_tasks = get_all_tasks(db)
    print("5. Total tasks in database:", len(all_tasks))

finally:
    db.close()
