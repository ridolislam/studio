
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import crypto from 'crypto';

/**
 * @fileOverview Webhook handler for NOWPayments IPN (Instant Payment Notification).
 * This updates the user's credits automatically after crypto confirmation.
 */

export async function POST(req: NextRequest) {
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  const hmacHeader = req.headers.get('x-nowpayments-sig');
  
  const payload = await req.json();
  const { firestore } = initializeFirebase();

  // Verify HMAC signature to ensure the request is from NOWPayments
  if (ipnSecret && hmacHeader) {
    const sortedPayload = Object.keys(payload)
      .sort()
      .reduce((obj: any, key) => {
        obj[key] = payload[key];
        return obj;
      }, {});
    
    const hmac = crypto.createHmac('sha512', ipnSecret);
    const signature = hmac.update(JSON.stringify(sortedPayload)).digest('hex');

    if (signature !== hmacHeader) {
      console.error("Invalid Webhook Signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // NOWPayments payment status check
  // Typical statuses: 'finished', 'partially_paid', 'failed', 'expired'
  if (payload.payment_status === 'finished') {
    const userId = payload.case; // We stored UID in 'case' field
    const creditsToBuy = parseInt(payload.purchase_id); // We stored credits in 'purchase_id'

    if (userId && !isNaN(creditsToBuy)) {
      try {
        const userRef = doc(firestore, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: userId,
            credits: creditsToBuy,
            totalRequests: 0,
            createdAt: serverTimestamp()
          });
        } else {
          await updateDoc(userRef, {
            credits: increment(creditsToBuy)
          });
        }
        
        console.log(`Success: Added ${creditsToBuy} credits to user ${userId}`);
      } catch (error) {
        console.error("Firestore Update Error in Webhook:", error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
