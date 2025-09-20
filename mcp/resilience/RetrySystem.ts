/**
 * MCP Resilience - Retry System with Circuit Breaker
 * Exponential backoff, circuit breaker pattern, zero downtime design
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  jitterFactor: number;
  timeoutMs: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  monitoringWindowMs: number;
  minimumRequestThreshold: number;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attemptCount: number;
  totalTimeMs: number;
  circuitBreakerState: CircuitState;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface OperationMetrics {
  totalRequests: number;
  failures: number;
  lastFailureTime: number;
  averageResponseTime: number;
}

export class MCPRetrySystem {
  private retryConfig: RetryConfig;
  private circuitConfig: CircuitBreakerConfig;
  private circuitState: CircuitState = 'CLOSED';
  private metrics: OperationMetrics = {
    totalRequests: 0,
    failures: 0,
    lastFailureTime: 0,
    averageResponseTime: 0
  };
  private stateChangeTime = Date.now();

  constructor(retryConfig: RetryConfig, circuitConfig: CircuitBreakerConfig) {
    this.retryConfig = retryConfig;
    this.circuitConfig = circuitConfig;
    this.validateConfigs();
  }

  private validateConfigs(): void {
    if (this.retryConfig.maxAttempts < 1) {
      throw new Error('Max attempts must be at least 1');
    }
    if (this.circuitConfig.failureThreshold < 1) {
      throw new Error('Failure threshold must be at least 1');
    }
  }

  // Execute operation with retry and circuit breaker
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
    operationId?: string
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    // Check circuit breaker state
    if (this.circuitState === 'OPEN') {
      if (this.shouldAttemptRecovery()) {
        this.circuitState = 'HALF_OPEN';
        this.stateChangeTime = Date.now();
      } else {
        // Circuit is open, try fallback
        if (fallback) {
          try {
            const data = await fallback();
            return {
              success: true,
              data,
              attemptCount: 0,
              totalTimeMs: Date.now() - startTime,
              circuitBreakerState: this.circuitState
            };
          } catch (error) {
            return {
              success: false,
              error: `Circuit open and fallback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              attemptCount: 0,
              totalTimeMs: Date.now() - startTime,
              circuitBreakerState: this.circuitState
            };
          }
        }

        return {
          success: false,
          error: 'Circuit breaker is OPEN',
          attemptCount: 0,
          totalTimeMs: Date.now() - startTime,
          circuitBreakerState: this.circuitState
        };
      }
    }

    // Retry loop with exponential backoff
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        const operationStartTime = Date.now();

        // Execute with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), this.retryConfig.timeoutMs);
        });

        const data = await Promise.race([operation(), timeoutPromise]);

        const operationTime = Date.now() - operationStartTime;
        this.recordSuccess(operationTime);

        return {
          success: true,
          data,
          attemptCount: attempt,
          totalTimeMs: Date.now() - startTime,
          circuitBreakerState: this.circuitState
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.recordFailure();

        // Check if we should break circuit
        if (this.shouldOpenCircuit()) {
          this.circuitState = 'OPEN';
          this.stateChangeTime = Date.now();
          break;
        }

        // Don't retry on last attempt
        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }

    // All retries failed, try fallback
    if (fallback) {
      try {
        const data = await fallback();
        return {
          success: true,
          data,
          attemptCount: this.retryConfig.maxAttempts,
          totalTimeMs: Date.now() - startTime,
          circuitBreakerState: this.circuitState
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: `Primary and fallback failed. Last error: ${lastError?.message || 'Unknown error'}`,
          attemptCount: this.retryConfig.maxAttempts,
          totalTimeMs: Date.now() - startTime,
          circuitBreakerState: this.circuitState
        };
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      attemptCount: this.retryConfig.maxAttempts,
      totalTimeMs: Date.now() - startTime,
      circuitBreakerState: this.circuitState
    };
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.retryConfig.baseDelayMs *
      Math.pow(this.retryConfig.exponentialBase, attempt - 1);

    const delayWithCap = Math.min(exponentialDelay, this.retryConfig.maxDelayMs);

    // Add jitter to avoid thundering herd
    const jitter = delayWithCap * this.retryConfig.jitterFactor * Math.random();

    return Math.floor(delayWithCap + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private recordSuccess(responseTime: number): void {
    this.metrics.totalRequests++;
    this.updateAverageResponseTime(responseTime);

    if (this.circuitState === 'HALF_OPEN') {
      this.circuitState = 'CLOSED';
      this.stateChangeTime = Date.now();
      this.resetFailureCount();
    }
  }

  private recordFailure(): void {
    this.metrics.totalRequests++;
    this.metrics.failures++;
    this.metrics.lastFailureTime = Date.now();
  }

  private shouldOpenCircuit(): boolean {
    if (this.circuitState === 'OPEN') return false;

    const now = Date.now();
    const windowStart = now - this.circuitConfig.monitoringWindowMs;

    // Check if we have enough requests in the monitoring window
    if (this.metrics.totalRequests < this.circuitConfig.minimumRequestThreshold) {
      return false;
    }

    // Calculate failure rate in monitoring window
    const failureRate = this.metrics.failures / this.metrics.totalRequests;
    const threshold = this.circuitConfig.failureThreshold / 100; // Convert to decimal

    return failureRate >= threshold;
  }

  private shouldAttemptRecovery(): boolean {
    const now = Date.now();
    return (now - this.stateChangeTime) >= this.circuitConfig.recoveryTimeoutMs;
  }

  private updateAverageResponseTime(responseTime: number): void {
    if (this.metrics.averageResponseTime === 0) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      // Exponential moving average
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
    }
  }

  private resetFailureCount(): void {
    this.metrics.failures = 0;
    this.metrics.totalRequests = 0;
  }

  // Get current system health metrics
  getMetrics(): OperationMetrics & { circuitState: CircuitState } {
    return {
      ...this.metrics,
      circuitState: this.circuitState
    };
  }

  // Reset circuit breaker state
  resetCircuit(): void {
    this.circuitState = 'CLOSED';
    this.stateChangeTime = Date.now();
    this.resetFailureCount();
  }
}