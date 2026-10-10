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
    if (text.toLowerCase().includes('waking up') || text.toLowerCase().includes('starting')) {
      return { success: false, message: 'Server is waking up. Please wait 45-60 seconds.', error: 'WAKING_UP' };
    }
    return { success: false, message: `Server returned non-JSON response: ${response.status}`, raw: text.substring(0, 100) };
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
    return { success: false, message: 'Could not connect to the backend server.' };
  }
}

export async function getActiveServer() {
  try {
    const response = await fetch(`${API_BASE}/api/user/active-server`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, error: 'Could not connect to the backend server.' };
  }
}

export async function getBatchInfo() {
  try {
    const response = await fetch(`${API_BASE}/api/user/batch-info`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    const res = await safeJson(response);
    return res.success ? res : { success: false, recommendedBatchSize: 25, concurrency: 3, keysAvailable: false, activeServer: 1 };
  } catch (error) {
    return { success: false, recommendedBatchSize: 25, concurrency: 3, keysAvailable: false, activeServer: 1 };
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

export async function stopValidation(email: string, runId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/user/stop-validation`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, runId }),
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Failed to send stop signal' };
  }
}

export async function getUserHistory(payload: { email: string; limit?: number }) {
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

export async function getBatchDetails(payload: { email: string; batchId: string; filter?: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/history-batch`, {
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
    return { success: false, message: 'Failed to fetch batch details' };
  }
}

export async function downloadBatchData(payload: { email: string; batchId: string; filter?: string; format: 'csv' | 'txt' }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/history-download`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await safeJson(response);
      throw new Error(errorData.message || 'Download failed');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `numcheckr-batch-${Date.now()}.${payload.format}`;
    
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match && match[1]) filename = match[1];
    }

    return { success: true, blob, filename };
  } catch (error: any) {
    return { success: false, message: error.message || 'Connection failed' };
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

export async function getServerInfo(secret: string) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/server-info`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'admin-secret': secret
      },
      body: JSON.stringify({ secret }),
      cache: 'no-store'
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Failed to fetch server info' };
  }
}

export async function setServer(payload: { secret: string, server: number }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/set-server`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Server switch failed' };
  }
}

export async function uploadPhoneValidatorKeys(payload: { secret: string, keys: string[] }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/upload-phonevalidator`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Key upload failed' };
  }
}

export async function clearPhoneValidatorKeys(payload: { secret: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/clear-phonevalidator-keys`, {
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
      cache: 'no-store'
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Update request failed.' };
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
