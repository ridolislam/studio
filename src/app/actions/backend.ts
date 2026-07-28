
'use server';

/**
 * @fileOverview Server Actions to proxy requests to the Render backend and handle validation proxying.
 */

const API_BASE = 'https://numcheckr.onrender.com';
const ADMIN_SECRET = 'Ridol123@';
const VERCEL_WORKER_URL = process.env.VERCEL_WORKER_URL || ''; 

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

export async function getValidationKey(email: string) {
  try {
    const response = await fetch(`${API_BASE}/api/user/get-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Failed to fetch validation keys' };
  }
}

export async function reportValidationSuccess(payload: { email: string; key: string; number: string; result: any }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/report-success`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false, message: 'Failed to report success' };
  }
}

export async function reportBadKey(payload: { key: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/report-bad-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false };
  }
}

/**
 * DISTRIBUTED MANAGER LOGIC
 * Parallel worker execution with Unlimited Threads mindset.
 */
export async function validateBatchDistributed(payload: { numbers: string[], email: string }) {
  if (!VERCEL_WORKER_URL) {
    return { success: false, message: "VERCEL_WORKER_URL not configured. Please set it in Render Env." };
  }

  try {
    // 1. Fetch Keys for the batch
    const keyRes = await getValidationKey(payload.email);
    if (!keyRes.success) return keyRes;
    
    const { apiKey, rapidKey } = keyRes;

    // 2. Prepare Workers for the entire batch in parallel (Unlimited Threads)
    const workerRequests = payload.numbers.map(number => 
      fetch(VERCEL_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, apiKey, rapidKey }),
      }).then(res => res.json())
    );

    // 3. Execute all workers simultaneously
    const workerResponses = await Promise.all(workerRequests);

    // 4. Report and process results
    const finalResults = [];
    for (let i = 0; i < workerResponses.length; i++) {
      const data = workerResponses[i];
      const number = payload.numbers[i];

      if (data.valid) {
        // Success reporting (can also be done in parallel, but sequential ensures credit accuracy)
        await reportValidationSuccess({
          email: payload.email,
          key: apiKey,
          number,
          result: data
        });
      } else if (data.error && (data.status === 429 || data.status === 403)) {
        await reportBadKey({ key: apiKey });
      }
      finalResults.push({ number, data });
    }

    return { success: true, results: finalResults };
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

export async function getAdminStats() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: { 'admin-secret': ADMIN_SECRET },
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
      headers: { 'admin-secret': ADMIN_SECRET },
      cache: 'no-store',
    });
    return await safeJson(response);
  } catch (error) {
    return [];
  }
}

export async function updateAdminUser(payload: { userId: string; credits: number }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/update-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: ADMIN_SECRET, userId: payload.userId, credits: payload.credits }),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false };
  }
}

export async function uploadAdminKeys(payload: { keys: string[] }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/upload-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: payload.keys, secret: ADMIN_SECRET }),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false };
  }
}

export async function clearAdminKeys() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/clear-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: ADMIN_SECRET }),
    });
    return await safeJson(response);
  } catch (error) {
    return { success: false };
  }
}
