import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const migrateCarsToNewPricing = async () => {
  try {
    console.log('Starting car migration...');
    
    const carsRef = collection(db, 'cars');
    const snapshot = await getDocs(carsRef);
    
    let updated = 0;
    
    for (const carDoc of snapshot.docs) {
      const carData = carDoc.data();
      
      // Only migrate if car doesn't already have the new fields
      if (!carData.pricePerDay && !carData.pricePerHour && carData.price) {
        const pricePerDay = carData.price;
        const pricePerHour = Math.round(carData.price / 8);
        
        await updateDoc(doc(db, 'cars', carDoc.id), {
          pricePerDay,
          pricePerHour,
        });
        
        console.log(`Updated car ${carDoc.id}: ₦${pricePerDay}/day, ₦${pricePerHour}/hour`);
        updated++;
      }
    }
    
    console.log(`Migration complete. Updated ${updated} cars.`);
    return { success: true, updated };
  } catch (error: any) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
};