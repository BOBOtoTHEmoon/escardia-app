// ============================================
// PRICING CALCULATOR SERVICE
// ============================================
// File: src/services/pricingService.ts

interface PricingInput {
  car: {
    pricePerDay: number;
    pricePerHour: number;
  };
  tripDetails: {
    durationType: 'day' | 'hour';
    duration: number;
    pickupMethod: 'vendor' | 'delivery';
    rideMode: 'self-drive' | 'with-driver';
  };
  escorts?: Array<{
    type: 'basic' | 'premium' | 'vip';
    count: number;
    price: number;
  }> | null;
}

interface PricingBreakdown {
  baseRental: number;
  deliveryFee: number;
  escortFees: {
    basic: number;
    premium: number;
    vip: number;
    total: number;
  };
  subtotal: number;
  platformFee: number;
  serviceFee: number;
  total: number;
  breakdown: Array<{
    label: string;
    amount: number;
  }>;
}

// Constants
const DELIVERY_FEE = 5000; // ₦5,000 flat fee for delivery
const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% of base rental
const SERVICE_FEE = 2000; // ₦2,000 flat service fee

/**
 * Calculate complete trip pricing breakdown
 */
export const calculateTripPrice = (input: PricingInput): PricingBreakdown => {
  // 1. Calculate base car rental
  let baseRental = 0;
  if (input.tripDetails.durationType === 'day') {
    baseRental = input.car.pricePerDay * input.tripDetails.duration;
  } else {
    baseRental = input.car.pricePerHour * input.tripDetails.duration;
  }

  // 2. Calculate delivery fee
  const deliveryFee = input.tripDetails.pickupMethod === 'delivery' ? DELIVERY_FEE : 0;

  // 3. Calculate escort fees (per day basis, even if hourly rental)
  let escortFeesBreakdown = {
    basic: 0,
    premium: 0,
    vip: 0,
    total: 0,
  };

  if (input.escorts && input.escorts.length > 0) {
    // Convert hours to days for escort calculation (minimum 1 day)
    const daysForEscort = input.tripDetails.durationType === 'hour'
      ? Math.ceil(input.tripDetails.duration / 24) // Round up hours to days
      : input.tripDetails.duration;

    input.escorts.forEach(escort => {
      const escortCost = escort.price * escort.count * daysForEscort;
      
      if (escort.type === 'basic') {
        escortFeesBreakdown.basic += escortCost;
      } else if (escort.type === 'premium') {
        escortFeesBreakdown.premium += escortCost;
      } else if (escort.type === 'vip') {
        escortFeesBreakdown.vip += escortCost;
      }
      
      escortFeesBreakdown.total += escortCost;
    });
  }

  // 4. Calculate subtotal (before platform and service fees)
  const subtotal = baseRental + deliveryFee + escortFeesBreakdown.total;

  // 5. Calculate platform fee (10% of base rental only)
  const platformFee = Math.round(baseRental * PLATFORM_FEE_PERCENTAGE);

  // 6. Service fee
  const serviceFee = SERVICE_FEE;

  // 7. Calculate total
  const total = subtotal + platformFee + serviceFee;

  // 8. Build breakdown array for display
  const breakdown: Array<{ label: string; amount: number }> = [
    {
      label: `Car Rental (${input.tripDetails.duration} ${input.tripDetails.durationType}${input.tripDetails.duration > 1 ? 's' : ''})`,
      amount: baseRental,
    },
  ];

  if (deliveryFee > 0) {
    breakdown.push({
      label: 'Delivery Fee',
      amount: deliveryFee,
    });
  }

  if (escortFeesBreakdown.basic > 0) {
    const basicCount = input.escorts?.find(e => e.type === 'basic')?.count || 0;
    breakdown.push({
      label: `Basic Escort (${basicCount})`,
      amount: escortFeesBreakdown.basic,
    });
  }

  if (escortFeesBreakdown.premium > 0) {
    const premiumCount = input.escorts?.find(e => e.type === 'premium')?.count || 0;
    breakdown.push({
      label: `Premium Escort (${premiumCount})`,
      amount: escortFeesBreakdown.premium,
    });
  }

  if (escortFeesBreakdown.vip > 0) {
    const vipCount = input.escorts?.find(e => e.type === 'vip')?.count || 0;
    breakdown.push({
      label: `VIP Escort (${vipCount})`,
      amount: escortFeesBreakdown.vip,
    });
  }

  breakdown.push({
    label: 'Platform Fee (10%)',
    amount: platformFee,
  });

  breakdown.push({
    label: 'Service Fee',
    amount: serviceFee,
  });

  return {
    baseRental,
    deliveryFee,
    escortFees: escortFeesBreakdown,
    subtotal,
    platformFee,
    serviceFee,
    total,
    breakdown,
  };
};

/**
 * Format currency to Naira
 */
export const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString()}`;
};

/**
 * Quick price calculator for display purposes
 */
export const getQuickPrice = (
  pricePerDay: number,
  days: number,
  hasDelivery: boolean = false,
  hasEscorts: boolean = false
): number => {
  let total = pricePerDay * days;
  
  if (hasDelivery) {
    total += DELIVERY_FEE;
  }
  
  // Add estimated escort fee (assuming 1 basic escort)
  if (hasEscorts) {
    total += 5000 * days;
  }
  
  // Add platform and service fees
  total += Math.round(pricePerDay * days * PLATFORM_FEE_PERCENTAGE);
  total += SERVICE_FEE;
  
  return total;
};