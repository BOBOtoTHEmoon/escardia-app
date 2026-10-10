// One list of car types for the vendor form and the customer filters,
// so every type a vendor can pick is also one a customer can filter by.
export const CAR_TYPES = ['SUV', 'Sedan', 'Coupe', 'Convertible', 'Van', 'Pickup'] as const;

/** Stored lowercase in the database ("suv"); shown nicely ("SUV", "Sedan"). */
export const typeLabel = (t?: string | null) => {
  if (!t) return '';
  const hit = CAR_TYPES.find((x) => x.toLowerCase() === t.toLowerCase());
  return hit ?? t.charAt(0).toUpperCase() + t.slice(1);
};

export const TRANSMISSIONS = ['Automatic', 'Manual'] as const;
export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'] as const;

/** Areas vendors usually work from (they can also type their own). */
export const LAGOS_AREAS = [
  'Victoria Island',
  'Ikoyi',
  'Lekki Phase 1',
  'Lekki',
  'Ajah',
  'Oniru',
  'Banana Island',
  'Ikeja',
  'Ikeja GRA',
  'Surulere',
  'Yaba',
  'Gbagada',
  'Maryland',
  'Magodo',
] as const;
