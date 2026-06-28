// lib/paystack.ts

/* ============================================================
   8TH LEDGER — PAYSTACK PAYMENT INITIALIZATION
   ============================================================ */

interface PaystackInitializePayload {
  email: string;
  amount: number;
  metadata: Record<string, unknown>;
  callback_url: string;
}

interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackApiResponse {
  status: boolean;
  message: string;
  data?: PaystackInitializeData;
}

export interface InitializePaymentResult {
  success: boolean;
  data?: PaystackInitializeData;
  error?: string;
  message: string;
}

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

export async function initializePaystackPayment(
  email: string,
  amount: number,
  ledgerId: string,
  metadata: Record<string, unknown> = {}
): Promise<InitializePaymentResult> {
  if (!PAYSTACK_SECRET) {
    return {
      success: false,
      error: "PAYSTACK_SECRET_KEY not configured",
      message: "Payment service unavailable",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return {
      success: false,
      error: "NEXT_PUBLIC_APP_URL not configured",
      message: "Application URL missing",
    };
  }

  try {
    const payload: PaystackInitializePayload = {
      email,
      amount,
      metadata: {
        ledgerId,
        ...metadata,
      },
      callback_url: `${appUrl}/dashboard?topup=success`,
    };

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Paystack API returned ${response.status}`,
        message: "Failed to initialize payment",
      };
    }

    const raw: any = await response.json();

    if (
      typeof raw !== "object" ||
      raw === null ||
      typeof (raw as Record<string, unknown>).status !== "boolean"
    ) {
      return {
        success: false,
        error: "Invalid response structure from Paystack",
        message: "Payment provider response malformed",
      };
    }

    const result = raw as PaystackApiResponse;

    if (!result.status || !result.data) {
      return {
        success: false,
        error: result.message || "Paystack initialization failed",
        message: result.message || "Could not initialize payment",
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return {
      success: false,
      error: errorMessage,
      message: "Payment initialization error",
    };
  }
}