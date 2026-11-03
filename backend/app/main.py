from fastapi import FastAPI
from app.routes.documents import router as documents_router


app = FastAPI(
    title="Amazon Document Review API",
    description="Backend for AI-powered document review and repair",
    version="1.0.0"
)


# Register document routes
app.include_router(documents_router)


@app.get("/")
def home():
    return {
        "message": "Amazon Document Review Backend is running!",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }