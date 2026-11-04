# Amazon | Governed AI Agent

### An AI agent that executes real-world tasks while staying within predefined policies, safety boundaries, and human supervision.

<p align="center">
  <b>Autonomous Execution • Policy Enforcement • Human Approval • AI Evaluation</b>
</p>

---

## 📌 About the Project

Amazon is a Governed AI Agent developed to demonstrate how artificial intelligence can perform real-world, multi-step tasks without compromising safety, control, and accountability.

Unlike conventional AI chatbots that primarily generate responses, our system focuses on task execution.

The agent is designed to understand user requests, break them into actionable steps, validate its proposed actions against predefined policies, and execute permitted operations.

However, not every action should be performed autonomously.

Our system introduces an independent policy enforcement mechanism and a human-in-the-loop approval process to ensure that restricted or sensitive operations cannot proceed without proper authorization.

The project combines autonomous task execution with deterministic governance and measurable evaluation.

---

## 🎯 Problem Statement

Build an agent that finishes a real multi-step task (admissions or administrative forms, travel booking, expense claims) and prove it is safe.

The solution must include:

* **Policy Rules:** Rules that the AI agent cannot break or override.
* **Evaluation Dashboard:** A dashboard to measure task completion, policy compliance, and agent performance.
* **Human Approval:** A human-approval mechanism for risky actions.

Our implementation focuses on demonstrating these requirements through a governed expense-claim processing workflow.

---

## 💡 Our Approach

We are developing an AI-powered expense management agent that can process expense claims while following predefined organizational policies.

The system evaluates submitted expense information, checks applicable rules, determines whether an operation is permitted, and identifies when human intervention is necessary.

The agent is not given unrestricted execution authority.

Instead, an independent policy engine validates operations before they are allowed to proceed.

### Core Execution Workflow

```text
             USER REQUEST
                   |
                   v
              AI AGENT
                   |
                   v
             TASK PLANNING
                   |
                   v
           POLICY VALIDATION
                   |
          +--------+--------+
          |                 |
          v                 v
       BLOCKED            VALID
          |                 |
          v                 v
      LOG REASON       RISK ASSESSMENT
                            |
                   +--------+--------+
                   |                 |
                   v                 v
             APPROVAL NEEDED     SAFE ACTION
                   |                 |
                   v                 |
              HUMAN REVIEW           |
                   |                 |
             +-----+-----+           |
             |           |           |
             v           v           |
           APPROVE     REJECT        |
             |           |           |
             v           v           |
          EXECUTE      BLOCKED        |
             |                       |
             +-----------+-----------+
                         |
                         v
                  TASK EVALUATION
                         |
                         v
                    AUDIT LOG
                         |
                         v
                   FINAL RESULT
```

---

## ✨ Key Features

### 1. AI Agent Execution

The agent is designed to:

* Understand natural-language instructions.
* Identify the objective of a task.
* Break complex requests into smaller steps.
* Plan task execution.
* Interact with authorized backend operations.
* Track task progress and results.

### 2. Policy Enforcement Engine

The policy engine provides a deterministic safety layer independent of AI-generated decisions.

Current development includes expense policy validation.

The validation logic considers:

* Expense amount.
* Expense category.
* Receipt availability.
* Predefined organizational policies.

The engine is designed to:

* Allow valid operations.
* Block policy violations.
* Identify requests requiring additional authorization.
* Return structured decisions and explanations.

**Core principle:** The AI agent cannot override the policy engine.

### 3. Human-in-the-Loop Approval

Not every operation should be executed automatically.

Our approval mechanism is designed to:

* Identify risky or sensitive actions.
* Pause execution when authorization is required.
* Present pending requests for human review.
* Allow authorized humans to approve or reject operations.
* Record approval decisions.

### 4. Evaluation Dashboard

The dashboard provides visibility into agent behaviour and system performance.

The intended evaluation metrics include:

| Metric            | Purpose                                 |
| ----------------- | --------------------------------------- |
| Total Tasks       | Number of tasks submitted               |
| Completed Tasks   | Successfully executed tasks             |
| Failed Tasks      | Unsuccessful task executions            |
| Blocked Actions   | Operations prevented by policy rules    |
| Policy Violations | Detected policy violations              |
| Pending Approvals | Actions awaiting human decisions        |
| Approval History  | Previously approved or rejected actions |

### 5. Audit Trail

The system is designed to maintain a record of important operations.

This includes:

* Task submissions.
* Policy validation results.
* Agent decisions.
* Approval requests.
* Human decisions.
* Execution results.

The audit trail helps demonstrate what the agent attempted, what was permitted, and what actually happened.

---

## 🏗️ System Architecture

The application is divided into independent components.

| Component          | Responsibility                                 |
| ------------------ | ---------------------------------------------- |
| Frontend Dashboard | User interface and task monitoring             |
| Backend API        | Handles requests and application communication |
| AI Agent           | Understands instructions and plans tasks       |
| Policy Engine      | Validates operations against predefined rules  |
| Approval System    | Manages human authorization                    |
| Execution Engine   | Performs permitted operations                  |
| Evaluation Engine  | Measures task performance and safety           |
| Database           | Stores policies, tasks, and execution records  |

### Governance Architecture

The project follows a separation-of-responsibilities approach.

**AI Agent:** Determines what action should be attempted.

