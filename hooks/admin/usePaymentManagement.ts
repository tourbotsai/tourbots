import { useState, useCallback } from 'react';
import { PaymentLinkRequest, PaymentLinkResponse } from '@/lib/types';

export function usePaymentManagement() {
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentLinks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/payments?type=links');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment links');
      }
      
      setPaymentLinks(data.paymentLinks || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/payments?type=subscriptions');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subscriptions');
      }
      
      setSubscriptions(data.subscriptions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewPaymentLink = useCallback(async (request: PaymentLinkRequest): Promise<PaymentLinkResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/payments/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment link');
      }
      
      // Refresh payment links after creating
      await fetchPaymentLinks();
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPaymentLinks]);

  const updateLinkStatus = useCallback(async (linkId: string, status: 'pending' | 'paid' | 'expired') => {
    setIsLoading(true);
    setError(null);
    try {
      // This would need an API route too, but for now we'll just refetch
      await fetchPaymentLinks();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPaymentLinks]);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/payments');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment data');
      }
      
      setPaymentLinks(data.paymentLinks || []);
      setSubscriptions(data.subscriptions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    paymentLinks,
    subscriptions,
    isLoading,
    error,
    fetchPaymentLinks,
    fetchSubscriptions,
    createNewPaymentLink,
    updateLinkStatus,
    fetchAllData,
  };
} 