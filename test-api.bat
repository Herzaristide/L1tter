@echo off
REM L1tter API Test Script for Windows
echo Testing L1tter API...
echo.

echo 1. Testing health endpoint...
curl -s http://localhost:3001/api/health
echo.
echo.

echo 2. Testing login with seeded user...
curl -s -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@example.com\",\"password\":\"password123\"}"
echo.
echo.

echo 3. Testing books endpoint without auth (should fail)...
curl -s http://localhost:3001/api/books
echo.
echo.

echo To test authenticated endpoints:
echo 1. Copy the token from the login response above
echo 2. Run: curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/books
echo.

pause
