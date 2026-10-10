// Edit a car: the shared car form, filled in with the car's details.
import React from 'react';
import { CarFormScreen } from './carformscreen';

interface EditCarScreenProps {
  carId: string;
  onNavigateBack: () => void;
  onSaveSuccess: () => void;
}

export const EditCarScreen: React.FC<EditCarScreenProps> = ({ carId, onNavigateBack, onSaveSuccess }) => (
  <CarFormScreen carId={carId} onNavigateBack={onNavigateBack} onDone={onSaveSuccess} />
);
