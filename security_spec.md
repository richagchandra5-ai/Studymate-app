# StudyMate Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Ownership Isolation**: All personal student data (`/users/{userId}` and subcollections `subjects`, `scheduleBlocks`, `tasks`, `studySessions`) is strictly readable and writable only by the authenticated owner whose `request.auth.uid == userId` and `request.auth.token.email_verified == true`.
2. **PII Isolation**: User profiles (`/users/{userId}`) contain `email` and academic details. No `allow list` or cross-user `allow get` is permitted on `/users/{userId}`.
3. **Referential Integrity on Sub-resources**: Schedule blocks, tasks, and study sessions must reference an existing `subjectId` under `/users/{userId}/subjects/{subjectId}` when created, ensuring no orphaned records.
4. **Immutability**: `uid`, `ownerId`, and `createdAt` are immutable after creation.
5. **Server-Enforced Temporal Integrity**: `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
6. **Strict Field Allowlisting & Boundary Caps**: Every document enforces exact `keys().hasAll(...) && keys().hasOnly(...)` on create and `affectedKeys().hasOnly(...)` on update, plus string `.size()` and numeric range checks.
7. **Pilot Feedback Protection**: `/pilotFeedback/{feedbackId}` allows authenticated verified users to create feedback tied to their own `ownerId` and read/list only their own submissions.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Profile Read**: `GET /users/userA` with `auth == null` -> `PERMISSION_DENIED`.
2. **Cross-User Profile Read (PII Leak)**: `GET /users/userA` authenticated as `userB` -> `PERMISSION_DENIED`.
3. **Unverified Email Write**: `CREATE /users/userA` with `auth.uid == 'userA'` and `email_verified == false` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Profile**: `CREATE /users/userA` with valid fields + `isAdmin: true` -> `PERMISSION_DENIED`.
5. **Identity Spoofing on Subject**: `CREATE /users/userA/subjects/sub1` as `userA` with `ownerId: 'userB'` -> `PERMISSION_DENIED`.
6. **ID Poisoning (Oversized Document ID)**: `CREATE /users/userA/subjects/<150-char-invalid-id!@#>` -> `PERMISSION_DENIED`.
7. **Client Timestamp Forgery**: `CREATE /users/userA/tasks/t1` with `createdAt: '2020-01-01T00:00:00Z'` instead of `request.time` -> `PERMISSION_DENIED`.
8. **Orphaned Schedule Block**: `CREATE /users/userA/scheduleBlocks/b1` referencing non-existent `subjectId: 'ghost_sub'` -> `PERMISSION_DENIED`.
9. **Immutable Field Mutation**: `UPDATE /users/userA/tasks/t1` attempting to modify `ownerId` or `createdAt` -> `PERMISSION_DENIED`.
10. **Denial-of-Wallet Resource Poisoning**: `CREATE /users/userA/subjects/sub2` with a 5,000-character `notesSummary` (> 500 limit) -> `PERMISSION_DENIED`.
11. **Terminal/Type Poisoning on Update**: `UPDATE /users/userA/subjects/sub1` setting `completedTopics: 999` when `totalTopics: 10` or `durationMinutes: -50` -> `PERMISSION_DENIED`.
12. **Blanket List Scraping on Pilot Feedback**: `LIST /pilotFeedback` as `userB` without `where('ownerId', '==', 'userB')` -> `PERMISSION_DENIED`.
