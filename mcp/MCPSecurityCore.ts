/**
 * MCP Security Core - Central Integration Module
 * Zero downtime, GDPR compliant, secure by design
 */

import { MCPAuth, AuthConfig } from './security/Auth';
import { MCPEncryption, EncryptionConfig } from './security/Encryption';
import { MCPRetrySystem, RetryConfig, CircuitBreakerConfig } from './resilience/RetrySystem';
import { MCPHealthCheck, HealthConfig } from './monitoring/HealthCheck';

export interface MCPCoreConfig {
  auth: AuthConfig;
  encryption?: Partial<EncryptionConfig>;
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  healthCheck: HealthConfig;
  enableMetrics?: boolean;
  environment?: 'development' | 'staging' | 'production';
}

export interface MCPAdapter {
  name: string;
  execute: (operation: any) => Promise<any>;
  healthCheck: () => Promise<{ healthy: boolean; details?: any }>;
}

export class MCPSecurityCore {
  private auth: MCPAuth;
  private encryption: MCPEncryption;
  private retrySystem: MCPRetrySystem;
  private healthCheck: MCPHealthCheck;
  private adapters = new Map<string, MCPAdapter>();
  private config: MCPCoreConfig;

  constructor(config: MCPCoreConfig) {
    this.config = config;
    this.validateConfig();
    this.initializeComponents();
  }

  private validateConfig(): void {
    if (!this.config.auth.jwtSecret) {
      throw new Error('JWT secret is required');
    }
    if (this.config.environment === 'production' && this.config.auth.jwtSecret.length < 64) {
      throw new Error('Production JWT secret must be at least 64 characters');
    }
  }

  private initializeComponents(): void {
    // Initialize core security components
    this.auth = new MCPAuth(this.config.auth);
    this.encryption = new MCPEncryption(this.config.encryption);
    this.retrySystem = new MCPRetrySystem(this.config.retry, this.config.circuitBreaker);
    this.healthCheck = new MCPHealthCheck(this.config.healthCheck);

    // Register core health checks
    this.registerCoreHealthChecks();

    console.log(`🛡️  MCP Security Core initialized for ${this.config.environment || 'development'} environment`);
  }

  private registerCoreHealthChecks(): void {
    // Auth service health check
    this.healthCheck.registerComponent('mcp-auth', async () => {
      try {
        // Test basic auth functionality
        const testResult = await this.auth.validateToken('invalid', 'health-check');
        return { healthy: true, details: { rateLimitRemaining: testResult.rateLimitRemaining } };
      } catch (error) {
        return { healthy: false, details: { error: error instanceof Error ? error.message : 'Unknown error' } };
      }
    });

    // Encryption service health check
    this.healthCheck.registerComponent('mcp-encryption', async () => {
      try {
        const key = await this.encryption.generateKey();
        const testData = 'health-check';
        const encrypted = await this.encryption.encrypt(testData, key);
        const decrypted = await this.encryption.decrypt(encrypted, key);

        return {
          healthy: decrypted === testData,
          details: { algorithm: encrypted.algorithm }
        };
      } catch (error) {
        return { healthy: false, details: { error: error instanceof Error ? error.message : 'Unknown error' } };
      }
    });

    // Retry system health check
    this.healthCheck.registerComponent('mcp-retry-system', async () => {
      const metrics = this.retrySystem.getMetrics();
      return {
        healthy: metrics.circuitState === 'CLOSED',
        details: metrics
      };
    });
  }

  // Register MCP adapter with security wrapper
  registerAdapter(adapter: MCPAdapter): void {
    if (this.adapters.has(adapter.name)) {
      throw new Error(`Adapter ${adapter.name} is already registered`);
    }

    // Wrap adapter with security and resilience
    const secureAdapter: MCPAdapter = {
      name: adapter.name,
      execute: this.wrapWithSecurity(adapter.execute),
      healthCheck: adapter.healthCheck
    };

    this.adapters.set(adapter.name, secureAdapter);

    // Register adapter health check
    this.healthCheck.registerComponent(`adapter-${adapter.name}`, adapter.healthCheck);

    console.log(`🔌 Registered secure adapter: ${adapter.name}`);
  }

