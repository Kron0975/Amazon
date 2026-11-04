from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.evaluation_service import get_evaluation_metrics


router = APIRouter(
    prefix="/api/v1/evaluation",
    tags=["Evaluation"]
)


@router.get("/metrics")
def evaluation_metrics(
    db: Session = Depends(get_db)
):
    return get_evaluation_metrics(db)
