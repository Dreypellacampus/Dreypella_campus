import { createContext, useContext } from 'react';

export interface CustomerSessionState {
  status: 'loading' | 'signed-out' | 'signed-in';
  userId: string | null;
  email: string;
  recovering: boolean;
}

export interface CustomerSessionValue extends CustomerSessionState {
  endRecovery: () => void;
}

export const CustomerSessionContext = createContext<CustomerSessionValue | null>(null);

export function useCustomerSession(): CustomerSessionValue {
  const value = useContext(CustomerSessionContext);
  if (!value) throw new Error('useCustomerSession must be used inside CustomerSessionProvider');
  return value;
}
