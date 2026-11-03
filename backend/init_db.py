from app.database.connection import Base, engine
from app.models.document import Document

# Create all database tables
Base.metadata.create_all(bind=engine)

print("Database created successfully!")
print("Documents table is ready!")
