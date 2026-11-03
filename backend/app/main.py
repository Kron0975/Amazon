<<<<<<< Updated upstream
from fastapi import FastAPI
from app.routes.documents import router as documents_router


=======

from fastapi import FastAPI
from app.routes.agent import router as agent_router

>>>>>>> Stashed changes
app = FastAPI(
    title="Amazon Governed AI Healthcare Assistant",
    description="A human-supervised AI healthcare administration agent.",
    version="1.0.0"
)


<<<<<<< Updated upstream
# Register document routes
app.include_router(documents_router)


=======
>>>>>>> Stashed changes
@app.get("/")
def home():
    return {
        "message": "Amazon Governed AI Healthcare Assistant is running!",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


app.include_router(agent_router)
