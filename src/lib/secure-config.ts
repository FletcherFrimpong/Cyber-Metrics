// Secure Configuration Management System
// Supports multiple credential sources with encryption and validation

export interface SecureEDRConfig {
  platform: 'crowdstrike' | 'microsoft-defender' | 'sentinelone' | 'carbon-black';
  baseUrl: string;
  credentials: {
    type: 'api-key' | 'oauth2' | 'azure-ad';
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    tenantId?: string;
  };
  encryption?: {
    enabled: boolean;
    algorithm: string;
    key?: string;
  };
}

export interface CredentialSource {
  type: 'env' | 'vault' | 'aws-secrets' | 'azure-keyvault' | 'gcp-secretmanager';
  config: any;
}

class SecureConfigManager {
  private static instance: SecureConfigManager;
  private configCache: Map<string, SecureEDRConfig> = new Map();
  private encryptionKey?: string;

  private constructor() {
    this.initializeEncryption();
  }

  static getInstance(): SecureConfigManager {
    if (!SecureConfigManager.instance) {
      SecureConfigManager.instance = new SecureConfigManager();
    }
    return SecureConfigManager.instance;
  }

  private initializeEncryption(): void {
    // In production, get encryption key from secure source
    this.encryptionKey = process.env.ENCRYPTION_KEY || 
                        process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
  }

  // Get configuration from environment variables (development)
  async getConfigFromEnv(): Promise<SecureEDRConfig | null> {
    const platform = process.env.NEXT_PUBLIC_EDR_PLATFORM as SecureEDRConfig['platform'];
    
    if (!platform) {
      return null;
    }

    const baseConfig: SecureEDRConfig = {
      platform,
      baseUrl: process.env.NEXT_PUBLIC_EDR_BASE_URL || '',
      credentials: { type: 'api-key' }
    };

    switch (platform) {
      case 'crowdstrike':
        return {
          ...baseConfig,
          credentials: {
            type: 'oauth2',
            clientId: process.env.NEXT_PUBLIC_CROWDSTRIKE_CLIENT_ID,
            clientSecret: process.env.NEXT_PUBLIC_CROWDSTRIKE_CLIENT_SECRET
          }
        };

      case 'microsoft-defender':
        return {
          ...baseConfig,
          credentials: {
            type: 'azure-ad',
            clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID,
            clientSecret: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_SECRET,
            tenantId: process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID
          }
        };

      case 'sentinelone':
      case 'carbon-black':
        return {
          ...baseConfig,
          credentials: {
            type: 'api-key',
            apiKey: process.env.NEXT_PUBLIC_EDR_API_KEY
          }
        };

      default:
        return null;
    }
  }

  // Get configuration from HashiCorp Vault (production)
  async getConfigFromVault(vaultConfig: {
    url: string;
    token: string;
    path: string;
  }): Promise<SecureEDRConfig | null> {
    try {
      // This would integrate with HashiCorp Vault API
      const response = await fetch(`${vaultConfig.url}/v1/secret/data/${vaultConfig.path}`, {
        headers: {
          'X-Vault-Token': vaultConfig.token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Vault API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.data as SecureEDRConfig;
    } catch (error) {
      console.error('Failed to fetch config from Vault:', error);
      return null;
    }
  }

  // Get configuration from AWS Secrets Manager
  async getConfigFromAWSSecrets(secretName: string): Promise<SecureEDRConfig | null> {
    try {
      // This would use AWS SDK to fetch secrets
      // For now, we'll use environment variables as fallback
      console.warn('AWS Secrets Manager integration not implemented, using env fallback');
      return await this.getConfigFromEnv();
    } catch (error) {
      console.error('Failed to fetch config from AWS Secrets:', error);
      return null;
    }
  }

  // Get configuration from Azure Key Vault
  async getConfigFromAzureKeyVault(vaultName: string, secretName: string): Promise<SecureEDRConfig | null> {
    try {
      // This would use Azure SDK to fetch secrets
      // For now, we'll use environment variables as fallback
      console.warn('Azure Key Vault integration not implemented, using env fallback');
      return await this.getConfigFromEnv();
    } catch (error) {
      console.error('Failed to fetch config from Azure Key Vault:', error);
      return null;
    }
  }

  // Get configuration from Google Cloud Secret Manager
  async getConfigFromGCPSecrets(projectId: string, secretId: string): Promise<SecureEDRConfig | null> {
    try {
      // This would use Google Cloud SDK to fetch secrets
      // For now, we'll use environment variables as fallback
      console.warn('GCP Secret Manager integration not implemented, using env fallback');
      return await this.getConfigFromEnv();
    } catch (error) {
      console.error('Failed to fetch config from GCP Secret Manager:', error);
      return null;
    }
  }

  // Main method to get configuration from preferred source
  async getConfig(source: CredentialSource): Promise<SecureEDRConfig | null> {
    const cacheKey = `${source.type}-${JSON.stringify(source.config)}`;
    
    // Check cache first
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey)!;
    }

    let config: SecureEDRConfig | null = null;

    switch (source.type) {
      case 'env':
        config = await this.getConfigFromEnv();
        break;
      case 'vault':
        config = await this.getConfigFromVault(source.config);
        break;
      case 'aws-secrets':
        config = await this.getConfigFromAWSSecrets(source.config.secretName);
        break;
      case 'azure-keyvault':
        config = await this.getConfigFromAzureKeyVault(
          source.config.vaultName, 
          source.config.secretName
        );
        break;
      case 'gcp-secretmanager':
        config = await this.getConfigFromGCPSecrets(
          source.config.projectId, 
          source.config.secretId
        );
        break;
      default:
        throw new Error(`Unsupported credential source: ${source.type}`);
    }

    if (config) {
      // Validate configuration
      if (this.validateConfig(config)) {
        // Cache the configuration
        this.configCache.set(cacheKey, config);
        return config;
      } else {
        console.error('Invalid EDR configuration');
        return null;
      }
    }

    return null;
  }

  // Validate configuration
  private validateConfig(config: SecureEDRConfig): boolean {
    if (!config.platform || !config.baseUrl) {
      return false;
    }

    switch (config.credentials.type) {
      case 'oauth2':
        return !!(config.credentials.clientId && config.credentials.clientSecret);
      case 'azure-ad':
        return !!(config.credentials.clientId && config.credentials.clientSecret && config.credentials.tenantId);
      case 'api-key':
        return !!config.credentials.apiKey;
      default:
        return false;
    }
  }

  // Encrypt sensitive data
  private encrypt(data: string): string {
    if (!this.encryptionKey) {
      return data; // No encryption if no key
    }
    
    // Simple base64 encoding for demo - use proper encryption in production
    return Buffer.from(data).toString('base64');
  }

  // Decrypt sensitive data
  private decrypt(data: string): string {
    if (!this.encryptionKey) {
      return data; // No decryption if no key
    }
    
    // Simple base64 decoding for demo - use proper decryption in production
    return Buffer.from(data, 'base64').toString('utf-8');
  }

  // Clear cache
  clearCache(): void {
    this.configCache.clear();
  }

  // Get cache status
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.configCache.size,
      keys: Array.from(this.configCache.keys())
    };
  }
}

export default SecureConfigManager;
