"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  UserPlus, 
  CreditCard, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Building2,
  Mail,
  Calendar,
  Clock
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { PaymentLinkRequest } from "@/lib/types";

interface RecentRegistration {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  venue_name: string;
  created_at: string;
  subscription_status: 'pending' | 'active' | 'cancelled' | 'past_due';
  pending_payment_links: number;
  has_active_subscription: boolean;
}

export function RecentRegistrations() {
  const [registrations, setRegistrations] = useState<RecentRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPayment, setIsCreatingPayment] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentRegistrations();
  }, []);

  const fetchRecentRegistrations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/recent-registrations');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch registrations');
      }

      setRegistrations(data.registrations || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch registrations: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createPaymentLink = async (registration: RecentRegistration, planName: 'essential' | 'professional') => {
    try {
      setIsCreatingPayment(registration.id);
      
      // Create payment link for new registration
      const paymentLinkRequest: PaymentLinkRequest = {
        venueId: registration.id,
        customerEmail: registration.email,
        planName: planName as 'essential' | 'professional',
        billingCycle: 'monthly', // Default to monthly for new registrations
      };

      const response = await fetch('/api/admin/payments/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentLinkRequest),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment link');
      }

      // Open payment link in new tab
      window.open(data.paymentLink, '_blank');
      
      toast({
        title: "Payment Link Created",
        description: `${planName} payment link created for ${registration.venue_name}`,
      });

      // Refresh the list
      await fetchRecentRegistrations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to create payment link: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment("");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (registration: RecentRegistration) => {
    if (registration.has_active_subscription) {
      return <Badge className="bg-success-green text-white">Active</Badge>;
    }
    
    if (registration.pending_payment_links > 0) {
      return <Badge className="bg-warning-orange text-white">Payment Pending</Badge>;
    }
    
    return <Badge variant="outline" className="border-red-500 text-red-500">Needs Setup</Badge>;
  };

  const needsAttention = registrations.filter(reg => 
    !reg.has_active_subscription && reg.pending_payment_links === 0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-blue" />
            <CardTitle>Recent Registrations</CardTitle>
            {needsAttention.length > 0 && (
              <Badge variant="outline" className="border-red-500 text-red-500">
                {needsAttention.length} Need Attention
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecentRegistrations}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent registrations found
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-success-green">
                  {registrations.filter(r => r.has_active_subscription).length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-orange">
                  {registrations.filter(r => r.pending_payment_links > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Payment Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {needsAttention.length}
                </div>
                <div className="text-sm text-muted-foreground">Need Setup</div>
              </div>
            </div>

            {/* Registrations Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue details</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{registration.venue_name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {registration.first_name} {registration.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {registration.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(registration)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(registration.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {!registration.has_active_subscription && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => createPaymentLink(registration, 'essential')}
                              disabled={isCreatingPayment === registration.id}
                              className="text-xs"
                            >
                              {isCreatingPayment === registration.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                              ) : (
                                <CreditCard className="h-3 w-3 mr-1" />
                              )}
                              Essential
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => createPaymentLink(registration, 'professional')}
                              disabled={isCreatingPayment === registration.id}
                              className="text-xs"
                            >
                              {isCreatingPayment === registration.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                              ) : (
                                <CreditCard className="h-3 w-3 mr-1" />
                              )}
                              Pro
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 