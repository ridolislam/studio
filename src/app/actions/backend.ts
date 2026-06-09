'use server';

/**
 * @fileOverview Server Actions to proxy requests to the Render backend.
 * Synchronized with https://numcheckr.onrender.com
 */

const API_BASE = 'https://numcheckr.onrender.com';
const ADMIN_SECRET = 'Ridol123@';

// User APIs
export async function loginUser(payload: { email: string; password?: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    return await response.json();
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
    return await response.json();
  } catch (error) {
    return { success: false };
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
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Connection failed' };
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
    return await response.json();
  } catch (error) {
    return { success: false, message: 'Validation connection failed' };
  }
}

// Admin APIs
export async function getAdminStats() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
      cache: 'no-store',
    });
    return await response.json();
  } catch (error) {
    return { success: false };
  }
}

export async function getAdminUsers() {
  try {
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      headers: { 'x-admin-secret': ADMIN_SECRET },
      cache: 'no-store',
    });
    return await response.json();
  } catch (error) {
    return { success: false };
  }
}

export async function updateAdminUser(payload: { email: string; credits: number }) {
  try {
    const response = await fetch(`${API_BASE}/api/admin/update-user`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-secret': ADMIN_SECRET 
      },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    return { success: false };
  }
}
