'use server';

/**
 * @fileOverview Server Actions to proxy requests to the Render backend.
 */

const API_BASE = 'https://numcheckr.onrender.com';

async function safeJson(response: Response) {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
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
    return { success: false, message: 'Connection failed to backend.' };
  }
}

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
 * DISTRIBUTED VALIDATION MANAGER
 * Calls the Render distributed endpoint which orchestrates Vercel workers.
 */
export async function validateBatchDistributed(payload: { numbers: string[], email: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/validate-distributed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error: any) {
    return { success: false, message: error.message || "Distributed validation failed." };
  }
}

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
    return { success: false, message: 'Connection failed' };
  }
}
