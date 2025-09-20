/**
 * MCP Security Usage Example
 * Demonstrates how to use the MCP Security Core with adapters
 */

import { createMCPCore, MCPAdapter } from './MCPSecurityCore';

// Example Firebase adapter
const firebaseAdapter: MCPAdapter = {
  name: 'firebase-firestore',
  execute: async (operation: any) => {
    // Simulate Firebase operation
    await new Promise(resolve => setTimeout(resolve, 100));

    if (operation.type === 'query') {
      return {
        documents: [
          { id: '1', data: { name: 'Test Document' } }
        ],
        count: 1
      };
    }

    throw new Error('Unsupported operation');
  },
  healthCheck: async () => {
    // Simulate Firebase health check
    return { healthy: true, details: { latency: 50 } };
  }
};

// Example OpenAI adapter
const openaiAdapter: MCPAdapter = {
  name: 'openai-gpt',
  execute: async (operation: any) => {
    // Simulate OpenAI API call
    await new Promise(resolve => setTimeout(resolve, 200));

    if (operation.type === 'completion') {
      return {
        response: 'AI generated response',
        tokens: 150,
        model: 'gpt-4'
      };
    }

    throw new Error('Invalid request');
  },
  healthCheck: async () => {
    return { healthy: true, details: { apiStatus: 'operational' } };
  }
};

// Initialize MCP with custom configuration
async function initializeMCP() {
  console.log('🚀 Initializing MCP Security System...\n');

  const mcp = createMCPCore({
    auth: {
      jwtSecret: 'production-ready-secret-key-64-characters-long-for-maximum-security-compliance',
      tokenExpiry: 1800, // 30 minutes
      allowedRoles: ['admin', 'user', 'service'],
      rateLimitPerMinute: 500
    },
    environment: 'production'
  });

  // Register adapters
  mcp.registerAdapter(firebaseAdapter);
  mcp.registerAdapter(openaiAdapter);

  return mcp;
}

// Example usage scenarios
async function demonstrateUsage() {
  const mcp = await initializeMCP();

  console.log('📊 System Status:');
  console.log(JSON.stringify(mcp.getSystemStatus(), null, 2));
  console.log();

  // Example 1: Public operation (no auth required)
  console.log('🔓 Example 1: Public Operation');
  const publicResult = await mcp.executeSecure('firebase-firestore', {
    type: 'query',
    collection: 'public_data'
  });
  console.log('Result:', JSON.stringify(publicResult, null, 2));
  console.log();

  // Example 2: Authenticated operation
  console.log('🔐 Example 2: Authenticated Operation');
  // Note: In real usage, you'd have a valid JWT token
  const authResult = await mcp.executeSecure(
    'openai-gpt',
    {
      type: 'completion',
      prompt: 'Generate a summary'
    },
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMSIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjpbInJlYWQiLCJ3cml0ZSJdLCJzZXNzaW9uSWQiOiJzZXNzaW9uMSIsImV4cCI6MTk5OTk5OTk5OX0.fake-signature',
    'client123'
  );
  console.log('Result:', JSON.stringify(authResult, null, 2));
  console.log();

  // Example 3: Error handling and fallback
  console.log('⚠️  Example 3: Error Handling');
  const errorResult = await mcp.executeSecure('firebase-firestore', {
    type: 'invalid_operation'
  });
  console.log('Result:', JSON.stringify(errorResult, null, 2));
  console.log();

  // Example 4: Health monitoring
  console.log('💓 Example 4: Health Status');
  setTimeout(() => {
    const health = mcp.getSystemStatus();
    console.log('Health Status:', JSON.stringify(health, null, 2));
  }, 2000);

  // Cleanup
  setTimeout(async () => {
    await mcp.shutdown();
    console.log('\n✅ Demo completed successfully!');
  }, 5000);
}

// Security best practices examples
async function securityBestPractices() {
  console.log('\n🛡️  MCP Security Best Practices:\n');

  console.log('1. ✅ Always use HTTPS in production');
  console.log('2. ✅ JWT secrets must be 64+ characters in production');
  console.log('3. ✅ Enable rate limiting for all endpoints');
  console.log('4. ✅ Encrypt sensitive data at rest and in transit');
  console.log('5. ✅ Implement proper error handling and fallbacks');
  console.log('6. ✅ Monitor health and metrics continuously');
  console.log('7. ✅ Use circuit breakers for external dependencies');
  console.log('8. ✅ Log security events for audit compliance');
  console.log('9. ✅ Implement graceful degradation');
  console.log('10. ✅ Regular security audits and testing');

  console.log('\n🔒 GDPR Compliance Features:');
  console.log('- ✅ Data encryption with AES-256-GCM');
  console.log('- ✅ Secure data erasure capabilities');
  console.log('- ✅ Audit logging without PII');
  console.log('- ✅ Consent-based data processing');
  console.log('- ✅ Right to be forgotten support');
}

// Run the demonstration
if (require.main === module) {
  demonstrateUsage()
    .then(() => securityBestPractices())
    .catch(console.error);
}

export { demonstrateUsage, securityBestPractices };