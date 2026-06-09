'use server';

/**
 * @fileOverview Server Actions to proxy requests to the Render backend.
 * Synchronized with the specified Node.js server-side logic.
 */

const API_BASE = 'https://numcheckr.onrender.com';
const ADMIN_SECRET = 'Ridol123@';

/**
 * Safely parse JSON from a response, handling non-JSON error pages gracefully.
 */
async function safeJson(response: Response) {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // If not JSON, it might be an HTML error from the server (e.g. 503 Waking Up)
    const text = await response.text();
    if (text.toLowerCase().includes('waking up') || text.toLowerCase().includes('starting')) {
      return { 
        success: false, 
        message: "Server is waking up from sleep mode. Please try again in 30-45 seconds." 
      };
    }
    
    return { 
      success: false, 
      message: `Unexpected server response: ${response.status} ${response.statusText}` 
    };
  } catch (err) {
    return { success: false, message: "Failed to read response from server." };
  }
}

// User APIs
export async function loginUser(payload: { email: string; password?: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Connection failed to backend. Please check your internet or server status.' };
  }
}

/**
 * Syncs user profile data based on server logic.
 * Expected Response: { success: true, credits: number, historyCount: number }
 */
export async function syncUserProfile(email: string) {
  try {
    const response = await fetch(`${API_BASE}/api/user/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false };
  }
}

/**
 * Fetches user history.
 * Expected Response: { success: true, history: Array } (Reversed by server)
 */
export async function getUserHistory(payload: { email: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Connection failed to fetch history' };
  }
}

export async function validateNumber(payload: { email: string; number: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Validation connection failed' };
  }
}

// Admin APIs
export async function getAdminStats() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: { 
        'admin-secret': ADMIN_SECRET,
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false };
  }
}

export async function getAdminUsers() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      headers: { 
        'admin-secret': ADMIN_SECRET,
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store',
    });
    const result = await safeJson(response);
    return Array.isArray(result) ? result : (result.users || result.data || []);
  } catch (error) {
    return [];
  }
}

/**
 * Updates user credits from Admin Panel.
 */
export async function updateAdminUser(payload: { userId: string; credits: number }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/update-user`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret: ADMIN_SECRET,
        userId: payload.userId,
        credits: payload.credits
      }),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false };
  }
}

/**
 * Uploads API keys from Admin Panel.
 */
export async function uploadAdminKeys(payload: { keys: string[] }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/upload-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keys: payload.keys,
        secret: ADMIN_SECRET
      }),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false };
  }
}

/**
 * Clears all API keys from the database.
 */
export async function clearAdminKeys() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/clear-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: ADMIN_SECRET }),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: "Server connection failed" };
  }
}
