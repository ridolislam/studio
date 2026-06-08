
'use server';

/**
 * @fileOverview Server Actions to proxy requests to the Render backend to avoid CORS issues.
 */

const API_BASE = 'https://numcheckr.onrender.com';

export async function loginUser(payload: any) {
  try {
    const response = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || 'Login failed' };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error('Login Action Error:', error);
    return { success: false, message: 'Could not connect to backend. Server might be starting up...' };
  }
}

export async function fetchUserCredits(userId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE}/api/user/credits?userId=${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return { success: true, credits: data.credits || 0 };
  } catch (error) {
    console.error('Fetch Credits Action Error:', error);
    return { success: false, credits: 0 };
  }
}

export async function validateNumber(payload: { number: string; userId: string }, token: string) {
  try {
    const response = await fetch(`${API_BASE}/api/user/validate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || 'Validation failed' };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Validate Action Error:', error);
    return { success: false, message: 'Network error during validation' };
  }
}
