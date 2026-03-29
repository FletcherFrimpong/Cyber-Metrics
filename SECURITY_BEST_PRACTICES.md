# Security Best Practices for SignalFoundry

## 🔐 Credential Management

### ❌ NEVER Do This (Security Anti-Patterns)

```typescript
// NEVER hard-code credentials in source code
const config = {
  apiKey: "sk-1234567890abcdef", // ❌ BAD
  clientSecret: "my-secret-key"  // ❌ BAD
};

// NEVER commit credentials to version control
// .env files with secrets should be in .gitignore
```

### ✅ DO This (Security Best Practices)

#### 1. **Environment Variables (Development Only)**

```bash
# .env.local (never commit this file)
NEXT_PUBLIC_EDR_PLATFORM="crowdstrike"
NEXT_PUBLIC_EDR_BASE_URL="https://api.crowdstrike.com"
NEXT_PUBLIC_CROWDSTRIKE_CLIENT_ID="your-client-id"
NEXT_PUBLIC_CROWDSTRIKE_CLIENT_SECRET="your-client-secret"
```

#### 2. **HashiCorp Vault (Production Recommended)**

```bash
# Store secrets in Vault
vault kv put secret/edr-config \
  platform="crowdstrike" \
  baseUrl="https://api.crowdstrike.com" \
  clientId="your-client-id" \
  clientSecret="your-client-secret"

# Access from application
VAULT_URL="https://vault.yourcompany.com"
VAULT_TOKEN="your-vault-token"
VAULT_PATH="edr-config"
```

#### 3. **AWS Secrets Manager**

```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "signal-foundry/edr-config" \
  --description "EDR API credentials" \
  --secret-string '{
    "platform": "crowdstrike",
    "baseUrl": "https://api.crowdstrike.com",
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret"
  }'

# Access from application
AWS_SECRETS_SECRET_NAME="signal-foundry/edr-config"
AWS_REGION="us-east-1"
```

#### 4. **Azure Key Vault**

```bash
# Store secrets in Azure Key Vault
az keyvault secret set \
  --vault-name "your-keyvault" \
  --name "edr-config" \
  --value '{
    "platform": "crowdstrike",
    "baseUrl": "https://api.crowdstrike.com",
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret"
  }'

# Access from application
AZURE_KEYVAULT_NAME="your-keyvault-name"
AZURE_KEYVAULT_SECRET_NAME="edr-config"
```

#### 5. **Google Cloud Secret Manager**

```bash
# Store secrets in GCP Secret Manager
echo '{
  "platform": "crowdstrike",
  "baseUrl": "https://api.crowdstrike.com",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret"
}' | gcloud secrets create edr-config --data-file=-

# Access from application
GCP_PROJECT_ID="your-project-id"
GCP_SECRET_ID="edr-config"
```

## 🛡️ Security Checklist

### Development Environment
- [ ] `.env.local` is in `.gitignore`
- [ ] No hard-coded credentials in source code
- [ ] Use environment variables for local development
- [ ] Regularly rotate development credentials

### Production Environment
- [ ] Use enterprise secret management system
- [ ] Implement proper IAM roles and permissions
- [ ] Enable audit logging for credential access
- [ ] Use least privilege principle
- [ ] Regularly rotate production credentials
- [ ] Monitor for credential exposure

### Application Security
- [ ] Validate all configuration inputs
- [ ] Implement proper error handling (don't expose secrets in errors)
- [ ] Use HTTPS for all API communications
- [ ] Implement request rate limiting
- [ ] Log security events (without sensitive data)

## 🔄 Credential Rotation

### Automated Rotation Strategy

```typescript
// Example: Automated credential rotation
class CredentialRotator {
  async rotateCredentials() {
    // 1. Generate new credentials
    const newCredentials = await this.generateNewCredentials();
    
    // 2. Update secret management system
    await this.updateSecrets(newCredentials);
    
    // 3. Clear application cache
    await this.clearCache();
    
    // 4. Verify new credentials work
    await this.verifyCredentials(newCredentials);
    
    // 5. Notify stakeholders
    await this.notifyRotation();
  }
}
```

### Rotation Schedule
- **Development**: Every 90 days
- **Staging**: Every 60 days
- **Production**: Every 30 days
- **Critical systems**: Every 15 days

## 🚨 Incident Response

### If Credentials Are Compromised

1. **Immediate Actions**
   - Revoke compromised credentials
   - Generate new credentials
   - Update all systems
   - Clear all caches

2. **Investigation**
   - Review access logs
   - Identify exposure scope
   - Document incident

3. **Recovery**
   - Deploy new credentials
   - Verify system functionality
   - Update security measures

4. **Post-Incident**
   - Conduct security review
   - Update procedures
   - Train team members

## 📊 Security Monitoring

### Key Metrics to Monitor
- Credential access patterns
- Failed authentication attempts
- Unusual API usage
- Configuration changes
- Cache hit/miss ratios

### Alerting Rules
```yaml
# Example: Security alerting rules
alerts:
  - name: "Credential Access Anomaly"
    condition: "credential_access > threshold"
    severity: "high"
    
  - name: "Failed Authentication Spike"
    condition: "failed_auth > 10/minute"
    severity: "medium"
    
  - name: "Configuration Change"
    condition: "config_change_detected"
    severity: "low"
```

## 🔧 Implementation Examples

### Secure Configuration Loading

```typescript
// Secure configuration loading with fallback
async function loadSecureConfig() {
  try {
    // Try production secret management first
    const config = await loadFromVault();
    if (config) return config;
    
    // Fallback to environment variables (development)
    const envConfig = await loadFromEnv();
    if (envConfig) return envConfig;
    
    // Final fallback to sample data
    return loadSampleData();
  } catch (error) {
    console.error('Failed to load secure configuration:', error);
    return loadSampleData();
  }
}
```

### Credential Validation

```typescript
// Validate credentials before use
function validateCredentials(config: EDRConfig): boolean {
  // Check for required fields
  if (!config.platform || !config.baseUrl) {
    return false;
  }
  
  // Platform-specific validation
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
}
```

## 📚 Additional Resources

- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Cloud Security Alliance](https://cloudsecurityalliance.org/)
- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [Azure Key Vault Security](https://docs.microsoft.com/en-us/azure/key-vault/general/security-overview)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)

## 🆘 Support

For security-related questions or incidents:
- **Email**: security@yourcompany.com
- **Slack**: #security-incidents
- **Phone**: +1-XXX-XXX-XXXX (24/7)

---

**Remember**: Security is everyone's responsibility. When in doubt, ask the security team!
