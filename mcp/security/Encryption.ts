/**
 * MCP Security - End-to-End Encryption Module
 * AES-256-GCM for authenticated encryption, GDPR compliant
 */

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  ivSize: number;
  tagSize: number;
}

export interface EncryptedData {
  data: string; // base64 encoded
  iv: string;   // base64 encoded
  tag: string;  // base64 encoded
  algorithm: string;
  timestamp: number;
}

export interface KeyDerivationOptions {
  salt: string;
  iterations: number;
  keyLength: number;
}

export class MCPEncryption {
  private config: EncryptionConfig;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  constructor(config?: Partial<EncryptionConfig>) {
    this.config = {
      algorithm: 'AES-GCM',
      keySize: 256,
      ivSize: 12,  // 96 bits for GCM
      tagSize: 16, // 128 bits
      ...config
    };
    this.validateConfig();
  }

  private validateConfig(): void {
    if (this.config.keySize !== 256) {
      throw new Error('Only AES-256 is supported for security compliance');
    }
    if (this.config.ivSize !== 12) {
      throw new Error('IV size must be 12 bytes for AES-GCM');
    }
  }

  // Generate cryptographically secure random key
  async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.config.algorithm,
        length: this.config.keySize
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  // Derive key from password using PBKDF2
  async deriveKey(password: string, options: KeyDerivationOptions): Promise<CryptoKey> {
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const salt = this.base64ToArrayBuffer(options.salt);

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: options.iterations,
        hash: 'SHA-256'
      },
      passwordKey,
      {
        name: this.config.algorithm,
        length: this.config.keySize
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt sensitive data with authenticated encryption
  async encrypt(data: string, key: CryptoKey): Promise<EncryptedData> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(this.config.ivSize));
      const encodedData = this.encoder.encode(data);

      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.config.algorithm,
          iv: iv,
          tagLength: this.config.tagSize * 8
        },
        key,
        encodedData
      );

      // Split encrypted data and authentication tag
      const encrypted = new Uint8Array(encryptedBuffer);
      const encryptedData = encrypted.slice(0, -this.config.tagSize);
      const tag = encrypted.slice(-this.config.tagSize);

      return {
        data: this.arrayBufferToBase64(encryptedData),
        iv: this.arrayBufferToBase64(iv),
        tag: this.arrayBufferToBase64(tag),
        algorithm: this.config.algorithm,
        timestamp: Date.now()
      };

    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Decrypt and verify authenticated data
  async decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
    try {
      if (encryptedData.algorithm !== this.config.algorithm) {
        throw new Error('Algorithm mismatch');
      }

      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const data = this.base64ToArrayBuffer(encryptedData.data);
      const tag = this.base64ToArrayBuffer(encryptedData.tag);

      // Combine data and tag for GCM decryption
      const combined = new Uint8Array(data.byteLength + tag.byteLength);
      combined.set(new Uint8Array(data));
      combined.set(new Uint8Array(tag), data.byteLength);

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.config.algorithm,
          iv: iv,
          tagLength: this.config.tagSize * 8
        },
        key,
        combined
      );

      return this.decoder.decode(decryptedBuffer);

    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Invalid data or key'}`);
    }
  }

  // Generate cryptographically secure salt
  generateSalt(size: number = 32): string {
    const salt = crypto.getRandomValues(new Uint8Array(size));
    return this.arrayBufferToBase64(salt);
  }

  // Secure data erasure (for GDPR compliance)
  secureErase(data: any): void {
    if (typeof data === 'string') {
      // Overwrite string memory (best effort in JS)
      data = '\0'.repeat(data.length);
    } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      // Clear buffer
      new Uint8Array(data).fill(0);
    }
  }

  // Utility methods
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Key export for secure storage
  async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(exported);
  }

  // Key import from secure storage
  async importKey(keyData: string): Promise<CryptoKey> {
    const keyBuffer = this.base64ToArrayBuffer(keyData);
    return await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: this.config.algorithm,
        length: this.config.keySize
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
}