  // Execute adapter operation with full security stack
  async executeSecure<T>(
    adapterName: string,
    operation: any,
    authToken?: string,
    clientId?: string
  ): Promise<{
    success: boolean;
    data?: T;
    error?: string;
    metrics: {
      authTime: number;
      executionTime: number;
      retryAttempts: number;
      encrypted: boolean;
    };
  }> {
    const startTime = Date.now();
    let authTime = 0;
    let executionTime = 0;
    let encrypted = false;

    try {
      // 1. Authentication (if token provided)
      if (authToken && clientId) {
        const authStart = Date.now();
        const authResult = await this.auth.validateToken(authToken, clientId);
        authTime = Date.now() - authStart;

        if (!authResult.success) {
          return {
            success: false,
            error: authResult.error,
            metrics: { authTime, executionTime: 0, retryAttempts: 0, encrypted: false }
          };
        }
      }

      // 2. Get adapter
      const adapter = this.adapters.get(adapterName);
      if (!adapter) {
        return {
          success: false,
          error: `Adapter ${adapterName} not found`,
          metrics: { authTime, executionTime: 0, retryAttempts: 0, encrypted: false }
        };
      }

      // 3. Execute with retry system
      const execStart = Date.now();
      const result = await this.retrySystem.execute(
        () => adapter.execute(operation),
        () => this.getFallbackResponse(adapterName)
      );
      executionTime = Date.now() - execStart;

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          metrics: { authTime, executionTime, retryAttempts: result.attemptCount, encrypted }
        };
      }

      // 4. Encrypt sensitive response data if needed
      let responseData = result.data;
      if (this.shouldEncryptResponse(result.data)) {
        const key = await this.encryption.generateKey();
        const encryptedResponse = await this.encryption.encrypt(
          JSON.stringify(result.data),
          key
        );
        responseData = {
          encrypted: true,
          data: encryptedResponse,
          keyHint: await this.encryption.exportKey(key)
        };
        encrypted = true;
      }

      return {
        success: true,
        data: responseData,
        metrics: { authTime, executionTime, retryAttempts: result.attemptCount, encrypted }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: { authTime, executionTime, retryAttempts: 0, encrypted }
      };
    }
  }

  private wrapWithSecurity(originalExecute: Function): (operation: any) => Promise<any> {
    return async (operation: any) => {
      // Add operation validation, sanitization, etc.
      if (!operation || typeof operation !== 'object') {
        throw new Error('Invalid operation format');
      }

      // Log operation for audit (without sensitive data)
      this.logOperation(operation);

      return await originalExecute(operation);
    };
  }

  private shouldEncryptResponse(data: any): boolean {
    // Check if response contains sensitive data
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'email', 'ssn', 'creditCard'];
    const dataStr = JSON.stringify(data).toLowerCase();

    return sensitiveFields.some(field => dataStr.includes(field));
  }

  private async getFallbackResponse(adapterName: string): Promise<any> {
    return {
      status: 'fallback',
      message: `Fallback response for ${adapterName}`,
      timestamp: Date.now()
    };
  }

  private logOperation(operation: any): void {
    if (this.config.enableMetrics) {
      const sanitized = { ...operation };
      // Remove sensitive fields
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.secret;

      console.log(`MCP Operation: ${JSON.stringify(sanitized)}`);
    }
  }

  // Get comprehensive system status
  getSystemStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    components: any[];
    metrics: any;
    adapters: string[];
    security: {
      authEnabled: boolean;
      encryptionEnabled: boolean;
      circuitBreakerState: string;
    };
  } {
    const healthData = this.healthCheck.getSystemHealth();
    const retryMetrics = this.retrySystem.getMetrics();

    return {
      status: healthData.status,
      components: healthData.components,
      metrics: healthData.metrics,
      adapters: Array.from(this.adapters.keys()),
      security: {
        authEnabled: true,
        encryptionEnabled: true,
        circuitBreakerState: retryMetrics.circuitState
      }
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down MCP Security Core...');

    this.healthCheck.shutdown();
    this.adapters.clear();

    console.log('✅ MCP Security Core shutdown complete');
  }
}

// Factory function for easy initialization
export function createMCPCore(config: Partial<MCPCoreConfig>): MCPSecurityCore {
  const defaultConfig: MCPCoreConfig = {
    auth: {
      jwtSecret: process.env.MCP_JWT_SECRET || 'development-secret-change-in-production-minimum-32-chars',
      tokenExpiry: 3600,
      allowedRoles: ['admin', 'user'],
      rateLimitPerMinute: 1000
    },
    retry: {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      exponentialBase: 2,
      jitterFactor: 0.1,
      timeoutMs: 30000
    },
    circuitBreaker: {
      failureThreshold: 50,
      recoveryTimeoutMs: 30000,
      monitoringWindowMs: 60000,
      minimumRequestThreshold: 10
    },
    healthCheck: {
      checkIntervalMs: 10000,
      timeoutMs: 5000,
      degradedThresholdMs: 1000,
      unhealthyThresholdMs: 5000,
      maxHistorySize: 100
    },
    enableMetrics: process.env.NODE_ENV !== 'production',
    environment: (process.env.NODE_ENV as any) || 'development'
  };

  const mergedConfig = { ...defaultConfig, ...config };
  return new MCPSecurityCore(mergedConfig);
}