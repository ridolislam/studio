'use server';

/**
 * @fileOverview Server Actions for numcheckr Ultimate Distributed System.
 * Proxies requests to the Render backend (https://numcheckr.onrender.com).
 */

const API_BASE = 'https://numcheckr.onrender.com';

async function safeJson(response: Response) {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    const text = await response.text();
    return { success: false, message: text || `Server error: ${response.status}` };
  } catch (err) {
    return { success: false, message: "Failed to parse server response." };
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
    return { success: false, message: 'Sync failed' };
  }
}

export async function stopValidation(email: string) {
  try {
    const response = await fetch(`${API_BASE}/api/user/stop-validation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Failed to send stop signal' };
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

// --- ADMIN ACTIONS ---

export async function uploadRapidKeys(payload: { secret: string, keys: string[] }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/upload-rapid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Upload failed' };
  }
}

export async function uploadNumverifyKeys(payload: { secret: string, keys: string[] }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/upload-numverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Upload failed' };
  }
}

export async function updateAdminUser(payload: { secret: string, userId: string, credits: number }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/update-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Update failed' };
  }
}

export async function clearAdminKeys(payload: { secret: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/clear-all-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Wipe failed' };
  }
}

export async function getAdminStats() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/stats`, { cache: 'no-store' });
    return await safeJson(response);
  } catch (error) {
    return null;
  }
}

export async function getAdminUsers() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/users`, { cache: 'no-store' });
    return await safeJson(response);
  } catch (error) {
    return [];
  }
}

// --- PAYMENT ACTIONS ---

export async function createOxapayInvoice(payload: { email: string, credits: number, payCurrency: string, network: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Payment gateway connection failed' };
  }
}
