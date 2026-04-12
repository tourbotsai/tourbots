import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { BillingAddon, BillingPlan, VenueBillingRecord } from '@/lib/types';

interface AdminBillingRow {
  venue: {
    id: string;
    name: string;
    slug: string;
    email?: string | null;
    city?: string | null;
    subscription_plan?: string | null;
    subscription_status?: string | null;
  };
  billingRecord: VenueBillingRecord | null;
}

interface AdminBillingVenueUpdate {
  plan_code?: string;
  billing_status?: 'free' | 'active' | 'past_due' | 'cancelled' | 'trialing';
  billing_override_enabled?: boolean;
  override_plan_code?: string | null;
  addon_extra_spaces?: number;
  addon_message_blocks?: number;
  addon_white_label?: boolean;
  effective_space_limit?: number | null;
  effective_message_limit?: number | null;
  notes?: string | null;
}

export function useAdminBilling() {
  const { toast } = useToast();

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [addons, setAddons] = useState<BillingAddon[]>([]);
  const [rows, setRows] = useState<AdminBillingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBillingRows = useCallback(async (search: string = '') => {
    setIsLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/admin/billing/venues${query}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch admin billing rows');
      }

      setPlans(data.plans || []);
      setAddons(data.addons || []);
      setRows(data.rows || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load billing rows.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateVenueBilling = useCallback(async (venueId: string, updates: AdminBillingVenueUpdate) => {
    try {
      const response = await fetch(`/api/admin/billing/venues/${venueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update venue billing');
      }

      setRows((prev) =>
        prev.map((row) =>
          row.venue.id === venueId
            ? { ...row, billingRecord: data.billingRecord }
            : row
        )
      );

      toast({
        title: 'Billing updated',
        description: 'Venue billing has been saved.',
      });

      return data.billingRecord as VenueBillingRecord;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update venue billing.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  return {
    plans,
    addons,
    rows,
    isLoading,
    fetchBillingRows,
    updateVenueBilling,
  };
}
