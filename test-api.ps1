# L1tter API Test Script for PowerShell
# Run with: .\test-api.ps1

$baseUrl = "http://localhost:3001/api"

Write-Host "🧪 Testing L1tter API..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health check (no auth required)
Write-Host "1. Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health check successful:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Login with seeded user
Write-Host "2. Testing user login..." -ForegroundColor Yellow
$loginData = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful, token received" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Test books endpoint without auth (should fail)
Write-Host "3. Testing books endpoint without auth (should fail)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/books" -Method Get
    Write-Host "❌ Auth protection not working - request should have failed" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Auth protection working: Access token required" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Get books with auth
Write-Host "4. Testing books endpoint with auth..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $books = Invoke-RestMethod -Uri "$baseUrl/books" -Method Get -Headers $headers
    Write-Host "✅ Books retrieved: $($books.Count) books found" -ForegroundColor Green
    if ($books.Count -gt 0) {
        Write-Host "   First book: '$($books[0].title)' by $($books[0].author)" -ForegroundColor Gray
        Write-Host "   Paragraphs: $($books[0]._count.paragraphs)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Books request failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Create a new book
Write-Host "5. Testing book creation..." -ForegroundColor Yellow
$bookData = @{
    title = "Test Book $(Get-Date -Format 'HHmm')"
    author = "Test Author"
    content = @"
This is the first paragraph of our test book. It contains some meaningful content that should be split properly.

This is the second paragraph. It follows after the first one and adds more content to our book with additional details.

And this is the third paragraph, completing our small test book with even more interesting content and information.
"@
} | ConvertTo-Json

try {
    $newBook = Invoke-RestMethod -Uri "$baseUrl/books" -Method Post -Body $bookData -ContentType "application/json" -Headers $headers
    Write-Host "✅ Book created successfully" -ForegroundColor Green
    Write-Host "   Title: '$($newBook.title)'" -ForegroundColor Gray
    Write-Host "   Paragraphs created: $($newBook._count.paragraphs)" -ForegroundColor Gray
    Write-Host "   Book ID: $($newBook.id)" -ForegroundColor Gray
    $createdBookId = $newBook.id
} catch {
    Write-Host "❌ Book creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 6: Get single book
if ($createdBookId) {
    Write-Host "6. Testing single book retrieval..." -ForegroundColor Yellow
    try {
        $book = Invoke-RestMethod -Uri "$baseUrl/books/$createdBookId" -Method Get -Headers $headers
        Write-Host "✅ Single book retrieved successfully" -ForegroundColor Green
        Write-Host "   Title: '$($book.title)'" -ForegroundColor Gray
        Write-Host "   Total paragraphs: $($book.paragraphs.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Single book retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 7: Search books
Write-Host "7. Testing book search..." -ForegroundColor Yellow
try {
    $searchResults = Invoke-RestMethod -Uri "$baseUrl/books/search/Great" -Method Get -Headers $headers
    Write-Host "✅ Search completed: $($searchResults.Count) books found for 'Great'" -ForegroundColor Green
} catch {
    Write-Host "❌ Search failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 8: Get paragraphs for a book
if ($books -and $books.Count -gt 0) {
    Write-Host "8. Testing paragraphs endpoint..." -ForegroundColor Yellow
    $firstBookId = $books[0].id
    try {
        $paragraphs = Invoke-RestMethod -Uri "$baseUrl/paragraphs/book/$firstBookId" -Method Get -Headers $headers
        Write-Host "✅ Paragraphs retrieved: $($paragraphs.paragraphs.Count) paragraphs found" -ForegroundColor Green
        if ($paragraphs.paragraphs.Count -gt 0) {
            Write-Host "   First paragraph preview: '$($paragraphs.paragraphs[0].content.Substring(0, [Math]::Min(50, $paragraphs.paragraphs[0].content.Length)))...'" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Paragraphs retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 9: Update reading progress
if ($books -and $books.Count -gt 0) {
    Write-Host "9. Testing progress update..." -ForegroundColor Yellow
    $firstBookId = $books[0].id
    try {
        # First get paragraphs to get a paragraph ID
        $paragraphs = Invoke-RestMethod -Uri "$baseUrl/paragraphs/book/$firstBookId" -Method Get -Headers $headers
        if ($paragraphs.paragraphs.Count -gt 0) {
            $progressData = @{
                bookId = $firstBookId
                paragraphId = $paragraphs.paragraphs[0].id
                position = 1
            } | ConvertTo-Json
            
            $progress = Invoke-RestMethod -Uri "$baseUrl/progress" -Method Post -Body $progressData -ContentType "application/json" -Headers $headers
            Write-Host "✅ Progress updated successfully" -ForegroundColor Green
            Write-Host "   Book: '$($progress.book.title)'" -ForegroundColor Gray
            Write-Host "   Position: $($progress.position)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Progress update failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "🎉 API testing complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Summary of available endpoints:" -ForegroundColor Yellow
Write-Host "  GET  /api/health              - Health check (no auth)" -ForegroundColor Gray
Write-Host "  POST /api/auth/login          - User login" -ForegroundColor Gray
Write-Host "  POST /api/auth/register       - User registration" -ForegroundColor Gray
Write-Host "  GET  /api/books               - Get all books (auth required)" -ForegroundColor Gray
Write-Host "  POST /api/books               - Create book from text (auth required)" -ForegroundColor Gray
Write-Host "  POST /api/books/upload        - Upload PDF/text file (auth required)" -ForegroundColor Gray
Write-Host "  GET  /api/books/:id           - Get single book (auth required)" -ForegroundColor Gray
Write-Host "  GET  /api/books/search/:query - Search books (auth required)" -ForegroundColor Gray
Write-Host "  GET  /api/paragraphs/book/:id - Get book paragraphs (auth required)" -ForegroundColor Gray
Write-Host "  POST /api/progress            - Update reading progress (auth required)" -ForegroundColor Gray
Write-Host ""
Write-Host "🔐 Authentication:" -ForegroundColor Yellow
Write-Host "  Use 'Authorization: Bearer YOUR_TOKEN' header for authenticated endpoints" -ForegroundColor Gray
Write-Host "  Sample credentials: john@example.com / password123" -ForegroundColor Gray
