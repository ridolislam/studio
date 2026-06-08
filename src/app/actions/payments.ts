
'use server';

import crypto from 'crypto';

/**
 * @fileOverview Cryptomus Server Action for handling crypto payments without KYC.
 */

export interface PaymentRequestInput {
  amount: number;
  currency: string;
  orderId: string;
  uid: string;
  creditsToBuy: number;
}

export async function createPaymentRequest(input: PaymentRequestInput) {
  const API_KEY = process.env.CRYPTOMUS_API_KEY;
  const MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID;
  
  if (!API_KEY || !MERCHANT_ID) {
    throw new Error("Cryptomus credentials missing in environment variables.");
  }

  const endpoint = "https://api.cryptomus.com/v1/payment";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";

  const payload = {
    amount: input.amount.toString(),
    currency: "USD",
    order_id: input.orderId,
    url_callback: `${baseUrl}/api/payments/webhook`,
    url_return: `${baseUrl}/dashboard?payment=success`,
    additional_data: `${input.uid}:${input.creditsToBuy}`, // Store UID and credits
  };

  const dataString = Buffer.from(JSON.stringify(payload)).toString('base64');
  const sign = crypto.createHash('md5').update(dataString + API_KEY).digest('hex');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'merchant': MERCHANT_ID,
        'sign': sign,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.state !== 0) {
      console.error("Cryptomus Error Response:", data);
      throw new Error(data.message || "Failed to create Cryptomus invoice");
    }

    return {
      invoice_url: data.result.url,
      uuid: data.result.uuid
    };
  } catch (error: any) {
    console.error("Payment Initiation Error:", error);
    throw new Error(error.message || "Internal server error during payment initiation");
  }
}
