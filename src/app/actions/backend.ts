
'use server';

/**
 * @fileOverview Server Actions to proxy requests to the Render backend and handle validation proxying.
 */

const API_BASE = 'https://numcheckr.onrender.com';
const ADMIN_SECRET = 'Ridol123@';

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
 * New Proxy Validation Endpoint (Server-Side)
 * This acts as the middleman between Browser -> Render -> (Future VPS) -> RapidAPI
 */
export async function validateNumberProxy(email: string, number: string) {
  try {
    // 1. Get Key from Render Backend
    const keyRes = await getValidationKey(email);
    if (!keyRes || !keyRes.success) {
      return { success: false, message: 'No API keys available' };
    }

    const { apiKey, rapidKey } = keyRes;

    // 2. Perform Validation (Currently from Render, will be VPS in future)
    // For now, testing directly from Render's runtime
    const response = await fetch(
      `https://apilayer-numverify-v1.p.rapidapi.com/validate?number=${number}&access_key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidKey,
          'x-rapidapi-host': 'apilayer-numverify-v1.p.rapidapi.com'
        }
      }
    );

    if (response.status === 429 || response.status === 403) {
      await reportBadKey({ key: apiKey });
      return { success: false, retry: true, message: 'Rate limited or forbidden' };
    }

    if (!response.ok) {
      return { success: false, message: 'RapidAPI request failed' };
    }

    const data = await response.json();

    // 3. Report Success to Render Backend
    const reportRes = await reportValidationSuccess({
      email,
      key: apiKey,
      number,
      result: data
    });

    return {
      success: true,
      data,
      remainingCredits: reportRes?.remainingCredits
    };

  } catch (error) {
    console.error("Proxy Validation Error:", error);
    return { success: false, message: 'Internal Server Error' };
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
