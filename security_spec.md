# CamConnect Security Specification

## 1. Data Invariants
1. **PII Isolation**: `users_public/{userId}` never stores emails or PII; `users_private/{userId}` stores `authEmail` and `collegeEmail` and is strictly readable/writable only by `userId == request.auth.uid`.
2. **Verified Auth Write Gate**: All mutations require `request.auth != null && request.auth.token.email_verified == true`.
3. **Identity Integrity**: Every document created with `uid`, `authorId`, or `userId` must match `request.auth.uid`. Immutable fields (`authorId`, `createdAt`, `questionId`) cannot be altered on update.
4. **Master Gate Relational Sync**: `/questions/{questionId}/answers/{answerId}` and `/questions/{questionId}/votes/{userId}` verify parent `/questions/{questionId}` existence via `exists()`/`get()` on single-document operations, and votes enforce atomic `helpfulCount` updates via `getAfter()`/`existsAfter()`.
5. **Terminal State Locking**: Once a question reaches `status == 'archived_faq'`, non-admin users cannot overwrite or revert its core question fields or status.
6. **Batch Guide Authority**: Only verified `senior` or `alumni` profiles (or admin) can publish `BatchGuide` documents, verified via `get(/databases/$(database)/documents/users_public/$(request.auth.uid)).data.role in ['senior', 'alumni']`.
7. **Temporal Integrity**: `createdAt` on create and `updatedAt` on update must equal `request.time`.
8. **Query Enforcer**: Every `allow list` rule explicitly evaluates `resource.data` (either `resource.data.visibility == 'campus'` or `resource.data.userId == request.auth.uid`), with zero `get()` calls inside `allow list`.

## 2. Adversarial "Dirty Dozen" Payloads
1. **Shadow Field Injection on `users_public`**: Payload with valid fields plus `isAdmin: true` -> rejected by `keys().hasOnly(...)`.
2. **Email Spoofing / Unverified Token**: Payload from user with `email_verified: false` -> rejected by `isVerifiedAuth()`.
3. **PII Blanket Read**: Authenticated non-owner reading `/users_private/{otherUid}` -> rejected by `isOwner(userId)`.
4. **Identity Spoofing on Question**: Authenticated user submitting `authorId: 'other_uid'` -> rejected by `data.authorId == request.auth.uid`.
5. **ID Poisoning**: Document ID containing spaces or 2KB string -> rejected by `isValidId()`.
6. **Denial-of-Wallet Oversized Body**: Question `body` with 10,000 characters -> rejected by `data.body.size() <= 4000`.
7. **Unbounded Array Injection**: `routedMentorIds` with 25 items -> rejected by `data.routedMentorIds.size() <= 6`.
8. **Junior Publishing Senior Guide**: User with `role: 'junior'` attempting to create `/guides/{id}` -> rejected by role lookup on `users_public`.
9. **Orphaned Answer Creation**: Creating answer under nonexistent `/questions/fake_id` -> rejected by parent `exists()`.
10. **Vote Inflation Without Vote Doc**: Updating `questions/{id}.helpfulCount` directly without creating `/votes/{uid}` -> rejected by `existsAfter()` / action-based update gate.
11. **Terminal State Bypass**: Non-admin editing `title` or `status` of an `archived_faq` question -> rejected by terminal state lock.
12. **Cross-User Bookmark Listing**: Listing `/bookmarks` without filtering `userId == request.auth.uid` -> rejected by `allow list: if isSignedIn() && resource.data.userId == request.auth.uid`.
