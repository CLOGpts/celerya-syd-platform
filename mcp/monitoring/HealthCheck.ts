/**
 * MCP Monitoring - Health Check & Observability System
 * Zero downtime monitoring, GDPR compliant metrics
 */

export interface HealthConfig {
  checkIntervalMs: number;
  timeoutMs: number;
  degradedThresholdMs: number;
  unhealthyThresholdMs: number;
  maxHistorySize: number;
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface HealthCheckResult {
  status: HealthStatus;
  responseTime: number;
  timestamp: number;
  details?: Record<string, any>;
  error?: string;
}

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  lastCheck: HealthCheckResult;
  history: HealthCheckResult[];
  uptime: number;
  errorRate: number;
}

export interface SystemMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  uptime: number;
  lastRestart: number;
}

export interface HealthCheckFunction {
  (): Promise<{ healthy: boolean; details?: Record<string, any> }>;
}

export class MCPHealthCheck {
  private config: HealthConfig;
  private components = new Map<string, ComponentHealth>();
  private metrics: SystemMetrics;
  private startTime = Date.now();
  private responseTimes: number[] = [];
  private checkIntervals = new Map<string, NodeJS.Timeout>();

  constructor(config: HealthConfig) {
    this.config = config;
    this.validateConfig();
    this.metrics = this.initializeMetrics();
  }

  private validateConfig(): void {
    if (this.config.checkIntervalMs < 1000) {
      throw new Error('Check interval must be at least 1 second');
    }
    if (this.config.timeoutMs >= this.config.checkIntervalMs) {
      throw new Error('Timeout must be less than check interval');
    }
  }

  private initializeMetrics(): SystemMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      uptime: 0,
      lastRestart: this.startTime
    };
  }

  // Register a component for health monitoring
  registerComponent(name: string, healthCheckFn: HealthCheckFunction): void {
    if (this.components.has(name)) {
      throw new Error(`Component ${name} is already registered`);
    }

    const component: ComponentHealth = {
      name,
      status: 'unknown',
      lastCheck: {
        status: 'unknown',
        responseTime: 0,
        timestamp: Date.now()
      },
      history: [],
      uptime: 0,
      errorRate: 0
    };

    this.components.set(name, component);

    // Start periodic health checks
    const interval = setInterval(async () => {
      await this.performHealthCheck(name, healthCheckFn);
    }, this.config.checkIntervalMs);

    this.checkIntervals.set(name, interval);

    // Perform initial check
    this.performHealthCheck(name, healthCheckFn);
  }

  // Unregister a component
  unregisterComponent(name: string): void {
    const interval = this.checkIntervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(name);
    }
    this.components.delete(name);
  }

  // Perform health check for a specific component
  private async performHealthCheck(name: string, healthCheckFn: HealthCheckFunction): Promise<void> {
    const component = this.components.get(name);
    if (!component) return;

    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      // Execute health check with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), this.config.timeoutMs);
      });

      const checkResult = await Promise.race([healthCheckFn(), timeoutPromise]);
      const responseTime = Date.now() - startTime;

      result = {
        status: this.determineStatus(checkResult.healthy, responseTime),
        responseTime,
        timestamp: Date.now(),
        details: checkResult.details
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      result = {
        status: 'unhealthy',
        responseTime,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Update component health
    this.updateComponentHealth(component, result);
  }

  private determineStatus(healthy: boolean, responseTime: number): HealthStatus {
    if (!healthy) return 'unhealthy';
    if (responseTime > this.config.unhealthyThresholdMs) return 'unhealthy';
    if (responseTime > this.config.degradedThresholdMs) return 'degraded';
    return 'healthy';
  }

  private updateComponentHealth(component: ComponentHealth, result: HealthCheckResult): void {
    component.lastCheck = result;
    component.status = result.status;

    // Add to history
    component.history.push(result);
    if (component.history.length > this.config.maxHistorySize) {
      component.history.shift();
    }

    // Calculate uptime and error rate
    const recentChecks = component.history.slice(-20); // Last 20 checks
    const healthyChecks = recentChecks.filter(check => check.status === 'healthy').length;
    component.uptime = (healthyChecks / recentChecks.length) * 100;
    component.errorRate = ((recentChecks.length - healthyChecks) / recentChecks.length) * 100;

    // Update global metrics
    this.updateGlobalMetrics(result);
  }

  private updateGlobalMetrics(result: HealthCheckResult): void {
    this.metrics.totalRequests++;

    if (result.status === 'healthy') {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update response times
    this.responseTimes.push(result.responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Calculate percentiles
    this.calculatePercentiles();

    // Calculate average response time
    this.metrics.averageResponseTime =
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;

    // Calculate system uptime
    this.metrics.uptime = Date.now() - this.startTime;
  }

  private calculatePercentiles(): void {
    if (this.responseTimes.length === 0) return;

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    const p99Index = Math.ceil(sorted.length * 0.99) - 1;

    this.metrics.p95ResponseTime = sorted[p95Index] || 0;
    this.metrics.p99ResponseTime = sorted[p99Index] || 0;
  }

  // Get overall system health status
  getSystemHealth(): {
    status: HealthStatus;
    components: ComponentHealth[];
    metrics: SystemMetrics;
    summary: {
      totalComponents: number;
      healthyComponents: number;
      degradedComponents: number;
      unhealthyComponents: number;
    };
  } {
    const components = Array.from(this.components.values());

    const summary = {
      totalComponents: components.length,
      healthyComponents: components.filter(c => c.status === 'healthy').length,
      degradedComponents: components.filter(c => c.status === 'degraded').length,
      unhealthyComponents: components.filter(c => c.status === 'unhealthy').length
    };

    // Determine overall system status
    let systemStatus: HealthStatus = 'healthy';
    if (summary.unhealthyComponents > 0) {
      systemStatus = 'unhealthy';
    } else if (summary.degradedComponents > 0) {
      systemStatus = 'degraded';
    }

    return {
      status: systemStatus,
      components,
      metrics: this.metrics,
      summary
    };
  }

  // Get health status for a specific component
  getComponentHealth(name: string): ComponentHealth | null {
    return this.components.get(name) || null;
  }

  // Record custom metric for observability
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    // In a real implementation, this would send to monitoring system
    console.log(`Metric: ${name} = ${value}`, tags ? `Tags: ${JSON.stringify(tags)}` : '');
  }

  // Create health check endpoint data (for HTTP health checks)
  getHealthEndpointData(): {
    status: HealthStatus;
    timestamp: number;
    uptime: number;
    version?: string;
    checks: Record<string, { status: HealthStatus; responseTime: number }>;
  } {
    const systemHealth = this.getSystemHealth();

    const checks: Record<string, { status: HealthStatus; responseTime: number }> = {};
    systemHealth.components.forEach(component => {
      checks[component.name] = {
        status: component.status,
        responseTime: component.lastCheck.responseTime
      };
    });

    return {
      status: systemHealth.status,
      timestamp: Date.now(),
      uptime: this.metrics.uptime,
      checks
    };
  }

  // Graceful shutdown
  shutdown(): void {
    // Clear all intervals
    this.checkIntervals.forEach(interval => clearInterval(interval));
    this.checkIntervals.clear();
    this.components.clear();
  }
}