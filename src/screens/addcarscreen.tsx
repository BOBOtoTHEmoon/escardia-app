// Add a car: the shared car form in "new" mode.
import React from 'react';
import { CarFormScreen } from './carformscreen';

interface AddCarScreenProps {
  onNavigateBack: () => void;
  onCarAdded: () => void;
}

export const AddCarScreen: React.FC<AddCarScreenProps> = ({ onNavigateBack, onCarAdded }) => <CarFormScreen onNavigateBack={onNavigateBack} onDone={onCarAdded} />;
