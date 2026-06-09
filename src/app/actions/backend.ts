'use server';

/**
 * @fileOverview Server Actions to proxy requests to the Render backend.
 * Synchronized with https://numcheckr.onrender.com
 */

const API_BASE = 'https://numcheckr.onrender.com';

export async function loginUser(payload: { email: string; password?: string }) {
  try {
    const response = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      return { success: false, message: `Server error (${response.status}). Render server is waking up...` };
    }

    const data = await response.json();
    if (!data.success) {
      return { success: false, message: data.message || 'Invalid credentials' };
    }
    
    return { success: true, data: data.user };
  } catch (error: any) {
    console.error('Login Action Error:', error);
    return { 
      success: false, 
      message: 'Connection failed. Render server may be offline or starting up.' 
    };
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

    if (!response.ok) {
      return { success: false, message: 'Server busy. Try again in 30 seconds.' };
    }

    const data = await response.json();
    if (!data.success) {
      return { success: false, message: data.message || 'Validation failed' };
    }
    
    return { 
      success: true, 
      data: data.data, 
      remainingCredits: data.remainingCredits 
    };
  } catch (error) {
    console.error('Validate Action Error:', error);
    return { success: false, message: 'Connection lost. Check backend status.' };
  }
}
