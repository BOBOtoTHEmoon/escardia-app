// ============================================
// ESCARDIA - Booking payment flow (card, bank transfer, wallet)
// 1. Create the booking (the database sets the price and holds the car 30 min)
// 2. Pay: Paystack page, or wallet balance
// 3. The server confirms; the vendor's share goes on hold until the trip is done
// ============================================
import { useRef, useState } from 'react';
import { supabase } from '../config/supabase';
import { createBookingFromTrip, cancelBooking } from '../services/bookingService';
import { initializeBookingPayment, verifyPayment } from '../services/paystackService';

export type PaymentStage = 'idle' | 'creating' | 'initializing' | 'paying' | 'verifying';

export const useBookingPayment = (bookingData: any) => {
  const [stage, setStage] = useState<PaymentStage>('idle');
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [reference, setReference] = useState('');
  const [showPaystack, setShowPaystack] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [bookingCode, setBookingCode] = useState<string | null>(null);
  const bookingRef = useRef<string | null>(null);
  const totalRef = useRef<number>(0);
  const codeRef = useRef<string | null>(null);
  const confirmingRef = useRef(false);

  const loading = stage !== 'idle' && stage !== 'paying';

  /** Creates the booking once; reuses it if the customer retries. */
  const ensureBooking = async (): Promise<{ id: string; total: number }> => {
    if (bookingRef.current) return { id: bookingRef.current, total: totalRef.current };
    setStage('creating');
    const res = await createBookingFromTrip(bookingData);
    if (!res.success || !res.id || !res.booking) throw new Error(res.error || 'Could not create the booking');
    bookingRef.current = res.id;
    totalRef.current = res.booking.totalPrice;
    setBookingId(res.id);
    setServerTotal(res.booking.totalPrice);
    codeRef.current = (res.booking as { code?: string }).code ?? null;
    setBookingCode(codeRef.current);
    return { id: res.id, total: res.booking.totalPrice };
  };

  /** Card / bank transfer / USSD through Paystack. */
  const startPaystack = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { id } = await ensureBooking();
      setStage('initializing');
      const init = await initializeBookingPayment('', 0, { bookingId: id });
      if (!init.success || !init.authorizationUrl) throw new Error(init.error || 'Could not start payment');
      setAuthorizationUrl(init.authorizationUrl);
      setReference(init.reference || '');
      setShowPaystack(true);
      setStage('paying');
      return { ok: true };
    } catch (e: any) {
      setStage('idle');
      return { ok: false, error: e.message };
    }
  };

  /** Called when the Paystack page reports success. */
  const confirmPaystack = async (ref?: string): Promise<{ ok: boolean; pending?: boolean; ignored?: boolean; error?: string }> => {
    // The payment page can report success more than once; only handle it once.
    if (confirmingRef.current) return { ok: false, ignored: true };
    confirmingRef.current = true;
    setShowPaystack(false);
    setStage('verifying');
    const result = await verifyPayment(ref || reference);
    confirmingRef.current = false;
    setStage('idle');
    if (result.success) return { ok: true };
    return { ok: false, pending: result.pending, error: result.error };
  };

  /** Customer closed the Paystack page: free the car straight away. */
  const cancelPaystack = async () => {
    setShowPaystack(false);
    setStage('idle');
    if (bookingRef.current) {
      await cancelBooking(bookingRef.current, 'Payment cancelled by customer');
      bookingRef.current = null;
      setBookingId(null);
      setServerTotal(null);
    }
  };

  /** Pay from the Escardia wallet. */
  const payWithWallet = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { id } = await ensureBooking();
      setStage('verifying');
      const { error } = await supabase.rpc('pay_booking_with_wallet', { p_booking_id: id });
      setStage('idle');
      if (error) {
        if (/Insufficient/i.test(error.message)) {
          await cancelBooking(id, 'Insufficient wallet balance');
          bookingRef.current = null;
          setBookingId(null);
          setServerTotal(null);
        }
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (e: any) {
      setStage('idle');
      return { ok: false, error: e.message };
    }
  };

  /** The booking that was just paid (read from refs, so it is never stale). */
  const paidBooking = () => ({ id: bookingRef.current, code: codeRef.current, total: totalRef.current });

  return {
    paidBooking,
    stage,
    loading,
    showPaystack,
    authorizationUrl,
    reference,
    bookingId,
    bookingCode,
    serverTotal,
    startPaystack,
    confirmPaystack,
    cancelPaystack,
    payWithWallet,
  };
};
