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
    type: 'legion' | 'private'; 
    count: number;
    pricePerPerson: number; 
  }> | null;
  hiluxCount?: number; 
  hiluxCost?: number; 
}

interface PricingBreakdown {
  baseRental: number;
  deliveryFee: number;
  escortFees: {
    legion: number;
    private: number; 
    hilux: number;  
    total: number;
  };
  subtotal: number;
  serviceFee: number;
  total: number;
  breakdown: Array<{
    label: string;
    amount: number;
  }>;
}

// Constants
const DELIVERY_FEE = 5000; // ₦5,000 flat fee for delivery
const SERVICE_FEE = 2000; // ₦2,000 flat service fee

/**Calculate complete trip pricing breakdown*/
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
    legion: 0,
    private: 0,
    hilux: 0, 
    total: 0,
  };

  if (input.escorts && input.escorts.length > 0) {
    // Convert hours to days for escort calculation (minimum 1 day)
    const daysForEscort = input.tripDetails.durationType === 'hour'
      ? Math.ceil(input.tripDetails.duration / 24) // Round up hours to days
      : input.tripDetails.duration;

    input.escorts.forEach(escort => {
      const escortCost = escort.pricePerPerson * escort.count * daysForEscort;
      
      if (escort.type === 'legion') {
        escortFeesBreakdown.legion += escortCost;
      } else if (escort.type === 'private') {
        escortFeesBreakdown.private += escortCost;
      }
      
      escortFeesBreakdown.total += escortCost;
    });

    //Add Hilux cost
    if (input.hiluxCost && input.hiluxCost > 0) {
      const hiluxTotalCost = input.hiluxCost * daysForEscort;
      escortFeesBreakdown.hilux = hiluxTotalCost;
      escortFeesBreakdown.total += hiluxTotalCost;
    }
  }

  // 4. Calculate subtotal (before platform and service fees)
  const subtotal = baseRental + deliveryFee + escortFeesBreakdown.total;

  // 6. Service fee
  const serviceFee = SERVICE_FEE;

  // 7. Calculate total
 const total = subtotal + serviceFee;

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

  //UPDATED ESCORT BREAKDOWN
  if (escortFeesBreakdown.legion > 0) {
    const legionCount = input.escorts?.find(e => e.type === 'legion')?.count || 0;
    breakdown.push({
      label: `LEGION Security (${legionCount} personnel)`,
      amount: escortFeesBreakdown.legion,
    });
  }

  if (escortFeesBreakdown.private > 0) {
    const privateCount = input.escorts?.find(e => e.type === 'private')?.count || 0;
    breakdown.push({
      label: `PRIVATE Security (${privateCount} personnel)`,
      amount: escortFeesBreakdown.private,
    });
  }

  //NEW HILUX BREAKDOWN
  if (escortFeesBreakdown.hilux > 0) {
    breakdown.push({
      label: `Transport (${input.hiluxCount} Hilux)`,
      amount: escortFeesBreakdown.hilux,
    });
  }

  breakdown.push({
    label: 'Service Fee',
    amount: serviceFee,
  });

  return {
    baseRental,
    deliveryFee,
    escortFees: escortFeesBreakdown,
    subtotal,
    serviceFee,
    total,
    breakdown,
  };
};

/**Format currency to Naira*/
export const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString()}`;
};

/**Quick price calculator for display purposes*/
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
  
  // Add estimated escort fee (assuming 1 legion escort + 1 hilux)
  if (hasEscorts) {
    total += 25000 * days; // 1 legion
    total += 80000 * days; // 1 hilux
  }
  
  // Add platform and service fees
  total += SERVICE_FEE;
  
  return total;
};