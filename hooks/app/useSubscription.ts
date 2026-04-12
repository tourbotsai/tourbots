import { useState, useCallback } from 'react';
import { SubscriptionStatus, Subscription, Invoice } from '@/lib/types';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

export function useSubscription() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pendingPaymentLinks, setPendingPaymentLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders } = useAuthHeaders();

  const fetchSubscriptionPayload = useCallback(async (venueId: string, type?: 'status' | 'details' | 'invoices' | 'pending-links') => {
    const params = new URLSearchParams({ venueId });
    if (type) params.set('type', type);
    const response = await fetch(`/api/app/subscription?${params.toString()}`, {
      headers: await getAuthHeaders(),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to fetch subscription data');
    }
    return payload;
  }, [getAuthHeaders]);

  const fetchSubscriptionStatus = useCallback(async (venueId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchSubscriptionPayload(venueId, 'status');
      const status = payload?.status as SubscriptionStatus;
      setSubscriptionStatus(status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscriptionPayload]);

  const fetchSubscriptionDetails = useCallback(async (venueId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchSubscriptionPayload(venueId, 'details');
      const details = (payload?.details || null) as Subscription | null;
      setSubscriptionDetails(details);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscriptionPayload]);

  const fetchInvoices = useCallback(async (venueId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchSubscriptionPayload(venueId, 'invoices');
      const invoiceList = (payload?.invoices || []) as Invoice[];
      setInvoices(invoiceList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscriptionPayload]);

  const fetchPendingPaymentLinks = useCallback(async (venueId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchSubscriptionPayload(venueId, 'pending-links');
      const links = payload?.pendingLinks || [];
      setPendingPaymentLinks(links);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscriptionPayload]);

  const fetchAllSubscriptionData = useCallback(async (venueId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchSubscriptionPayload(venueId);
      
      setSubscriptionStatus((payload?.status || null) as SubscriptionStatus | null);
      setSubscriptionDetails((payload?.details || null) as Subscription | null);
      setInvoices((payload?.invoices || []) as Invoice[]);
      setPendingPaymentLinks(payload?.pendingLinks || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscriptionPayload]);

  return {
    subscriptionStatus,
    subscriptionDetails,
    invoices,
    pendingPaymentLinks,
    isLoading,
    error,
    fetchSubscriptionStatus,
    fetchSubscriptionDetails,
    fetchInvoices,
    fetchPendingPaymentLinks,
    fetchAllSubscriptionData,
  };
} 