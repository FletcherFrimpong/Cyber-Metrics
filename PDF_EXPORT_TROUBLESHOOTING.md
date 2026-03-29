# PDF Export Troubleshooting Guide

## 🚨 Error: `TypeError: e[o] is not a function`

### **Problem Description**
This error typically occurs when there's a module loading issue or when the PDF export functionality is called in a server-side rendering (SSR) context where browser APIs are not available.

### **Root Cause Analysis**

The error `TypeError: e[o] is not a function` usually indicates:
1. **SSR/SSG Issues**: Code trying to access browser APIs during server-side rendering
2. **Module Loading Problems**: Issues with dynamic imports or module resolution
3. **Window Object Access**: Attempting to use `window` object before it's available

### **✅ Solutions Implemented**

#### **1. Dynamic Import for Client-Side Only**
```typescript
// Added to trends-analytics.tsx
// Dynamically import the PDF export function
const { generateTrendsAnalyticsPDF } = await import('@/lib/pdf-export');
```

#### **2. Browser Environment Check**
```typescript
// Added to pdf-export.ts
if (typeof window === 'undefined') {
  throw new Error('PDF export is only available in browser environment');
}
```

#### **3. Window Function Availability Check**
```typescript
// Added to pdf-export.ts
if (typeof window.open !== 'function') {
  throw new Error('Window open functionality is not available');
}
```

#### **4. Client-Side Component Check**
```typescript
// Added to trends-analytics.tsx
if (typeof window === 'undefined') {
  alert('PDF export is only available in browser environment');
  return;
}
```

### **🔧 Additional Fixes Applied**

#### **Enhanced Error Handling**
- Better error messages for different failure scenarios
- Graceful fallbacks when browser APIs are unavailable
- Improved window management with proper cleanup

#### **Improved Window Management**
```typescript
const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
```

#### **Better Timing**
- Increased wait time for content loading (1500ms)
- Extended window close delay (2000ms)
- Added window state checks before operations

### **🧪 Testing the Fix**

#### **Manual Test Steps**
1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Trends Analytics**
   - Go to http://localhost:3001
   - Click on "Trends & Analytics"

3. **Test PDF Export**
   - Click "Export Report" button
   - Verify pop-up window opens
   - Check print dialog appears
   - Save as PDF

#### **Browser Console Test**
```javascript
// Open browser console and run:
import { testPDFExport } from './src/lib/pdf-export.test';
testPDFExport();
```

### **🚨 Common Issues and Solutions**

#### **Issue 1: Pop-up Blocked**
**Symptoms**: No new window opens
**Solution**: 
- Allow pop-ups for localhost:3001
- Check browser pop-up blocker settings
- Try different browser (Chrome recommended)

#### **Issue 2: Print Dialog Doesn't Appear**
**Symptoms**: Window opens but no print dialog
**Solution**:
- Wait longer for content to load
- Check if window is still open
- Try refreshing the page

#### **Issue 3: PDF Generation Fails**
**Symptoms**: Error message appears
**Solution**:
- Check browser console for detailed errors
- Ensure sufficient data is available
- Try different time period

### **🔍 Debugging Steps**

#### **1. Check Browser Console**
```javascript
// Add this to browser console to test
console.log('Window object:', typeof window);
console.log('Window.open function:', typeof window.open);
```

#### **2. Verify Data Availability**
```javascript
// Check if data is properly loaded
console.log('Trends data:', window.trendsData);
```

#### **3. Test PDF Export Manually**
```javascript
// Test with mock data
const testData = {
  timeView: "quarterly",
  selectedQuarter: "Q3 2025",
  // ... other required fields
};
generateTrendsAnalyticsPDF(testData);
```

### **📋 Environment Checklist**

#### **Browser Requirements**
- ✅ Chrome 80+ (recommended)
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

#### **Development Environment**
- ✅ Node.js 16+
- ✅ Next.js 13+
- ✅ TypeScript 4.5+

#### **Build Status**
- ✅ `npm run build` succeeds
- ✅ No TypeScript errors
- ✅ No linting errors

### **🔄 Recovery Procedures**

#### **If Error Persists**

1. **Clear Browser Cache**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run dev
   ```

2. **Check Dependencies**
   ```bash
   npm install
   npm run build
   ```

3. **Verify TypeScript Config**
   ```bash
   npx tsc --noEmit
   ```

4. **Test in Different Browser**
   - Try Chrome if using Firefox
   - Try Edge if using Safari

### **📞 Support Information**

#### **Error Reporting**
When reporting issues, include:
- Browser and version
- Operating system
- Error message from console
- Steps to reproduce
- Screenshots if applicable

#### **Alternative Solutions**
If PDF export continues to fail:
1. Use browser's built-in "Print to PDF" feature
2. Take screenshots of the dashboard
3. Export data to CSV format (future feature)

---

**Note**: The PDF export feature has been designed to be robust and handle various edge cases. The implemented fixes should resolve the `TypeError: e[o] is not a function` error in most scenarios.
