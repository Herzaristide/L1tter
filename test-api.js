// Test script to verify L1tter API endpoints
// Run with: node test-api.js

const BASE_URL = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Testing L1tter API...\n');

  // Test 1: Health check (no auth required)
  console.log('1. Testing health endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health check:', data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }

  // Test 2: Register a new user
  console.log('\n2. Testing user registration...');
  const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
  };

  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });
    const data = await response.json();
    if (response.ok) {
      console.log('✅ User registered successfully');
    } else {
      console.log('❌ Registration failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Registration failed:', error.message);
  }

  // Test 3: Login with seeded user
  console.log('\n3. Testing user login...');
  let token = null;
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'john@example.com',
        password: 'password123',
      }),
    });
    const data = await response.json();
    if (response.ok) {
      token = data.token;
      console.log('✅ Login successful, token received');
    } else {
      console.log('❌ Login failed:', data.error);
      return;
    }
  } catch (error) {
    console.log('❌ Login failed:', error.message);
    return;
  }

  // Test 4: Get books (requires auth)
  console.log('\n4. Testing books endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/books`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Books retrieved:', data.length, 'books found');
      if (data.length > 0) {
        console.log('   First book:', data[0].title, 'by', data[0].author);
        console.log('   Paragraphs:', data[0]._count.paragraphs);
      }
    } else {
      console.log('❌ Books request failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Books request failed:', error.message);
  }

  // Test 5: Create a new book
  console.log('\n5. Testing book creation...');
  const sampleBook = {
    title: 'Test Book',
    author: 'Test Author',
    content: `This is the first paragraph of our test book. It contains some meaningful content.

This is the second paragraph. It follows after the first one and adds more content to our book.

And this is the third paragraph, completing our small test book with even more interesting content.`,
  };

  try {
    const response = await fetch(`${BASE_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sampleBook),
    });
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Book created successfully');
      console.log('   Title:', data.title);
      console.log('   Paragraphs created:', data._count.paragraphs);
    } else {
      console.log('❌ Book creation failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Book creation failed:', error.message);
  }

  // Test 6: Test without auth (should fail)
  console.log('\n6. Testing endpoint without auth (should fail)...');
  try {
    const response = await fetch(`${BASE_URL}/books`);
    const data = await response.json();
    if (response.status === 401) {
      console.log('✅ Auth protection working:', data.error);
    } else {
      console.log('❌ Auth protection not working');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  console.log('\n🎉 API testing complete!');
}

testAPI().catch(console.error);
