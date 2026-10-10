import type { FilterOptions } from '../components/filtermodal';

export const DEFAULT_FILTERS: FilterOptions = {
  brand: 'All',
  carType: 'All',
  transmission: 'All',
  seats: 'All',
  minPrice: 0,
  maxPrice: 5000000,
};

/** How many filters differ from the defaults (for the badge on the filter button). */
export const countActiveFilters = (f: FilterOptions) =>
  [f.brand !== 'All', f.carType !== 'All', f.transmission !== 'All', f.seats !== 'All', f.minPrice > 0 || f.maxPrice < DEFAULT_FILTERS.maxPrice].filter(Boolean)
    .length;

const same = (a?: string, b?: string) => (a ?? '').toLowerCase() === (b ?? '').toLowerCase();

export const applyCarFilters = <T extends { brand?: string; type?: string; transmission?: string; seats?: number; pricePerDay?: number }>(
  cars: T[],
  f: FilterOptions
): T[] =>
  cars.filter((car) => {
    if (f.brand !== 'All' && !same(car.brand, f.brand)) return false;
    if (f.carType !== 'All' && !same(car.type, f.carType)) return false;
    if (f.transmission !== 'All' && !same(car.transmission, f.transmission)) return false;
    if (f.seats !== 'All') {
      if (f.seats === '6+' ? (car.seats ?? 0) < 6 : car.seats !== parseInt(f.seats, 10)) return false;
    }
    const price = car.pricePerDay ?? 0;
    return price >= f.minPrice && price <= f.maxPrice;
  });
