from app.database.connection import Base, engine
from app.models.document import Document
from app.models.analysis import AnalysisResult

# Create all database tables
Base.metadata.create_all(bind=engine)

print("Database created successfully!")
print("Documents table is ready!")
print("Analysis results table is ready!")
