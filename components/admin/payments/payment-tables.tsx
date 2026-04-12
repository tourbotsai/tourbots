"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  ExternalLink, 
  RefreshCw, 
  Calendar, 
  Mail, 
  Building2,
  Copy,
  Check
} from "lucide-react";
import { usePaymentManagement } from "@/hooks/admin/usePaymentManagement";
import { useToast } from "@/components/ui/use-toast";

interface PaymentTablesProps {
  showSubscriptions?: boolean;
}

export function PaymentTables({ showSubscriptions = true }: PaymentTablesProps) {
  const { 
    paymentLinks, 
    subscriptions, 
    isLoading, 
    fetchAllData 
  } = usePaymentManagement();
  const { toast } = useToast();
  const [copiedLinkId, setCopiedLinkId] = useState<string>("");

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      active: "default",
      paid: "default",
      cancelled: "destructive",
      past_due: "destructive",
      expired: "secondary",
    } as const;

    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      paid: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      past_due: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge 
        variant={variants[status as keyof typeof variants] || "secondary"}
        className={colors[status as keyof typeof colors]}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const copyPaymentLink = async (linkId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(linkId);
      toast({
        title: "Success",
        description: "Payment link copied to clipboard!",
      });
      setTimeout(() => setCopiedLinkId(""), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Payment Overview</h2>
          <p className="text-muted-foreground">Manage payment links and subscriptions</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAllData}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="links" className="w-full">
        <TabsList className={`grid w-full ${showSubscriptions ? "grid-cols-2" : "grid-cols-1"}`}>
          <TabsTrigger value="links" className="text-xs sm:text-sm">
            Payment Links ({paymentLinks.length})
          </TabsTrigger>
          {showSubscriptions && (
            <TabsTrigger value="subscriptions" className="text-xs sm:text-sm">
              Subscriptions ({subscriptions.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile Layout */}
              <div className="block md:hidden space-y-4">
                {paymentLinks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No payment links found
                  </div>
                ) : (
                  paymentLinks.map((link: any) => (
                    <Card key={link.id} className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{link.venues?.name || 'Unknown venue'}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{link.venues?.slug}</div>
                          </div>
                          {getStatusBadge(link.status)}
                        </div>

                        {/* Customer Email */}
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{link.customer_email}</span>
                        </div>

                        {/* Plan & Price */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Plan</div>
                            <div className="font-medium capitalize">{link.plan_name}</div>
                            {link.custom_price && (
                              <div className="text-xs text-muted-foreground">Custom</div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Price</div>
                            <div className="font-medium">
                              {link.custom_price 
                                ? formatCurrency(link.custom_price)
                                : 'Standard pricing'
                              }
                            </div>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatDate(link.created_at)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyPaymentLink(link.id, link.stripe_url)}
                            className="flex-1"
                          >
                            {copiedLinkId === link.id ? (
                              <Check className="w-3 h-3 mr-1" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {copiedLinkId === link.id ? 'Copied!' : 'Copy'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="flex-1"
                          >
                            <a 
                              href={link.stripe_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Open
                            </a>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Venue</TableHead>
                      <TableHead>Customer Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentLinks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No payment links found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paymentLinks.map((link: any) => (
                        <TableRow key={link.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{link.venues?.name || 'Unknown venue'}</div>
                                <div className="text-sm text-muted-foreground">
                                  {link.venues?.slug}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {link.customer_email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium capitalize">{link.plan_name}</div>
                              {link.custom_price && (
                                <div className="text-sm text-muted-foreground">Custom</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {link.custom_price 
                              ? formatCurrency(link.custom_price)
                              : 'Standard pricing'
                            }
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(link.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {formatDate(link.created_at)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyPaymentLink(link.id, link.stripe_url)}
                              >
                                {copiedLinkId === link.id ? (
                                  <Check className="w-3 h-3 mr-1" />
                                ) : (
                                  <Copy className="w-3 h-3 mr-1" />
                                )}
                                {copiedLinkId === link.id ? 'Copied!' : 'Copy'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a 
                                  href={link.stripe_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Open
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {showSubscriptions && (
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Active Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mobile Layout */}
                <div className="block md:hidden space-y-4">
                  {subscriptions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No subscriptions found
                    </div>
                  ) : (
                    subscriptions.map((sub: any) => (
                      <Card key={sub.id} className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{sub.venues?.name || 'Unknown venue'}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">{sub.venues?.slug}</div>
                            </div>
                            {getStatusBadge(sub.status)}
                          </div>

                          {/* Customer Email */}
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{sub.customer_email}</span>
                          </div>

                          {/* Plan & Amount */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground">Plan</div>
                              <div className="font-medium capitalize">{sub.plan_name}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Amount</div>
                              <div className="font-medium">{formatCurrency(sub.amount / 100)}</div>
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs">
                                Started: {formatDate(sub.current_period_start)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs">
                                Next: {formatDate(sub.current_period_end)}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="w-full"
                            >
                              <a 
                                href={sub.stripe_subscription_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View in Stripe
                              </a>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Venue</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Current Period</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No subscriptions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        subscriptions.map((sub: any) => (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{sub.venues?.name || 'Unknown venue'}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {sub.venues?.slug}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {sub.customer_email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium capitalize">{sub.plan_name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(sub.amount / 100)}</div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(sub.status)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{formatDate(sub.current_period_start)}</div>
                                <div className="text-muted-foreground">
                                  to {formatDate(sub.current_period_end)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a 
                                  href={sub.stripe_subscription_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View in Stripe
                                </a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 