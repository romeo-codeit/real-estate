"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Paystack is not a user-facing payment method - crypto only
export default function PaystackCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return null;
}