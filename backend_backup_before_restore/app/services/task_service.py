from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.task import AgentTask


def create_task(
    db: Session,
    task_name: str,
    task_type: str,
    document_id: str = None
):
    task = AgentTask(
        task_name=task_name,
        task_type=task_type,
        document_id=document_id,
        status="pending"
    )

    try:
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
    except Exception:
        db.rollback()
        raise


def get_task(db: Session, task_id: int):
    return db.query(AgentTask).filter(
        AgentTask.id == task_id
    ).first()


def get_all_tasks(db: Session):
    return db.query(AgentTask).order_by(
        AgentTask.created_at.desc()
    ).all()


def update_task_status(
    db: Session,
    task_id: int,
    new_status: str,
    result: str = None,
    error_message: str = None
):
    allowed_statuses = {
        "pending",
        "processing",
        "waiting_approval",
        "completed",
        "failed"
    }

    if new_status not in allowed_statuses:
        raise ValueError("Invalid task status.")

    task = get_task(db, task_id)

    if task is None:
        return None

    if task.status in {"completed", "failed"}:
        raise ValueError("A finished task cannot be modified.")

    task.status = new_status
    task.result = result
    task.error_message = error_message

    if new_status in {"completed", "failed"}:
        task.completed_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(task)
        return task
    except Exception:
        db.rollback()
        raise
