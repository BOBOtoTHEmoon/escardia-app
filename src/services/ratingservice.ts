import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

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

class RatingService {
  // Submit a rating for a completed trip
  async submitRating(
    tripId: string,
    carId: string,
    userId: string,
    userName: string,
    ratingData: RatingData
  ): Promise<void> {
    try {
      // Create rating document
      const ratingId = `${tripId}_${userId}`;
      const ratingRef = doc(db, 'ratings', ratingId);

      const ratingDoc: Omit<SavedRating, 'id'> = {
        tripId,
        carId,
        userId,
        userName,
        ...ratingData,
        createdAt: serverTimestamp(),
      };

      await setDoc(ratingRef, ratingDoc);

      // Update car's rating summary
      await this.updateCarRatingSummary(carId);

      // Mark trip as rated
      const tripRef = doc(db, 'bookings', tripId);
      await updateDoc(tripRef, {
        rated: true,
        ratedAt: serverTimestamp(),
      });

      console.log('Rating submitted successfully');
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  }

  // Update car's average rating and review count
  private async updateCarRatingSummary(carId: string): Promise<void> {
    try {
      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('carId', '==', carId)
      );
      const ratingsSnapshot = await getDocs(ratingsQuery);

      let totalOverall = 0;
      let totalCarCondition = 0;
      let totalDriver = 0;
      let driverRatingCount = 0;

      ratingsSnapshot.forEach((doc) => {
        const rating = doc.data() as SavedRating;
        totalOverall += rating.overallExperience;
        totalCarCondition += rating.carCondition;
        if (rating.driverRating !== null) {
          totalDriver += rating.driverRating;
          driverRatingCount++;
        }
      });

      const totalReviews = ratingsSnapshot.size;
      const averageOverall = totalReviews > 0 ? totalOverall / totalReviews : 0;
      const averageCarCondition =
        totalReviews > 0 ? totalCarCondition / totalReviews : 0;
      const averageDriver =
        driverRatingCount > 0 ? totalDriver / driverRatingCount : null;

      // Update car document with rating summary
      const carRef = doc(db, 'cars', carId);
      await updateDoc(carRef, {
        'rating.averageOverall': Number(averageOverall.toFixed(1)),
        'rating.averageCarCondition': Number(averageCarCondition.toFixed(1)),
        'rating.averageDriver': averageDriver
          ? Number(averageDriver.toFixed(1))
          : null,
        'rating.totalReviews': totalReviews,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating car rating summary:', error);
      throw error;
    }
  }

  // Get all ratings for a specific car
  async getCarRatings(carId: string): Promise<CarRatingSummary> {
    try {
      const carRef = doc(db, 'cars', carId);
      const carDoc = await getDoc(carRef);

      if (!carDoc.exists()) {
        throw new Error('Car not found');
      }

      const carData = carDoc.data();
      const ratingSummary = carData.rating || {
        averageOverall: 0,
        averageCarCondition: 0,
        averageDriver: null,
        totalReviews: 0,
      };

      // Get individual reviews
      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('carId', '==', carId)
      );
      const ratingsSnapshot = await getDocs(ratingsQuery);

      const reviews: SavedRating[] = [];
      ratingsSnapshot.forEach((doc) => {
        reviews.push({
          id: doc.id,
          ...doc.data(),
        } as SavedRating);
      });

      // Sort reviews by most recent first
      reviews.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      return {
        ...ratingSummary,
        reviews,
      };
    } catch (error) {
      console.error('Error getting car ratings:', error);
      throw error;
    }
  }

  // Check if user has already rated a trip
  async hasUserRatedTrip(tripId: string, userId: string): Promise<boolean> {
    try {
      const ratingId = `${tripId}_${userId}`;
      const ratingRef = doc(db, 'ratings', ratingId);
      const ratingDoc = await getDoc(ratingRef);
      return ratingDoc.exists();
    } catch (error) {
      console.error('Error checking if user rated trip:', error);
      return false;
    }
  }

  // Get user's rating for a specific trip
  async getUserRating(
    tripId: string,
    userId: string
  ): Promise<SavedRating | null> {
    try {
      const ratingId = `${tripId}_${userId}`;
      const ratingRef = doc(db, 'ratings', ratingId);
      const ratingDoc = await getDoc(ratingRef);

      if (ratingDoc.exists()) {
        return {
          id: ratingDoc.id,
          ...ratingDoc.data(),
        } as SavedRating;
      }

      return null;
    } catch (error) {
      console.error('Error getting user rating:', error);
      return null;
    }
  }
}

export default new RatingService();