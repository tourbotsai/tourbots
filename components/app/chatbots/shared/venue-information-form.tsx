"use client";

import { useEffect, useState } from "react";
import { VenueInformation } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Building, Info, Loader2, Save } from "lucide-react";

interface VenueInformationFormProps {
  venueInformation: VenueInformation | null;
  onUpdate: (updates: Partial<Omit<VenueInformation, "id" | "venue_id" | "created_at" | "updated_at">>) => Promise<VenueInformation>;
  onCreate: (information: Partial<Omit<VenueInformation, "id" | "venue_id" | "created_at" | "updated_at">>) => Promise<VenueInformation>;
  completionPercentage: number;
  isLoading?: boolean;
  className?: string;
}

export function VenueInformationForm({
  venueInformation,
  onUpdate,
  onCreate,
  completionPercentage,
  className
}: VenueInformationFormProps) {
  const { toast } = useToast();
  const [localInformation, setLocalInformation] = useState<Partial<VenueInformation>>(venueInformation || {});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLocalInformation(venueInformation || {});
    setHasChanges(false);
  }, [venueInformation]);

  const handleFieldChange = (field: keyof VenueInformation, value: string) => {
    setLocalInformation((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const result = venueInformation ? await onUpdate(localInformation) : await onCreate(localInformation);
      setLocalInformation(result);
      setHasChanges(false);
      setIsEditing(false);
      toast({
        title: "Venue information updated",
        description: "Your venue information has been saved successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save venue information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Building className="w-5 h-5" />
              Venue Information
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Provide detailed information about your venue to enhance chatbot responses.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{completionPercentage}% Complete</div>
            <Progress value={completionPercentage} className="w-24 h-2" />
            <Badge variant={completionPercentage >= 80 ? "default" : "secondary"} className="mt-2 bg-brand-blue">
              {completionPercentage >= 80 ? "Well configured" : "Needs attention"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="bg-brand-blue hover:bg-brand-blue/90">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Info className="w-4 h-4 mr-2" />
              {venueInformation ? "Edit Information" : "Add Information"}
            </Button>
          )}
        </div>

        {isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venue-name">Venue Name</Label>
              <Input id="venue-name" value={localInformation.venue_name || ""} onChange={(e) => handleFieldChange("venue_name", e.target.value)} placeholder="e.g. Central Studio" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" value={localInformation.tagline || ""} onChange={(e) => handleFieldChange("tagline", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={localInformation.description || ""} onChange={(e) => handleFieldChange("description", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={localInformation.full_address || ""} onChange={(e) => handleFieldChange("full_address", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={localInformation.city || ""} onChange={(e) => handleFieldChange("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={localInformation.phone_number || ""} onChange={(e) => handleFieldChange("phone_number", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={localInformation.email || ""} onChange={(e) => handleFieldChange("email", e.target.value)} />
            </div>
          </div>
        )}

        {!venueInformation && !isEditing && (
          <div className="text-center py-8 text-muted-foreground">
            No venue information yet. Add details to improve chatbot answers.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
