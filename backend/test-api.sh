#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"

echo -e "${BLUE}=== NFT Analytics API Tests ===${NC}\n"

# Test 1: Health check
echo -e "${BLUE}1. Health Check${NC}"
curl -s "$BASE_URL/health" | jq '.' || echo "Error"
echo ""

# Test 2: Top holders
echo -e "${BLUE}2. Top 10 Holders${NC}"
curl -s "$BASE_URL/holders/top?limit=10" | jq '.holders[0:3]' || echo "Error"
echo ""

# Test 3: Holder distribution
echo -e "${BLUE}3. Holder Distribution${NC}"
curl -s "$BASE_URL/holders/distribution" | jq '.distribution' || echo "Error"
echo ""

# Test 4: Metrics for 24h
echo -e "${BLUE}4. 24h Trading Metrics${NC}"
curl -s "$BASE_URL/metrics?period=24h" | jq '.metrics' || echo "Error"
echo ""

# Test 5: Whales
echo -e "${BLUE}5. Whale Addresses (10+ NFTs)${NC}"
curl -s "$BASE_URL/whales?minNFTs=10" | jq '.count' || echo "Error"
echo ""

# Test 6: Cache stats
echo -e "${BLUE}6. Cache Statistics${NC}"
curl -s "$BASE_URL/cache/stats" | jq '.stats' || echo "Error"
echo ""

echo -e "${GREEN}All tests completed!${NC}"
