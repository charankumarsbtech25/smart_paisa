# SmartPaisa Data Retention & Deletion Policy

## 1. Principles
SmartPaisa adheres to the principle of storage limitation: personal data is kept only for as long as necessary to fulfill the personal finance tracking services requested by the user.

## 2. Retention Schedules

| Record Type | Active Period | Post-Deletion Retention | Technical Mechanism |
| :--- | :--- | :--- | :--- |
| **User Profile & Credentials** | While account is active | Erased immediately upon deletion request | `DELETE FROM auth.users WHERE id = auth.uid()` |
| **Financial Expenses & Notes** | Retained during active account usage | 0 Days (Cascade deleted) | `ON DELETE CASCADE` foreign keys in PostgreSQL |
| **Monthly Budget Targets** | Retained during active account usage | 0 Days (Cascade deleted) | `ON DELETE CASCADE` foreign keys in PostgreSQL |
| **AI Assistant Chat Logs** | Retained locally or in DB until user clears chat | Erased immediately upon "Clear Chat" | LocalStorage removal & database deletion |
| **Database Snapshot Backups** | 30 Rolling Days for disaster recovery | Encrypted rotating cold storage, purged after 30 days | Automated managed backup lifecycle |
| **Consent & Audit Logs** | 12 Months from timestamp | Purged after statutory compliance window | Time-stamped consent records |

## 3. Account Deletion Execution Guarantee
Per Section 14 requirements:
- The system never claims data is deleted until the database cascade deletion and local storage removal have physically completed.
- When an account deletion is initiated via the Privacy & Data settings, the UI executes the database deletion transaction first, updates the privacy audit log to `completed`, purges device storage, and terminates the active session.
