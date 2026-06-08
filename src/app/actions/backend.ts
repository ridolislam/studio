'use server';

/**
 * @fileOverview Server Actions to proxy requests to the Render backend.
 * Handles potential connection timeouts and cold starts.
 */

const API_BASE = 'https://numcheckr.onrender.com';

export async function loginUser(payload: { email: string; password?: string }) {
  try {
    // Increase timeout or handle fetch error specifically for cold starts
    const response = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, message: `Server error (${response.status}). Please try again in 30 seconds.` };
    }

    const data = await response.json();
    if (!data.success) {
      return { success: false, message: data.message || 'Invalid credentials' };
    }
    
    // The server returns { success: true, user: { email, credits, ... } }
    return { success: true, data: data.user };
  } catch (error: any) {
    console.error('Login Action Error:', error);
    // Specific message for connection failure (likely server sleep)
    return { 
      success: false, 
      message: 'Render server is waking up. Please wait 30 seconds and try again.' 
    };
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
      cache: 'no-store',
    });

    if (!response.ok) {
      return { success: false, message: 'Server is busy or starting up. Try again.' };
    }

    const data = await response.json();
    if (!data.success) {
      return { success: false, message: data.message || 'Validation failed' };
    }
    
    return { success: true, data: data.data, remainingCredits: data.remainingCredits };
  } catch (error) {
    console.error('Validate Action Error:', error);
    return { success: false, message: 'Connection lost. Check if backend is online.' };
  }
}
