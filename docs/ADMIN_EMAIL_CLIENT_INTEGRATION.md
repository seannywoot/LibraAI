# Admin Email Notifications - Client Integration

## Overview

To enable full tracking of IP addresses and user agents for security notifications, the login form needs to pass this information to the authentication system.

## Current Status

✅ **Server-side tracking works** - The system tracks failed logins and sends notifications  
⚠️ **IP/User Agent tracking** - Currently uses 'unknown' values  
🎯 **Optional enhancement** - Add client-side data collection for better tracking

## Why This Matters

### With IP/User Agent Data
- More accurate new device detection
- Better spike analysis (top IPs)
- Improved security insights
- Geolocation possibilities

### Without IP/User Agent Data
- System still works
- Uses 'unknown' for IP/UA fields
- Less detailed security reports
- Device fingerprinting less accurate

## Implementation Options

### Option 1: Client-Side Collection (Recommended)

Update your login form to collect and pass data:

```javascript
// In your login form component (e.g., src/app/auth/page.js)

async function handleLogin(email, password, role) {
  try {
    // Get user agent (always available)
    const userAgent = navigator.userAgent;
    
    // Get IP address (optional - requires external service)
    let ipAddress = 'unknown';
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
    } catch (error) {
      console.warn('Could not fetch IP address:', error);
    }

    // Sign in with additional data
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      expectedRole: role,
      userAgent,
      ipAddress,
    });

    if (result?.error) {
      // Handle error
    } else {
      // Handle success
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}
```

### Option 2: Server-Side Collection (Alternative)

Collect data on the server from request headers:

```javascript
// In src/app/api/auth/[...nextauth]/route.js

export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials, req) {
        // Extract from request
        const ipAddress = req.headers.get('x-forwarded-for') || 
                         req.headers.get('x-real-ip') || 
                         'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        // Use in tracking
        trackFailedLogin({
          email,
          ipAddress,
          timestamp: Date.now(),
        });

        // Rest of authorize logic...
      }
    })
  ]
};
```

### Option 3: Hybrid Approach (Best)

Combine both methods for maximum reliability:

```javascript
// Client sends if available, server falls back to headers
const ipAddress = credentials?.ipAddress || 
                 req.headers.get('x-forwarded-for') || 
                 'unknown';
const userAgent = credentials?.userAgent || 
                 req.headers.get('user-agent') || 
                 'unknown';
```

## IP Address Services

### Free Options

1. **ipify** (Recommended)
   ```javascript
   const response = await fetch('https://api.ipify.org?format=json');
   const { ip } = await response.json();
   ```

2. **ipapi.co**
   ```javascript
   const response = await fetch('https://ipapi.co/json/');
   const { ip, city, country } = await response.json();
   ```

3. **ip-api.com**
   ```javascript
   const response = await fetch('http://ip-api.com/json/');
   const { query: ip, city, country } = await response.json();
   ```

### With Geolocation

For location data in new device emails:

```javascript
async function getIPInfo() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      ip: data.ip,
      location: `${data.city}, ${data.country_name}`,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    return { ip: 'unknown', location: 'Unknown' };
  }
}
```

## Example: Complete Login Form Update

```javascript
// src/app/auth/page.js (or your login component)

'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // Collect security data
      const userAgent = navigator.userAgent;
      
      // Optional: Get IP address
      let ipAddress = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ipAddress = ipData.ip;
      } catch (err) {
        console.warn('Could not fetch IP:', err);
      }

      // Sign in with security data
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        expectedRole: 'admin', // or 'student'
        userAgent,
        ipAddress,
      });

      if (result?.error) {
        // Handle error
        console.error('Login failed:', result.error);
      } else {
        // Redirect on success
        window.location.href = '/admin/dashboard';
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

## Privacy Considerations

### What to Collect
✅ User agent (browser/OS info)  
✅ IP address (for security)  
✅ Approximate location (city/country)  

### What NOT to Collect
❌ Precise GPS coordinates  
❌ Device identifiers  
❌ Personal browsing history  

### User Disclosure
Add to your privacy policy:
> "We collect IP addresses and browser information for security purposes, including detecting unauthorized access attempts and notifying administrators of suspicious activity."

## Testing

### Test with IP Collection

1. Update login form with IP collection
2. Login as admin
3. Check email for new device notification
4. Verify IP address is shown correctly

### Test without IP Collection

1. Use current implementation
2. Login as admin
3. Email will show "IP: unknown"
4. System still works, just less detailed

## Production Considerations

### Rate Limiting
IP services may have rate limits:
- ipify: 1000 requests/day (free)
- ipapi.co: 1000 requests/day (free)
- Consider caching IP for session

### Error Handling
Always handle IP fetch failures gracefully:
```javascript
try {
  const ip = await fetchIP();
} catch (error) {
  // Continue with 'unknown'
  const ip = 'unknown';
}
```

### Performance
IP lookup adds ~100-300ms to login:
- Do it asynchronously if possible
- Cache result for session
- Don't block login on IP fetch failure

## Alternative: Server-Side Only

If you prefer not to modify client code:

```javascript
// In authorize function
const forwarded = req.headers.get('x-forwarded-for');
const ipAddress = forwarded ? forwarded.split(',')[0] : 
                 req.headers.get('x-real-ip') || 
                 'unknown';

const userAgent = req.headers.get('user-agent') || 'unknown';
```

**Note**: This works but may not be accurate behind proxies/CDNs.

## Summary

| Approach | Accuracy | Complexity | Recommended |
|----------|----------|------------|-------------|
| Client-side | High | Medium | ✅ Yes |
| Server-side | Medium | Low | ⚠️ Fallback |
| Hybrid | Highest | Medium | ✅ Best |
| None | N/A | None | ✅ Works |

## Current Status

✅ **System works without IP/UA data**  
✅ **Notifications send successfully**  
✅ **Security tracking functional**  
⏳ **IP/UA collection is optional enhancement**  

You can use the system as-is, or enhance it with IP/UA collection for better tracking.

---

**The admin email notification system is fully functional without client integration. This is an optional enhancement for better security insights.**
