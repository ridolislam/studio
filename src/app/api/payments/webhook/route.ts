
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc, increment, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import crypto from 'crypto';

/**
 * @fileOverview Webhook handler for Cryptomus IPN.
 * Automatically updates user credits after crypto confirmation.
 */

export async function POST(req: NextRequest) {
  const apiKey = process.env.CRYPTOMUS_API_KEY;
  const payload = await req.json();
  const { sign, ...data } = payload;

  // Verify Cryptomus Signature
  if (apiKey) {
    const dataString = Buffer.from(JSON.stringify(data)).toString('base64');
    const calculatedSign = crypto.createHash('md5').update(dataString + apiKey).digest('hex');

    if (calculatedSign !== sign) {
      console.error("Invalid Webhook Signature from Cryptomus");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // Cryptomus payment status check: 'paid' or 'paid_over'
  if (payload.status === 'paid' || payload.status === 'paid_over') {
    const { firestore } = initializeFirebase();
    
    // Extract UID and credits from additional_data
    const additionalData = payload.additional_data; // format "uid:credits"
    if (!additionalData) return NextResponse.json({ status: "ok" });

    const [userId, creditsStr] = additionalData.split(':');
    const creditsToBuy = parseInt(creditsStr);

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
        
        console.log(`Success: Added ${creditsToBuy} credits to user ${userId} via Cryptomus`);
      } catch (error) {
        console.error("Firestore Update Error in Webhook:", error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
