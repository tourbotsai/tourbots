import { useCallback, useState } from 'react';
import { useAuth } from 'reactfire';
import { useToast } from '@/components/ui/use-toast';
import { BillingAddon, BillingPlan, Invoice, Subscription, SubscriptionStatus, VenueBillingRecord } from '@/lib/types';

interface BillingLimits {
  baseSpaces: number;
  baseMessages: number;
  totalSpaces: number;
  totalMessages: number;
}

export function useBilling() {
  const auth = useAuth();
  const { toast } = useToast();

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [addons, setAddons] = useState<BillingAddon[]>([]);
  const [billingRecord, setBillingRecord] = useState<VenueBillingRecord | null>(null);
  const [activePlan, setActivePlan] = useState<BillingPlan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState<Subscription | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [limits, setLimits] = useState<BillingLimits | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getHeaders = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const token = await user.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [auth]);

  const fetchBilling = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getHeaders();
      const [billingResponse, subscriptionResponse] = await Promise.all([
        fetch('/api/app/billing', { headers }),
        fetch('/api/app/subscription', { headers }),
      ]);
      const data = await billingResponse.json();

      if (!billingResponse.ok) {
        throw new Error(data.error || 'Failed to fetch billing data');
      }

      setPlans(data.plans || []);
      setAddons(data.addons || []);
      setBillingRecord(data.billingRecord || null);
      setActivePlan(data.activePlan || null);
      setLimits(data.limits || null);

      if (subscriptionResponse.ok) {
        const subscriptionPayload = await subscriptionResponse.json();
        setInvoices(subscriptionPayload?.invoices || []);
        setSubscriptionDetails(subscriptionPayload?.details || null);
        setSubscriptionStatus(subscriptionPayload?.status || null);
      } else {
        setInvoices([]);
        setSubscriptionDetails(null);
        setSubscriptionStatus(null);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load billing data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders, toast]);

  const selectPlan = useCallback(async (planCode: 'free' | 'pro') => {
    setIsLoading(true);
    try {
      const headers = await getHeaders();
      const response = await fetch('/api/app/billing', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          action: 'select_plan',
          planCode,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update plan');
      }

      toast({
        title: 'Plan updated',
        description: `Your plan is now ${planCode.toUpperCase()}.`,
      });

      await fetchBilling();
      return data.billingRecord as VenueBillingRecord;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update your plan.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBilling, getHeaders, toast]);

  const startPlanCheckout = useCallback(async (planCode: 'pro') => {
    setIsLoading(true);
    try {
      const headers = await getHeaders();
      const response = await fetch('/api/app/billing/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'upgrade_plan',
          planCode,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      return data.checkoutUrl as string;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start plan checkout.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders, toast]);

  const purchaseAddon = useCallback(async (addonCode: 'extra_space' | 'message_block' | 'white_label' | 'agency_portal', quantity: number) => {
    setIsLoading(true);
    try {
      const headers = await getHeaders();
      const response = await fetch('/api/app/billing/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'buy_addon',
          addonCode,
          quantity,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create add-on checkout');
      }

      return data.checkoutUrl as string;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start add-on checkout.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders, toast]);

  const startCustomerPortalSession = useCallback(async () => {
    try {
      const headers = await getHeaders();
      const response = await fetch('/api/app/create-portal-session', {
        method: 'POST',
        headers,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open Stripe billing portal');
      }

      return data.url as string;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to open Stripe billing portal.',
        variant: 'destructive',
      });
      return null;
    }
  }, [getHeaders, toast]);

  return {
    plans,
    addons,
    billingRecord,
    activePlan,
    invoices,
    subscriptionDetails,
    subscriptionStatus,
    limits,
    isLoading,
    fetchBilling,
    selectPlan,
    startPlanCheckout,
    purchaseAddon,
    startCustomerPortalSession,
  };
}
