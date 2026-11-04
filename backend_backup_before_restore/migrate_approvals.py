from sqlalchemy import inspect

from app.database.connection import Base, engine

# Import all models so SQLAlchemy knows their tables.
from app.models.document import Document
from app.models.analysis import AnalysisResult
from app.models.expense import Expense
from app.models.approval import Approval


def migrate_database():

    inspector = inspect(engine)
    tables = inspector.get_table_names()

    if "approvals" in tables:
        columns = [
            column["name"]
            for column in inspector.get_columns("approvals")
        ]

        if "document_id" in columns and "expense_id" not in columns:

            if "approvals_legacy" in tables:
                raise RuntimeError(
                    "Legacy approval table already exists. "
                    "Please inspect the database before migrating."
                )

            print("Preserving old approval records...")

            with engine.begin() as connection:
                connection.exec_driver_sql(
                    "ALTER TABLE approvals RENAME TO approvals_legacy"
                )

    # Create missing tables using the current models.
    Base.metadata.create_all(bind=engine)

    print("Database migration completed successfully.")


if __name__ == "__main__":
    migrate_database()