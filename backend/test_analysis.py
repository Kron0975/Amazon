from app.database.connection import SessionLocal
from app.models.document import Document
from app.models.analysis import AnalysisResult

from app.services.analysis_service import (
    create_analysis_result,
    get_analysis_results
)

db = SessionLocal()

try:
    result = create_analysis_result(
        db=db,
        document_id="test-doc-001",
        issue_type="Missing Information",
        description="The sample document is missing a required date.",
        severity="medium",
        suggested_fix="Add the missing date to the document."
    )

    print("1. Analysis result saved:", result.issue_type)

    results = get_analysis_results(db, "test-doc-001")

    print("2. Analysis results retrieved:", len(results))

    for item in results:
        print("3. Issue:", item.description)
        print("4. Suggested fix:", item.suggested_fix)

finally:
    db.close()
