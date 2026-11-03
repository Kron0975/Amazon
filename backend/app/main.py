from fastapi import FastAPI

# Create FastAPI application
app = FastAPI(
    title="Amazon Document Review API",
    description="Backend for AI-powered document review and repair",
    version="1.0.0"
)


# Home endpoint
@app.get("/")
def home():
    return {
        "message": "Amazon Document Review Backend is running!",
        "status": "success"
    }


# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }