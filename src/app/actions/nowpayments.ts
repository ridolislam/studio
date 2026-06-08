
'use server';

/**
 * @fileOverview NOWPayments Server Action for handling crypto payments.
 */

export interface PaymentRequestInput {
  amount: number;
  currency: string;
  orderId: string;
  orderDescription: string;
  uid: string;
  email: string;
  creditsToBuy: number;
}

export async function createPaymentRequest(input: PaymentRequestInput) {
  const API_KEY = process.env.NOWPAYMENTS_API_KEY;
  
  if (!API_KEY) {
    throw new Error("NOWPayments API Key is missing in environment variables.");
  }

  const endpoint = "https://api.nowpayments.io/v1/payment";
  
  // Base URL for callback (IPN) and success/cancel redirects
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: input.amount,
        price_currency: input.currency,
        order_id: input.orderId,
        order_description: input.orderDescription,
        ipn_callback_url: `${baseUrl}/api/payments/webhook`,
        success_url: `${baseUrl}/dashboard?payment=success`,
        cancel_url: `${baseUrl}/credits?payment=cancelled`,
        // Custom fields to identify the user and credit amount in webhook
        case: input.uid,
        purchase_id: input.creditsToBuy.toString()
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("NOWPayments Error Response:", data);
      throw new Error(data.message || "Failed to create payment invoice");
    }

    return data;
  } catch (error: any) {
    console.error("Payment Initiation Error:", error);
    throw new Error(error.message || "Internal server error during payment initiation");
  }
}
