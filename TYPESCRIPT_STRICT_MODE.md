# TypeScript Strict Mode Configuration

## 🔧 Current Configuration

The SignalFoundry project uses **strict TypeScript mode** with additional safety checks enabled:

### **Base Strict Mode** ✅
- `"strict": true` - Enables all strict type checking options

### **Additional Safety Checks** ✅

#### **Type Safety**
- `"noImplicitAny": true` - Raise error on expressions and declarations with implied 'any' type
- `"noImplicitThis": true` - Raise error on 'this' expressions with implied 'any' type
- `"noImplicitReturns": true` - Report error when not all code paths in function return a value
- `"exactOptionalPropertyTypes": true` - Enable exact optional property types
- `"noUncheckedIndexedAccess": true` - Include undefined in index signature results
- `"noImplicitOverride": true` - Ensure overriding members are marked with override modifier

#### **Code Quality**
- `"noUnusedLocals": true` - Report errors on unused local variables
- `"noUnusedParameters": true` - Report errors on unused parameters
- `"allowUnusedLabels": false` - Report errors on unused labels
- `"allowUnreachableCode": false` - Report errors on unreachable code
- `"noFallthroughCasesInSwitch": true` - Report errors for fallthrough cases in switch statement
- `"noPropertyAccessFromIndexSignature": true` - Enforces using indexed access for keys declared using an index signature

#### **Consistency**
- `"forceConsistentCasingInFileNames": true` - Ensure consistent casing in file names

## 🚨 Common Issues & Solutions

### **1. Environment Variable Access**
```typescript
// ❌ Wrong - TypeScript strict mode error
const url = process.env.VAULT_URL;

// ✅ Correct - Use bracket notation
const url = process.env['VAULT_URL'];
```

### **2. Optional Property Types**
```typescript
// ❌ Wrong - exactOptionalPropertyTypes error
interface Config {
  apiKey?: string;
}
const config: Config = { apiKey: undefined }; // Error!

// ✅ Correct - Explicit undefined handling
interface Config {
  apiKey?: string | undefined;
}
const config: Config = { apiKey: undefined }; // OK
```

### **3. Index Signature Access**
```typescript
// ❌ Wrong - noPropertyAccessFromIndexSignature error
const value = obj.someProperty; // Error if someProperty not declared

// ✅ Correct - Use bracket notation for dynamic access
const value = obj['someProperty'];
```

### **4. Unchecked Indexed Access**
```typescript
// ❌ Wrong - noUncheckedIndexedAccess error
const item = array[0]; // Type is T | undefined

// ✅ Correct - Add null checks
const item = array[0];
if (item) {
  // Use item safely
}
```

### **5. Async Function Calls**
```typescript
// ❌ Wrong - Missing await
const result = asyncFunction(); // Type is Promise<T>

// ✅ Correct - Use await
const result = await asyncFunction(); // Type is T
```

## 🛠️ Best Practices

### **1. Type Definitions**
```typescript
// Always define explicit types
interface User {
  id: string;
  name: string;
  email?: string | undefined;
}

// Use type guards for runtime checks
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

### **2. Error Handling**
```typescript
// Always handle potential undefined values
const value = someFunction();
if (value === undefined) {
  throw new Error('Value is required');
}
```

### **3. Environment Variables**
```typescript
// Create a type-safe environment configuration
interface EnvConfig {
  readonly VAULT_URL: string;
  readonly VAULT_TOKEN: string;
}

const env: EnvConfig = {
  VAULT_URL: process.env['VAULT_URL'] ?? '',
  VAULT_TOKEN: process.env['VAULT_TOKEN'] ?? '',
};
```

### **4. Array and Object Access**
```typescript
// Safe array access
const firstItem = array[0];
if (firstItem !== undefined) {
  // Use firstItem safely
}

// Safe object property access
const value = obj['dynamicProperty'];
if (value !== undefined) {
  // Use value safely
}
```

## 🔍 Linting Commands

### **Check TypeScript Errors**
```bash
npx tsc --noEmit
```

### **Check with ESLint**
```bash
npx eslint src/**/*.{ts,tsx}
```

### **Fix Auto-fixable Issues**
```bash
npx eslint src/**/*.{ts,tsx} --fix
```

## 📋 Maintenance Checklist

### **Before Committing**
- [ ] Run `npx tsc --noEmit` - No TypeScript errors
- [ ] Run `npx eslint src/**/*.{ts,tsx}` - No linting errors
- [ ] All async functions properly awaited
- [ ] All environment variables use bracket notation
- [ ] All optional properties handle undefined explicitly
- [ ] All array/object access includes null checks

### **Code Review Checklist**
- [ ] No `any` types used
- [ ] All functions have explicit return types
- [ ] All parameters are used or marked with underscore
- [ ] All variables are used or removed
- [ ] No unreachable code
- [ ] Proper error handling for async operations

## 🚀 Benefits

### **1. Catch Bugs Early**
- Type errors caught at compile time
- Runtime errors significantly reduced
- Better IDE support and autocomplete

### **2. Improved Maintainability**
- Self-documenting code through types
- Easier refactoring with confidence
- Better code organization

### **3. Enhanced Developer Experience**
- Better IntelliSense and autocomplete
- Clearer error messages
- Faster development cycles

### **4. Production Reliability**
- Fewer runtime errors in production
- Better performance through type optimization
- Easier debugging and troubleshooting

## 🔧 Configuration Files

### **tsconfig.json**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### **.eslintrc.js**
```javascript
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn'
  }
};
```

---

**Remember**: Strict TypeScript mode is your friend! It helps catch bugs early and makes your code more reliable and maintainable.
