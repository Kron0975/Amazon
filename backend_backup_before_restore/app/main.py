from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.documents import router as documents_router
from app.routes.expenses import router as expenses_router
from app.routes.approvals import router as approvals_router
from app.routes.evaluation import router as evaluation_router

app = FastAPI(
    title="Amazon Safe Agent",
    description="A policy-controlled AI agent for safe expense claim processing",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router)
app.include_router(expenses_router)
app.include_router(approvals_router)
app.include_router(evaluation_router)


@app.get("/")
def home():
    return {
        "message": "Amazon Safe Agent Backend is running!",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
