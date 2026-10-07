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
      const data = await response.json();
      return data;
    }
    const text = await response.text();
    // Render often returns HTML when the server is starting or has an error
    if (text.toLowerCase().includes('waking up') || text.toLowerCase().includes('starting')) {
      return { success: false, message: 'Server is waking up. Please wait 45-60 seconds.', error: 'WAKING_UP' };
    }
    return { success: false, message: `Server returned non-JSON response: ${response.status}` };
  } catch (err) {
    return { success: false, message: "Failed to parse server response. The server might be offline." };
  }
}

export async function loginUser(payload: { email: string; password?: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    console.error("Login fetch error:", error);
    return { success: false, message: 'Could not connect to the backend server. It might be waking up or offline.' };
  }
}

export async function getBatchInfo() {
  try {
    const response = await fetch(`${API_BASE}/api/user/batch-info`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, recommendedBatchSize: 10 };
  }
}

export async function syncUserProfile(email: string) {
  try {
    const response = await fetch(`${API_BASE}/api/user/profile`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
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
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
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
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Connection failed' };
  }
}

// --- ADMIN ACTIONS ---

export async function getFullDashboardData(secret: string) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/full-dashboard`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ secret }),
      cache: 'no-store'
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Failed to fetch dashboard data' };
  }
}

export async function uploadRapidKeys(payload: { secret: string, keys: string[] }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/upload-rapid`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
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
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
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
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
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
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Wipe failed' };
  }
}

export async function createOxapayInvoice(payload: { email: string, credits: number, payCurrency: string, network: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/create-payment`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Payment gateway connection failed' };
  }
}
