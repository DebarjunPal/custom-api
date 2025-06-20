const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing Health Check...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    });
    console.log(`✅ Health Check: ${response.status} - ${response.data.message}`);
  } catch (error) {
    console.log(`❌ Health Check failed: ${error.message}`);
  }
}

async function testGetAllTasks() {
  console.log('\n🔍 Testing Get All Tasks...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      method: 'GET'
    });
    console.log(`✅ Get All Tasks: ${response.status} - Found ${response.data.count} tasks`);
    return response.data.data;
  } catch (error) {
    console.log(`❌ Get All Tasks failed: ${error.message}`);
    return [];
  }
}

async function testCreateTask() {
  console.log('\n🔍 Testing Create Task...');
  const newTask = {
    title: 'Test Task from API Test',
    description: 'This task was created during API testing',
    status: 'pending',
    priority: 'high'
  };

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, newTask);
    
    if (response.status === 201) {
      console.log(`✅ Create Task: ${response.status} - Created task with ID ${response.data.data.id}`);
      return response.data.data.id;
    } else {
      console.log(`❌ Create Task failed: ${response.status} - ${response.data.error}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Create Task failed: ${error.message}`);
    return null;
  }
}

async function testGetSingleTask(taskId) {
  console.log(`\n🔍 Testing Get Single Task (ID: ${taskId})...`);
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/tasks/${taskId}`,
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log(`✅ Get Single Task: ${response.status} - ${response.data.data.title}`);
    } else {
      console.log(`❌ Get Single Task failed: ${response.status} - ${response.data.error}`);
    }
  } catch (error) {
    console.log(`❌ Get Single Task failed: ${error.message}`);
  }
}

async function testUpdateTask(taskId) {
  console.log(`\n🔍 Testing Update Task (ID: ${taskId})...`);
  const updateData = {
    status: 'completed',
    description: 'Updated during API testing - task completed!'
  };

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/tasks/${taskId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    }, updateData);
    
    if (response.status === 200) {
      console.log(`✅ Update Task: ${response.status} - Status changed to ${response.data.data.status}`);
    } else {
      console.log(`❌ Update Task failed: ${response.status} - ${response.data.error}`);
    }
  } catch (error) {
    console.log(`❌ Update Task failed: ${error.message}`);
  }
}

async function testGetAllUsers() {
  console.log('\n🔍 Testing Get All Users...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/users',
      method: 'GET'
    });
    console.log(`✅ Get All Users: ${response.status} - Found ${response.data.count} users`);
    return response.data.data;
  } catch (error) {
    console.log(`❌ Get All Users failed: ${error.message}`);
    return [];
  }
}

async function testCreateUser() {
  console.log('\n🔍 Testing Create User...');
  const newUser = {
    name: 'Test User',
    email: `testuser${Date.now()}@example.com`,
    role: 'user'
  };

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, newUser);
    
    if (response.status === 201) {
      console.log(`✅ Create User: ${response.status} - Created user with ID ${response.data.data.id}`);
      return response.data.data.id;
    } else {
      console.log(`❌ Create User failed: ${response.status} - ${response.data.error}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Create User failed: ${error.message}`);
    return null;
  }
}

async function testUpdateUser(userId) {
  console.log(`\n🔍 Testing Update User (ID: ${userId})...`);
  const updateData = {
    role: 'admin'
  };

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/users/${userId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    }, updateData);
    
    if (response.status === 200) {
      console.log(`✅ Update User: ${response.status} - Role changed to ${response.data.data.role}`);
    } else {
      console.log(`❌ Update User failed: ${response.status} - ${response.data.error}`);
    }
  } catch (error) {
    console.log(`❌ Update User failed: ${error.message}`);
  }
}

async function testGetStats() {
  console.log('\n🔍 Testing Get Statistics...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/stats',
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log(`✅ Get Statistics: ${response.status}`);
      console.log(`   Total Tasks: ${response.data.data.totalTasks}`);
      console.log(`   Total Users: ${response.data.data.totalUsers}`);
      console.log(`   Tasks by Status:`, response.data.data.tasksByStatus);
    } else {
      console.log(`❌ Get Statistics failed: ${response.status} - ${response.data.error}`);
    }
  } catch (error) {
    console.log(`❌ Get Statistics failed: ${error.message}`);
  }
}

async function testDeleteTask(taskId) {
  console.log(`\n🔍 Testing Delete Task (ID: ${taskId})...`);
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/tasks/${taskId}`,
      method: 'DELETE'
    });
    
    if (response.status === 200) {
      console.log(`✅ Delete Task: ${response.status} - ${response.data.message}`);
    } else {
      console.log(`❌ Delete Task failed: ${response.status} - ${response.data.error}`);
    }
  } catch (error) {
    console.log(`❌ Delete Task failed: ${error.message}`);
  }
}

async function testDeleteUser(userId) {
  console.log(`\n🔍 Testing Delete User (ID: ${userId})...`);
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/users/${userId}`,
      method: 'DELETE'
    });
    
    if (response.status === 200) {
      console.log(`✅ Delete User: ${response.status} - ${response.data.message}`);
    } else {
      console.log(`❌ Delete User failed: ${response.status} - ${response.data.error}`);
    }
  } catch (error) {
    console.log(`❌ Delete User failed: ${error.message}`);
  }
}

async function testTaskFiltering() {
  console.log('\n🔍 Testing Task Filtering...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks?status=completed&priority=high',
      method: 'GET'
    });
    console.log(`✅ Task Filtering: ${response.status} - Found ${response.data.count} filtered tasks`);
  } catch (error) {
    console.log(`❌ Task Filtering failed: ${error.message}`);
  }
}

async function testErrorHandling() {
  console.log('\n🔍 Testing Error Handling...');
  
  // Test 404 for non-existent task
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/tasks/99999',
      method: 'GET'
    });
    if (response.status === 404) {
      console.log(`✅ 404 Error Handling: ${response.status} - ${response.data.error}`);
    } else {
      console.log(`❌ Expected 404, got ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error Handling test failed: ${error.message}`);
  }

  // Test invalid endpoint
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/invalid-endpoint',
      method: 'GET'
    });
    if (response.status === 404) {
      console.log(`✅ Invalid Endpoint Handling: ${response.status} - ${response.data.error}`);
    } else {
      console.log(`❌ Expected 404 for invalid endpoint, got ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Invalid Endpoint test failed: ${error.message}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  console.log('Make sure your server is running on http://localhost:3001\n');

  let createdTaskId, createdUserId;

  try {
    // Basic tests
    await testHealthCheck();
    await testGetAllTasks();
    await testGetAllUsers();
    await testGetStats();

    // CRUD tests for tasks
    createdTaskId = await testCreateTask();
    if (createdTaskId) {
      await testGetSingleTask(createdTaskId);
      await testUpdateTask(createdTaskId);
    }

    // CRUD tests for users
    createdUserId = await testCreateUser();
    if (createdUserId) {
      await testUpdateUser(createdUserId);
    }
