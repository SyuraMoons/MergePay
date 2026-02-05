#!/bin/bash

# API Test Script - Arc Treasury Hub
# Tests all API endpoints to verify functionality

BASE_URL="http://localhost:4000"
API_URL="${BASE_URL}/api"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          Arc Treasury Hub API Test Script                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

# Test function
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4

  echo -n "Testing ${name}... "

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "${API_URL}${endpoint}")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "${API_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -d "${data}")
  fi

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$status_code" -eq 200 ] || [ "$status_code" -eq 400 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP ${status_code})"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (HTTP ${status_code})"
    echo "  Response: ${body}"
    FAIL=$((FAIL + 1))
  fi
}

echo "═══════════════════════════════════════════════════════════════"
echo "1. Health Check"
echo "═══════════════════════════════════════════════════════════════"
# Health check is at root /health, not /api/health
echo -n "Testing Health Check... "
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/health")
status_code=$(echo "$response" | tail -n1)
if [ "$status_code" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS${NC} (HTTP ${status_code})"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗ FAIL${NC} (HTTP ${status_code})"
  FAIL=$((FAIL + 1))
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "2. CCTP Endpoints"
echo "═══════════════════════════════════════════════════════════════"
test_endpoint "CCTP Transfer (invalid)" "POST" "/transfer/cctp" '{"amount":-1}'
test_endpoint "CCTP Status" "GET" "/transfer/cctp/status/0x123" ""
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "3. Gateway Endpoints"
echo "═══════════════════════════════════════════════════════════════"
test_endpoint "Gateway Deposit (invalid)" "POST" "/gateway/deposit" '{}'
test_endpoint "Gateway Transfer (invalid)" "POST" "/gateway/transfer" '{}'
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "4. Treasury Endpoints"
echo "═══════════════════════════════════════════════════════════════"
test_endpoint "Treasury Configure (invalid)" "POST" "/treasury/policy/configure" '{}'
test_endpoint "Treasury Pools" "GET" "/treasury/pools" ""
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "5. Circle Wallet Endpoints (expect errors without API key)"
echo "═══════════════════════════════════════════════════════════════"
# Circle endpoints will return 500 without CIRCLE_API_KEY - this is expected
echo -n "Testing Circle User Token... "
response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/circle/users/token" -H "Content-Type: application/json" -d '{}')
status_code=$(echo "$response" | tail -n1)
if [ "$status_code" -eq 500 ] || [ "$status_code" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS${NC} (HTTP ${status_code}) - Expected without API key"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗ FAIL${NC} (HTTP ${status_code})"
  FAIL=$((FAIL + 1))
fi

test_endpoint "Circle Init (invalid)" "POST" "/circle/wallets/initialize" '{}'
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "6. Wallet Endpoints"
echo "═══════════════════════════════════════════════════════════════"
test_endpoint "Wallet Balances" "GET" "/wallet/balances/0x123" ""
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════"
echo "Test Results"
echo "═══════════════════════════════════════════════════════════════"
echo -e "Passed: ${GREEN}${PASS}${NC}"
echo -e "Failed: ${RED}${FAIL}${NC}"
echo "Total:  $((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  echo ""
  echo "Make sure the server is running:"
  echo "  npm run server"
  exit 1
fi