**Policy Engine:** Determines whether the action is permitted.

**Human Approver:** Authorizes actions that require additional supervision.

**Evaluation Engine:** Measures the outcome and safety of execution.

This separation prevents AI-generated decisions from becoming unrestricted execution permissions.

---

## 🧰 Technology Stack

| Technology   | Purpose                        |
| ------------ | ------------------------------ |
| HTML         | Frontend structure             |
| CSS          | Dashboard styling              |
| JavaScript   | Frontend interactions          |
| Python       | Backend development            |
| FastAPI      | Backend API framework          |
| SQLAlchemy   | Database ORM                   |
| SQLite       | Database                       |
| REST API     | Frontend-backend communication |
| Git & GitHub | Version control                |

---

## 📂 Project Structure

```text
Amazon/
│
├── backend/
│   └── app/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── main.py
│
├── backend_backup_before_restore/
│
├── governed-ai-agent/
│   ├── css/
│   │   └── premium-dashboard.css
│   ├── js/
│   ├── assets/
│   └── index.html
│
├── .gitignore
│
└── README.md
```

*The structure above represents the main project areas. Refer to the repository for the exact current file structure.*

---

## 🔄 Expense Claim Processing

Expense claim processing is our primary demonstration scenario.

### How It Works

1. A user submits an expense request.
2. The system receives the expense information.
3. The backend validates the submitted data.
4. The policy engine checks the request against predefined rules.
5. The system determines whether the request is allowed, blocked, or requires additional approval.
6. Risky operations are sent for human review.
7. Authorized operations proceed through the execution workflow.
8. The final outcome is recorded.
9. The evaluation dashboard reflects the task result.

### Example Policy Scenarios

| Scenario                                | Expected Decision                        |
| --------------------------------------- | ---------------------------------------- |
| Valid expense amount and receipt        | Allow if policy conditions are satisfied |
| Zero or negative expense amount         | Block                                    |
| Restricted expense category             | Block                                    |
| Missing mandatory receipt               | Block or flag according to policy        |
| Expense exceeding an approval threshold | Request human approval                   |

These scenarios demonstrate how deterministic policy rules control agent execution.

---

## 🛡️ Safety and Governance

Safety is the foundation of this project.

Our system follows these principles:

**1. Policy First**

Every relevant operation must pass policy validation.

**2. Independent Enforcement**

AI-generated instructions cannot modify or bypass predefined policy rules.

**3. Human Oversight**

Risky operations require explicit human authorization.

**4. Fail-Safe Execution**

Invalid or unauthorized operations must not proceed.

**5. Transparency**

Important decisions and execution results must be recorded.

**6. Accountability**

The system must provide evidence of its decisions and actions.

---

## 📊 Evaluation Strategy

The project aims to demonstrate that an AI agent can be evaluated on both task completion and safety.

We focus on two dimensions:

### Task Performance

* Successful task completion.
* Failed task execution.
* Execution progress.
* Task processing status.

### Safety Performance

* Policy compliance.
* Blocked unauthorized operations.
* Human approval requirements.
* Approval and rejection history.

A successful agent is not simply one that completes the most tasks.

It must also demonstrate that it respects the policies governing those tasks.

---

## 🚀 Development Roadmap

| Phase | Task                             | Status                              |
| ----- | -------------------------------- | ----------------------------------- |
| 1     | Dashboard UI development         | In Progress                         |
| 2     | Backend development              | In Progress                         |
| 3     | Expense policy validation        | Developed / Integration in Progress |
| 4     | Database integration             | In Progress                         |
| 5     | AI agent orchestration           | Pending                             |
| 6     | Human approval workflow          | Pending Integration                 |
| 7     | Evaluation dashboard integration | In Progress                         |
| 8     | Audit logging                    | Pending Integration                 |
| 9     | End-to-end testing               | Planned                             |

*Status reflects the development progress and should be updated as components become fully functional.*

---

## 👥 Team Contributions

The project is being developed collaboratively.

| Team Member | Responsibility                               |
| ----------- | -------------------------------------------- |
| Member 1    | Frontend and Dashboard Development           |
| Member 2    | Backend Support, API Integration and Testing |
| Member 3    | Backend Development and Core Logic           |

---

## 🔮 Future Scope

* Support for additional real-world workflows.
* More advanced AI task planning.
* Configurable policy management.
* Improved approval mechanisms.
* Comprehensive agent evaluation.
* Advanced audit and monitoring capabilities.
* Integration with external services.
* More robust execution and recovery mechanisms.

---

## 🎯 Project Vision

Our objective is to demonstrate that AI agents can move beyond generating responses and perform meaningful real-world tasks responsibly.

We believe autonomous execution must always operate within clearly defined boundaries.

**An AI agent should know what it can do, respect what it cannot do, and recognize when a human needs to make the decision.**

---

## 📌 Project Information

| Field              | Details                        |
| ------------------ | ------------------------------ |
| Project Name       | Amazon                         |
| Project Category   | Governed AI Agents             |
| Application Domain | Administrative Task Automation |
| Primary Use Case   | Expense Claim Processing       |
| Core Focus         | Safe Multi-Step AI Execution   |
| Development Stage  | Hackathon Prototype            |

---

<p align="center">
  <b>AMAZON</b>
  <br>
  Governed AI. Controlled Execution. Human Accountability.
</p>
