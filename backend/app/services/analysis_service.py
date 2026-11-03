from sqlalchemy.orm import Session
from app.models.analysis import AnalysisResult


def create_analysis_result(
    db: Session,
    document_id: str,
    issue_type: str,
    description: str,
    severity: str,
    suggested_fix: str = None
):
    result = AnalysisResult(
        document_id=document_id,
        issue_type=issue_type,
        description=description,
        severity=severity,
        suggested_fix=suggested_fix
    )

    try:
        db.add(result)
        db.commit()
        db.refresh(result)
        return result
    except Exception:
        db.rollback()
        raise


def get_analysis_results(db: Session, document_id: str):
    return db.query(AnalysisResult).filter(
        AnalysisResult.document_id == document_id
    ).all()
