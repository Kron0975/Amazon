from app.database.connection import SessionLocal
from app.services.policy_service import check_expense_policy

test_cases = [
    {
        "name": "Allowed expense",
        "amount": 2000,
        "category": "Travel",
        "receipt_provided": True,
        "expected": "allowed"
    },
    {
        "name": "Approval required",
        "amount": 4000,
        "category": "Travel",
        "receipt_provided": True,
        "expected": "approval_required"
    },
    {
        "name": "Expense exceeds maximum",
        "amount": 6000,
        "category": "Travel",
        "receipt_provided": True,
        "expected": "blocked"
    },
    {
        "name": "Missing receipt",
        "amount": 500,
        "category": "Food",
        "receipt_provided": False,
        "expected": "blocked"
    },
    {
        "name": "Unknown category",
        "amount": 500,
        "category": "Shopping",
        "receipt_provided": True,
        "expected": "blocked"
    }
]

db = SessionLocal()
passed = 0

try:
    for index, test in enumerate(test_cases, start=1):
        result = check_expense_policy(
            db=db,
            amount=test["amount"],
            category=test["category"],
            receipt_provided=test["receipt_provided"]
        )

        success = result["decision"] == test["expected"]

        if success:
            passed += 1

        print(f"\nTest {index}: {test['name']}")
        print("Expected:", test["expected"])
        print("Actual:", result["decision"])
        print("Reason:", result["reason"])
        print("Result:", "PASS" if success else "FAIL")

    print(f"\nFinal result: {passed}/{len(test_cases)} tests passed.")

finally:
    db.close()
