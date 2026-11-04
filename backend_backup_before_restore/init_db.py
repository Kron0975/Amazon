from app.database.connection import Base, engine
# from app.models.document import Document
# from app.models.analysis import AnalysisResult
from app.models.expense import Expense
# from app.models.approval import Approval
from app.models.document import Document
from app.models.analysis import AnalysisResult
from app.models.policy import Policy
from app.models.approval import Approval
from app.models.agent_action import AgentAction
from app.models.task import AgentTask

Base.metadata.create_all(bind=engine)

print("Database initialized successfully!")
print("Documents table is ready!")
print("Analysis results table is ready!")
print("Policies table is ready!")
print("Approvals table is ready!")
print("Agent actions table is ready!")
print("Agent tasks table is ready!")
