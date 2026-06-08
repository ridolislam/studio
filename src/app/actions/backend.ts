'use server';

/**
 * @fileOverview Server Actions to proxy requests to the Render backend.
 * Matches the logic provided in the user's server.js snippet.
 */

const API_BASE = 'https://numcheckr.onrender.com';

export async function loginUser(payload: { email: string; password?: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, message: data.message || 'Login failed' };
    }
    // The server returns { success: true, user: { email, credits, ... } }
    return { success: true, data: data.user };
  } catch (error: any) {
    console.error('Login Action Error:', error);
    return { success: false, message: 'Could not connect to backend. Server might be starting up...' };
  }
}

export async function validateNumber(payload: { email: string; number: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/validate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, message: data.message || 'Validation failed' };
    }
    
    // server.js returns: { success: true, data: response.data, remainingCredits: user.credits }
    return { success: true, data: data.data, remainingCredits: data.remainingCredits };
  } catch (error) {
    console.error('Validate Action Error:', error);
    return { success: false, message: 'Network error during validation' };
  }
}
