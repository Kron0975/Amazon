from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.routes.documents import router as documents_router
from app.routes.expenses import router as expenses_router
from app.routes.approvals import router as approvals_router
from app.routes.evaluation import router as evaluation_router
from app.routes.audit import router as audit_router

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
app.include_router(audit_router)

FRONTEND_DIR = Path(__file__).resolve().parents[2] / "governed-ai-agent"

app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")

@app.get("/")
def home():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/login.html")
def login_page():
    return FileResponse(FRONTEND_DIR / "login.html")

@app.get("/register.html")
def register_page():
    return FileResponse(FRONTEND_DIR / "register.html")

@app.get("/health")
def health_check():
    return {"status": "healthy"}
