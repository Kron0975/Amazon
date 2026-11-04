from app.database.connection import SessionLocal
from app.models.policy import Policy

sample_policies = [
    {
        "policy_name": "Travel Expense Policy",
        "description": "Travel expenses above the approval threshold require human approval.",
        "expense_category": "Travel",
        "max_amount": 5000,
        "approval_threshold": 3000,
        "receipt_required": True
    },
    {
        "policy_name": "Food Expense Policy",
        "description": "Food expenses above the approval threshold require human approval.",
        "expense_category": "Food",
        "max_amount": 2000,
        "approval_threshold": 1000,
        "receipt_required": True
    },
    {
        "policy_name": "Accommodation Expense Policy",
        "description": "Accommodation expenses above the approval threshold require human approval.",
        "expense_category": "Accommodation",
        "max_amount": 8000,
        "approval_threshold": 5000,
        "receipt_required": True
    }
]

db = SessionLocal()

try:
    for item in sample_policies:
        existing = db.query(Policy).filter(
            Policy.expense_category == item["expense_category"]
        ).first()

        if existing:
            for key, value in item.items():
                setattr(existing, key, value)
            existing.is_active = True
            print("Updated policy:", item["expense_category"])
        else:
            db.add(Policy(**item))
            print("Added policy:", item["expense_category"])

    db.commit()
    print("\nSample policies saved successfully!")

except Exception:
    db.rollback()
    raise

finally:
    db.close()
