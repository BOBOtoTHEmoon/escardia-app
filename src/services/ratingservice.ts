// ============================================
// ESCARDIA - Ratings (Supabase)
// ============================================
import { supabase } from '../config/supabase';

export interface RatingData {
  carCondition: number;
  driverRating: number | null;
  overallExperience: number;
  review: string;
}

export interface SavedRating extends RatingData {
  id: string;
  tripId: string;
  carId: string;
  userId: string;
  userName: string;
  createdAt: any;
}

export interface CarRatingSummary {
  averageOverall: number;
  averageCarCondition: number;
  averageDriverRating: number | null;
  totalReviews: number;
  reviews: SavedRating[];
}

const mapRating = (r: any): SavedRating => ({
  id: r.booking_id,
  tripId: r.booking_id,
  carId: r.car_id,
  userId: r.customer_id,
  userName: 'Escardia customer',
  carCondition: r.car_condition,
  driverRating: r.driver_rating,
  overallExperience: r.overall,
  review: r.review ?? '',
  createdAt: r.created_at,
});

const avg = (nums: number[]) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0);

class RatingService {
  /** Rate a completed trip. The database checks the trip is completed and not rated already. */
  async submitRating(tripId: string, _carId: string, _userId: string, _userName: string, ratingData: RatingData): Promise<void> {
    const { error } = await supabase.rpc('submit_rating', {
      p_booking_id: tripId,
      p_car_condition: ratingData.carCondition,
      p_driver_rating: ratingData.driverRating,
      p_overall: ratingData.overallExperience,
      p_review: ratingData.review || null,
    });
    if (error) throw new Error(error.message);
  }

  async getCarRatings(carId: string): Promise<CarRatingSummary> {
    const { data, error } = await supabase.from('ratings').select('*').eq('car_id', carId).order('created_at', { ascending: false });
    if (error) throw error;
    const reviews = (data ?? []).map(mapRating);
    const driver = reviews.map((r) => r.driverRating).filter((n): n is number => n !== null);
    return {
      averageOverall: avg(reviews.map((r) => r.overallExperience)),
      averageCarCondition: avg(reviews.map((r) => r.carCondition)),
      averageDriverRating: driver.length ? avg(driver) : null,
      totalReviews: reviews.length,
      reviews,
    };
  }

  async hasUserRatedTrip(tripId: string, _userId?: string): Promise<boolean> {
    const { count } = await supabase.from('ratings').select('booking_id', { count: 'exact', head: true }).eq('booking_id', tripId);
    return (count ?? 0) > 0;
  }

  async getUserRating(tripId: string, _userId?: string): Promise<SavedRating | null> {
    const { data } = await supabase.from('ratings').select('*').eq('booking_id', tripId).maybeSingle();
    return data ? mapRating(data) : null;
  }
}

export default new RatingService();
