# Meta OAuth Implementation Plan

## Goal
Let a logged-in BrandqoAI user connect their Facebook Page and/or Instagram Business account through Meta OAuth, persist the connection, reflect status in the dashboard, and prepare the flow for WhatsApp-onboarded users too.

## Scope for this phase
Focus on:
- Meta OAuth connect flow
- OAuth callback handling
- fetching selectable assets from Meta
- saving linked accounts
- dashboard connected-state UI
- conflict detection hook
- basic failure handling

Not in this first slice:
- ownership transfer flow
- admin conflict resolution
- actual publishing
- long-term token refresh automation beyond minimum persistence
- X/Twitter OAuth

## User journey
1. User opens dashboard → Social Accounts
2. Clicks Connect Facebook / Instagram
3. Backend generates signed OAuth state and redirects to Meta
4. User authorizes BrandqoAI in browser
5. Meta redirects back to backend callback
6. Backend exchanges code for token
7. Backend fetches Facebook pages and connected Instagram business accounts
8. If one eligible target exists, link it directly
9. If multiple exist, return choices for user selection
10. Save linked account(s) to DB
11. Dashboard shows connected platform, account/page name, handle if available, and status
12. If account already belongs to another BrandqoAI user, block linking and show conflict message

## Architecture
### Frontend
- SocialAccountsCard
- connect buttons
- callback result page or dashboard redirect handling
- optional account-picker UI if Meta returns multiple assets

### Backend
- GET /social/meta/connect
- GET /social/meta/callback
- GET /social/meta/assets or equivalent selection support
- POST /social/meta/link
- GET /social/accounts
- DELETE /social/accounts/:id later if needed

## Data model
### SocialAccount
- id
- userId
- brandProfileId if used separately
- platform (FACEBOOK_PAGE, INSTAGRAM_BUSINESS)
- provider = meta
- externalAccountId
- accountName
- accountUsername nullable
- pageId nullable
- pageName nullable
- instagramBusinessId nullable
- accessTokenEncrypted
- refreshTokenEncrypted nullable
- tokenExpiresAt nullable
- scopes
- metadataJson
- connectedAt
- updatedAt
- disconnectedAt nullable
- status

### OAuthSession / OAuthState
- id
- userId
- provider
- origin (dashboard | whatsapp)
- nonce
- redirectAfter
- status
- expiresAt
- maybe rawTokenEncrypted temp if using multi-step asset selection

## Meta permissions and assets
Likely MVP permissions:
- pages_show_list
- pages_read_engagement
- instagram_basic
- business_management

Later for publishing:
- pages_manage_posts
- instagram_content_publish

Fetch after OAuth:
- Facebook Pages user can manage
- each page’s linked Instagram Business account if available

## Backend flow in detail
### 1. Connect endpoint
GET /social/meta/connect
- require auth
- accept optional platform, origin, redirect
- create signed state
- redirect to Meta OAuth authorize URL

State includes:
- userId
- origin
- requested platform
- nonce
- issuedAt / expiresAt
- redirectAfter

### 2. Callback endpoint
GET /social/meta/callback
- verify state
- exchange code for access token
- fetch user-managed pages
- fetch linked IG business accounts
- normalize assets
- detect conflict before link finalization
- either auto-link, require selection, or redirect with error

Possible outcomes:
- success
- no_assets_found
- conflict_detected
- oauth_denied
- token_exchange_failed
- selection_required

### 3. Asset selection endpoint
If multiple pages/accounts exist:
- callback stores temp OAuth session
- frontend shows picker
- user selects assets
- frontend calls POST /social/meta/link

### 4. Conflict detection
Before saving any asset:
- check whether externalAccountId + platform already exists for another BrandqoAI user/profile
- if yes, do not overwrite, do not partially link, return structured conflict response

## Frontend flow
### Social Accounts card
- show Not connected / Connected / Needs attention
- actions: Connect / Reconnect / Disconnect

### Connect button behavior
- /api/social/meta/connect?platform=facebook
- /api/social/meta/connect?platform=instagram

### Callback UX
- parse status from query params
- show toast/banner for success, no assets, conflict, cancelled auth

### Multiple account selection UI
Show:
- Page name
- IG handle if linked
- platform badges
- select one or more accounts
- confirm link

## Persistence rules
- one external social account belongs to only one BrandqoAI profile
- same user may connect multiple platforms
- Facebook Page and Instagram Business account are separate records
- if Instagram is linked through a Facebook Page, preserve page relationship metadata
- encrypt access tokens before saving
- never expose raw tokens to frontend

## Error handling
- user denies consent
- no eligible assets
- expired/invalid state
- token exchange failure
- conflict

## Security requirements
- signed short-lived state
- CSRF-safe callback handling
- encrypted token storage
- no raw provider tokens in URLs
- no raw provider error dumps to users
- audit log for connect/callback/link/conflict

## Suggested implementation steps
1. inspect existing socialRoutes.ts, DB schema, SocialAccountsCard
2. add Meta config env vars
3. implement connect/callback skeleton
4. implement asset discovery
5. persist linked accounts
6. add dashboard integration
7. add logs/tests and prepare WhatsApp reuse

## Env vars needed
- META_APP_ID
- META_APP_SECRET
- META_REDIRECT_URI
- APP_URL
- BACKEND_PUBLIC_URL
- token encryption secret if not already present
- optional META_GRAPH_API_VERSION

## Testing plan
- happy path
- no asset path
- conflict path
- multi-asset path
- regression for WhatsApp magic-link dashboard auth

## Issue mapping
- #21 onboarding OAuth linkage
- #73 dashboard social account management
- #66 conflict detection hook readiness
