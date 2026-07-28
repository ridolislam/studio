
'use server';

/**
 * @fileOverview Server Actions to proxy requests to the Render backend and handle validation proxying.
 */

const API_BASE = 'https://numcheckr.onrender.com';
const ADMIN_SECRET = 'Ridol123@';
const VERCEL_WORKER_URL = process.env.VERCEL_WORKER_URL || ''; // Set this in your Render environment variables

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
 * Chunks numbers and hits Vercel workers in parallel
 */
export async function validateBatchDistributed(payload: { numbers: string[], email: string }) {
  if (!VERCEL_WORKER_URL) {
    return { success: false, message: "VERCEL_WORKER_URL not configured." };
  }

  const results = [];
  const numbers = payload.numbers;
  
  // 1. Fetch Key (Required for all workers in this batch)
  const keyRes = await getValidationKey(payload.email);
  if (!keyRes.success) return keyRes;
  
  const { apiKey, rapidKey } = keyRes;

  // 2. Prepare Workers
  const workerRequests = numbers.map(number => {
    return fetch(VERCEL_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number, apiKey, rapidKey })
    }).then(res => res.json());
  });

  // 3. Execute in Parallel
  const workerResponses = await Promise.all(workerRequests);

  // 4. Report results individually for credit deduction and logging
  for (let i = 0; i < workerResponses.length; i++) {
    const data = workerResponses[i];
    const number = numbers[i];

    if (data.valid) {
      await reportValidationSuccess({
        email: payload.email,
        key: apiKey,
        number,
        result: data
      });
    } else if (data.error && (data.status === 429 || data.status === 403)) {
      await reportBadKey({ key: apiKey });
    }
    results.push({ number, data });
  }

  return { success: true, results };
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
