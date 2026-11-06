import { useEffect, useState } from 'react';
import { LOCATION_CHANGE_EVENT, currentLocation } from '@/lib/navigation';

export function useLocation(): string {
  const [location, setLocation] = useState(currentLocation);

  useEffect(() => {
    const update = () => setLocation(currentLocation());
    window.addEventListener('popstate', update);
    window.addEventListener(LOCATION_CHANGE_EVENT, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(LOCATION_CHANGE_EVENT, update);
    };
  }, []);

  return location;
}
