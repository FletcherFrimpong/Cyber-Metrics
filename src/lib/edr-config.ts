// EDR Configuration Management with Secure Credential Sources
import { EDRConfig } from './edr-api-client';
import SecureConfigManager, { CredentialSource } from './secure-config';

// Determine credential source based on environment
const getCredentialSource = (): CredentialSource => {
  // Check for production secret management systems first
  if (process.env['VAULT_URL'] && process.env['VAULT_TOKEN']) {
    return {
      type: 'vault',
      config: {
        url: process.env['VAULT_URL'],
        token: process.env['VAULT_TOKEN'],
        path: process.env['VAULT_PATH'] || 'edr-config'
      }
    };
  }

  if (process.env['AWS_SECRETS_SECRET_NAME']) {
    return {
      type: 'aws-secrets',
      config: {
        secretName: process.env['AWS_SECRETS_SECRET_NAME']
      }
    };
  }

  if (process.env['AZURE_KEYVAULT_NAME'] && process.env['AZURE_KEYVAULT_SECRET_NAME']) {
    return {
      type: 'azure-keyvault',
      config: {
        vaultName: process.env['AZURE_KEYVAULT_NAME'],
        secretName: process.env['AZURE_KEYVAULT_SECRET_NAME']
      }
    };
  }

  if (process.env['GCP_PROJECT_ID'] && process.env['GCP_SECRET_ID']) {
    return {
      type: 'gcp-secretmanager',
      config: {
        projectId: process.env['GCP_PROJECT_ID'],
        secretId: process.env['GCP_SECRET_ID']
      }
    };
  }

  // Fallback to environment variables (development)
  return {
    type: 'env',
    config: {}
  };
};

// Convert secure config to EDR config format
const convertSecureConfigToEDRConfig = (secureConfig: any): EDRConfig | null => {
  if (!secureConfig) return null;

  const baseConfig: EDRConfig = {
    platform: secureConfig.platform,
    baseUrl: secureConfig.baseUrl,
    apiKey: secureConfig.credentials?.apiKey || '',
  };

  switch (secureConfig.platform) {
    case 'crowdstrike':
      return {
        ...baseConfig,
        clientId: secureConfig.credentials?.clientId,
        clientSecret: secureConfig.credentials?.clientSecret,
      };

    case 'microsoft-defender':
      return {
        ...baseConfig,
        clientId: secureConfig.credentials?.clientId,
        clientSecret: secureConfig.credentials?.clientSecret,
        tenantId: secureConfig.credentials?.tenantId,
      };

    case 'sentinelone':
    case 'carbon-black':
      return baseConfig;

    default:
      return null;
  }
};

// Main configuration function
const getEDRConfig = async (): Promise<EDRConfig | null> => {
  try {
    const credentialSource = getCredentialSource();
    const secureConfigManager = SecureConfigManager.getInstance();
    
    const secureConfig = await secureConfigManager.getConfig(credentialSource);
    
    if (!secureConfig) {
      console.warn('No EDR platform configured. Using sample data.');
      return null;
    }

    const edrConfig = convertSecureConfigToEDRConfig(secureConfig);
    
    if (!edrConfig) {
      console.error('Failed to convert secure config to EDR config format');
      return null;
    }

    return edrConfig;
  } catch (error) {
    console.error('Failed to get EDR configuration:', error);
    return null;
  }
};

// Configuration validation
export const validateEDRConfig = (config: EDRConfig): boolean => {
  if (!config.platform || !config.baseUrl) {
    return false;
  }

  switch (config.platform) {
    case 'crowdstrike':
      return !!(config.clientId && config.clientSecret);
    case 'microsoft-defender':
      return !!(config.clientId && config.clientSecret && config.tenantId);
    case 'sentinelone':
    case 'carbon-black':
      return !!config.apiKey;
    default:
      return false;
  }
};

export default getEDRConfig;
