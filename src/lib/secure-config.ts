// Secure Configuration Management System
// Supports multiple credential sources with validation
// IMPORTANT: Never use NEXT_PUBLIC_ prefix for secrets — those are exposed to the browser.

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
}

export interface CredentialSource {
  type: 'env' | 'vault' | 'aws-secrets' | 'azure-keyvault' | 'gcp-secretmanager';
  config: any;
}

class SecureConfigManager {
  private static instance: SecureConfigManager;
  private configCache: Map<string, SecureEDRConfig> = new Map();

  private constructor() {}

  static getInstance(): SecureConfigManager {
    if (!SecureConfigManager.instance) {
      SecureConfigManager.instance = new SecureConfigManager();
    }
    return SecureConfigManager.instance;
  }

  // Get configuration from server-side environment variables only
  async getConfigFromEnv(): Promise<SecureEDRConfig | null> {
    const platform = process.env.EDR_PLATFORM as SecureEDRConfig['platform'];

    if (!platform) return null;

    const baseConfig: SecureEDRConfig = {
      platform,
      baseUrl: process.env.EDR_BASE_URL || '',
      credentials: { type: 'api-key' },
    };

    switch (platform) {
      case 'crowdstrike':
        return {
          ...baseConfig,
          credentials: {
            type: 'oauth2',
            clientId: process.env.CROWDSTRIKE_CLIENT_ID,
            clientSecret: process.env.CROWDSTRIKE_CLIENT_SECRET,
          },
        };
      case 'microsoft-defender':
        return {
          ...baseConfig,
          credentials: {
            type: 'azure-ad',
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            tenantId: process.env.MICROSOFT_TENANT_ID,
          },
        };
      case 'sentinelone':
      case 'carbon-black':
        return {
          ...baseConfig,
          credentials: {
            type: 'api-key',
            apiKey: process.env.EDR_API_KEY,
          },
        };
      default:
        return null;
    }
  }

  // Get configuration from HashiCorp Vault
  async getConfigFromVault(vaultConfig: {
    url: string;
    token: string;
    path: string;
  }): Promise<SecureEDRConfig | null> {
    try {
      const response = await fetch(`${vaultConfig.url}/v1/secret/data/${vaultConfig.path}`, {
        headers: {
          'X-Vault-Token': vaultConfig.token,
          'Content-Type': 'application/json',
        },
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

  // Main method to get configuration from preferred source
  async getConfig(source: CredentialSource): Promise<SecureEDRConfig | null> {
    const cacheKey = `${source.type}`;

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
      default:
        console.warn(`Credential source "${source.type}" not yet implemented, falling back to env`);
        config = await this.getConfigFromEnv();
    }

    if (config && this.validateConfig(config)) {
      this.configCache.set(cacheKey, config);
      return config;
    }

    return null;
  }

  private validateConfig(config: SecureEDRConfig): boolean {
    if (!config.platform || !config.baseUrl) return false;

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

  clearCache(): void {
    this.configCache.clear();
  }
}

export default SecureConfigManager;
