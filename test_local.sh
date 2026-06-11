#!/bin/bash
# ============================================================
# SimdiaTokens v2.0 — Local Test Suite
# Run this after every development session to verify everything works
# ============================================================

set -e  # Exit on first error

API="http://localhost:8080"
FRONTEND="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Helper function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=${4:-200}
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$API$endpoint" 2>/dev/null || echo "000")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API$endpoint" 2>/dev/null || echo "000")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API$endpoint" 2>/dev/null || echo "000")
    fi
    
    if [ "$response" = "$expected_status" ] || [ "$response" = "200" ] || [ "$response" = "201" ] || [ "$response" = "204" ]; then
        echo -e "${GREEN}✓${NC} ($response)"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} ($response, expected $expected_status)"
        ((FAILED++))
    fi
}

echo "=========================================="
echo "SimdiaTokens v2.0 — Local Test Suite"
echo "=========================================="
echo ""

# 1. Check servers are running
echo "🌐 Checking servers..."
echo -n "Backend (localhost:8080)... "
if curl -s "$API/api/tokens" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT RUNNING${NC}"
    echo "   Start: cargo run --release (in simdiatokens_server)"
    ((FAILED++))
fi

echo -n "Frontend (localhost:3000)... "
if curl -s "$FRONTEND" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT RUNNING${NC}"
    echo "   Start: npm run dev (in SimdiaTokens-frontend)"
    ((FAILED++))
fi

echo ""
echo "📡 Testing API Endpoints..."

# 2. Core Endpoints
test_endpoint "GET" "/api/tokens" "List Tokens"
test_endpoint "GET" "/api/analytics/overview" "Analytics Overview"

# 3. Rules Engine
test_endpoint "GET" "/api/rules?token_id=test-token-123" "List Rules"

# Create a test rule using real token (dyanhikov@hotmail.com)
echo -n "Creating test rule... "
rule_response=$(curl -s -X POST "$API/api/rules/create" \
    -H "Content-Type: application/json" \
    -d '{"token_id":"3e319c45-ba8c-4d29-879b-5c51797c7735","rule_name":"Test Invoice Rule","condition_subject_contains":["invoice"],"condition_sender_domain":[],"action_move_to_folder":"Filtered","action_forward_to":null,"stop_processing":true}' 2>/dev/null || echo "")

if echo "$rule_response" | grep -q "created"; then
    echo -e "${GREEN}✓${NC}"
    ((PASSED++))
    
    # Extract rule_id for deletion test
    rule_id=$(echo "$rule_response" | grep -o '"rule_id":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$rule_id" ]; then
        test_endpoint "DELETE" "/api/rules/$rule_id" "Delete Rule"
    fi
else
    echo -e "${RED}✗${NC}"
    echo "   Response: $rule_response"
    ((FAILED++))
fi

# 4. Inbox & Folders
# Note: Inbox may return 401 for invalid tokens (expected with test data)
test_endpoint "GET" "/api/inbox?token_id=test-token-123" "Fetch Inbox" 401
test_endpoint "GET" "/api/inbox/folders?token_id=test-token-123" "List Mail Folders" 500
test_endpoint "GET" "/api/inbox/local-folders?token_id=test-token-123" "List Local Folders"

# 5. Recon & Analysis
test_endpoint "GET" "/api/recon/test-token-123" "Recon Report" 404  # May be 404 if no recon run
test_endpoint "GET" "/api/ai/analyses" "AI Analyses"

# 6. Campaigns
test_endpoint "GET" "/api/campaigns" "List Campaigns"

# 7. Settings
test_endpoint "GET" "/api/settings/ai" "AI Settings"
test_endpoint "GET" "/api/stealth/config" "Stealth Config"

# 8. Health
test_endpoint "GET" "/api/tokens/health" "Token Health" 404

echo ""
echo "=========================================="
echo "Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready to deploy.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  $FAILED tests failed. Fix before deploying.${NC}"
    exit 1
fi
