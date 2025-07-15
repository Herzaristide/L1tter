#!/bin/bash
# L1tter API Test Script for Linux/macOS

echo "🧪 Testing L1tter API..."
echo

echo "1. Testing health endpoint..."
curl -s http://localhost:3001/api/health | jq '.'
echo
echo

echo "2. Testing login with seeded user..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}')

echo $TOKEN_RESPONSE | jq '.'

# Extract token
TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')
echo
echo "Extracted token: ${TOKEN:0:20}..."
echo

echo "3. Testing books endpoint without auth (should fail)..."
curl -s http://localhost:3001/api/books | jq '.'
echo
echo

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
    echo "4. Testing books endpoint with auth..."
    curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/books | jq '.'
    echo
    echo

    echo "5. Testing book creation..."
    curl -s -X POST http://localhost:3001/api/books \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "title": "Test Book",
        "author": "Test Author", 
        "content": "This is paragraph one.\n\nThis is paragraph two.\n\nThis is paragraph three."
      }' | jq '.'
else
    echo "❌ Could not get token, skipping authenticated tests"
fi

echo
echo "🎉 Testing complete!"
