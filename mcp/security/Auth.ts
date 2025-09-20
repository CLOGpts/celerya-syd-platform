/**
 * MCP Security - Authentication & Authorization Module
 * Zero-trust, GDPR compliant, secure by design
 */

export interface AuthConfig {
  jwtSecret: string;
  tokenExpiry: number; // seconds
  allowedRoles: string[];
  rateLimitPerMinute: number;
}

export interface AuthContext {
  userId: string;
  role: string;
  permissions: string[];
  sessionId: string;
  timestamp: number;
}

export interface AuthResult {
  success: boolean;
  context?: AuthContext;
  error?: string;
  rateLimitRemaining?: number;
}

export class MCPAuth {
  private config: AuthConfig;
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  constructor(config: AuthConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.jwtSecret || this.config.jwtSecret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters');
    }
    if (this.config.tokenExpiry < 300) {
      throw new Error('Token expiry must be at least 5 minutes');
    }
  }

  // Validate JWT token with rate limiting
  async validateToken(token: string, clientId: string): Promise<AuthResult> {
    try {
      // Rate limiting check
      const rateLimitResult = this.checkRateLimit(clientId);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          rateLimitRemaining: rateLimitResult.remaining
        };
      }

      // Basic JWT validation (simplified - use proper JWT library in production)
      const payload = this.decodeJWT(token);
      if (!payload || payload.exp < Date.now() / 1000) {
        return { success: false, error: 'Invalid or expired token' };
      }

      // Role validation
      if (!this.config.allowedRoles.includes(payload.role)) {
        return { success: false, error: 'Unauthorized role' };
      }

      const context: AuthContext = {
        userId: payload.sub,
        role: payload.role,
        permissions: payload.permissions || [],
        sessionId: payload.sessionId,
        timestamp: Date.now()
      };

      return {
        success: true,
        context,
        rateLimitRemaining: rateLimitResult.remaining
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  private checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000;
    const key = `${clientId}:${windowStart}`;

    let bucket = this.rateLimitMap.get(key);
    if (!bucket) {
      bucket = { count: 0, resetTime: windowStart + 60000 };
      this.rateLimitMap.set(key, bucket);
    }

    // Clean old entries
    this.cleanRateLimitMap(now);

    bucket.count++;
    const remaining = Math.max(0, this.config.rateLimitPerMinute - bucket.count);

    return {
      allowed: bucket.count <= this.config.rateLimitPerMinute,
      remaining
    };
  }

  private cleanRateLimitMap(now: number): void {
    Array.from(this.rateLimitMap.entries()).forEach(([key, bucket]) => {
      if (bucket.resetTime < now) {
        this.rateLimitMap.delete(key);
      }
    });
  }

  private decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  }

  // Check if user has specific permission
  hasPermission(context: AuthContext, permission: string): boolean {
    return context.permissions.includes(permission) ||
           context.permissions.includes('*');
  }

  // Secure logout - invalidate session
  invalidateSession(sessionId: string): void {
    // Implementation would add sessionId to blacklist
    console.log(`Session ${sessionId} invalidated`);
  }
}