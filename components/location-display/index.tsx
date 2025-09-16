import { VerifiedLocation } from '@/lib/types/shipping';
import { Loader2, MapPin, AlertTriangle } from 'lucide-react';

interface LocationDisplayProps {
  location: VerifiedLocation | null;
  isLoading: boolean;
  error: string | null;
}

export const LocationDisplay = ({ location, isLoading, error }: LocationDisplayProps) => {
  if (isLoading) {
    return (
      <div className="mt-2 flex items-center text-sm text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span>Memverifikasi lokasi...</span>
      </div>
    );
  }

  if (error && !location) {
    return (
      <div className="mt-2 flex items-center text-sm text-red-600">
        <AlertTriangle className="mr-2 h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (!location) {
    return null;
  }

  const locationString = [
    location.district,
    location.city,
    location.province,
    location.postal_code,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="mt-2 flex items-start text-sm text-gray-700 bg-gray-50 p-3 rounded-md border">
      <MapPin className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
      <span className="leading-snug">{locationString}</span>
    </div>
  );
};
