"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Palette, Bot } from "lucide-react";
import { useChatbotConfig } from "@/hooks/admin/useChatbotConfig";
import { CustomisationForm } from "@/components/app/chatbots/shared/customisation-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";

interface ChatbotCustomisationProps {
  forcedVenueId?: string;
  forcedTourId?: string;
  hideHeader?: boolean;
}

export function ChatbotCustomisation({
  forcedVenueId,
  forcedTourId,
  hideHeader = false,
}: ChatbotCustomisationProps = {}) {
  const { configs, isLoading: configsLoading, fetchConfigs } = useChatbotConfig();
  const [selectedVenueId, setSelectedVenueId] = useState<string>(forcedVenueId || "");
  const [selectedTourId, setSelectedTourId] = useState<string>(forcedTourId || "");
  const selectedChatbotType = 'tour' as const;
  const [customisation, setCustomisation] = useState<any>(null);
  const [customisationLoading, setCustomisationLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tours, setTours] = useState<any[]>([]);
  const { getAuthHeaders } = useAuthHeaders();

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Load available tours for selected venue so customisation can be scoped correctly
  useEffect(() => {
    const fetchTours = async () => {
      if (!selectedVenueId) {
        setTours([]);
        setSelectedTourId("");
        return;
      }

      try {
        const response = await fetch(`/api/admin/venues/${selectedVenueId}/details`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load tours");
        }

        const venueTours = data.tours || [];
        setTours(venueTours);

        if (forcedTourId) {
          setSelectedTourId(forcedTourId);
          return;
        }

        if (!selectedTourId || !venueTours.some((tour: any) => tour.id === selectedTourId)) {
          const preferredTour = venueTours.find((tour: any) => tour.tour_type === "primary") || venueTours[0];
          setSelectedTourId(preferredTour?.id || "");
        }
      } catch (error) {
        console.error("Error fetching tours for customisation:", error);
        setTours([]);
        setSelectedTourId("");
      }
    };

    fetchTours();
  }, [selectedVenueId, forcedTourId]);

  // Reset customisation when venue/tour/chatbot type changes
  useEffect(() => {
    setCustomisation(null);
    if (selectedVenueId && selectedChatbotType && selectedTourId) {
      fetchCustomisation();
    }
  }, [selectedVenueId, selectedChatbotType, selectedTourId]);

  useEffect(() => {
    if (forcedVenueId) {
      setSelectedVenueId(forcedVenueId);
    }
  }, [forcedVenueId]);

  useEffect(() => {
    if (forcedTourId) {
      setSelectedTourId(forcedTourId);
    }
  }, [forcedTourId]);

  // Group configs by venue (same pattern as playground)
  const venueGroups = configs.reduce((acc: { [key: string]: any }, config: any) => {
    const venueId = config.venue_id;
    if (!acc[venueId]) {
      acc[venueId] = {
        venue: config.venues,
        tour: null,
      };
    }
    if (config.chatbot_type === 'tour') {
      acc[venueId].tour = config;
    }
    return acc;
  }, {});

  // Unique venues for filter
  const uniqueVenues = Object.values(venueGroups).map((group: any) => ({
    id: group.venue?.id,
    name: group.venue?.name || 'Unknown venue',
    hasTour: !!group.tour,
  }));

  const selectedVenueGroup = venueGroups[selectedVenueId];
  const selectedConfig = selectedVenueGroup ? selectedVenueGroup[selectedChatbotType] : null;

  const fetchCustomisation = async () => {
    if (!selectedVenueId || !selectedChatbotType || !selectedTourId) return;
    
    setCustomisationLoading(true);
    try {
      const response = await fetch(`/api/app/chatbots/customisation/${selectedVenueId}/${selectedChatbotType}?tourId=${selectedTourId}`, {
        headers: await getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setCustomisation(data);
      } else {
        // Create default customisation if none exists
        setCustomisation(getDefaultCustomisation());
      }
    } catch (error) {
      console.error('Error fetching customisation:', error);
      setCustomisation(getDefaultCustomisation());
    } finally {
      setCustomisationLoading(false);
    }
  };

  const getDefaultCustomisation = () => ({
    id: '',
    venue_id: selectedVenueId || '',
    tour_id: selectedTourId || '',
    chatbot_type: selectedChatbotType,
    window_title: 'AI Assistant',
    window_width: 400,
    window_height: 500,
    header_background_color: '#3B82F6',
    header_text_color: '#FFFFFF',
    header_icon_size: 16,
    chat_button_icon: 'MessageCircle',
    chat_button_color: '#3B82F6',
    chat_button_size: 'medium',
    icon_size: 24,
    user_message_background: '#3B82F6',
    user_message_text_color: '#FFFFFF',
    ai_message_background: '#F3F4F6',
    ai_message_text_color: '#374151',
    input_background_color: '#FFFFFF',
    input_placeholder: 'Type your message...',
    send_button_color: '#3B82F6',
    send_button_icon_color: '#FFFFFF',
    show_powered_by: true,
    custom_logo_url: null,
    created_at: '',
    updated_at: '',
  });

  const handleUpdateCustomisation = async (updates: any) => {
    if (!selectedVenueId || !selectedChatbotType || !selectedTourId) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/app/chatbots/customisation/${selectedVenueId}/${selectedChatbotType}`, {
        method: 'PUT',
        headers: await getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          ...updates,
          tour_id: selectedTourId,
        }),
      });

      if (response.ok) {
        const updatedCustomisation = await response.json();
        setCustomisation(updatedCustomisation);
        return updatedCustomisation;
      } else {
        throw new Error('Failed to update customisation');
      }
    } catch (error) {
      console.error('Error updating customisation:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!selectedVenueId || !selectedChatbotType || !selectedTourId) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/app/chatbots/customisation/${selectedVenueId}/${selectedChatbotType}`, {
        method: 'PUT',
        headers: await getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          ...getDefaultCustomisation(),
          tour_id: selectedTourId,
        }),
      });

      if (response.ok) {
        const resetCustomisation = await response.json();
        setCustomisation(resetCustomisation);
        return resetCustomisation;
      } else {
        throw new Error('Failed to reset customisation');
      }
    } catch (error) {
      console.error('Error resetting customisation:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  if (configsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Chatbot Customisation
            </CardTitle>
            <CardDescription>
              Customise the appearance and branding of AI chatbots for different venues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Label htmlFor="venue-select-customisation" className="text-sm font-medium whitespace-nowrap">Select venue:</Label>
                <Select value={selectedVenueId} onValueChange={setSelectedVenueId} disabled={!!forcedVenueId}>
                  <SelectTrigger id="venue-select-customisation" className="w-full sm:flex-1 max-w-md">
                    <SelectValue placeholder="Choose a venue to customise" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueVenues.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        <div className="flex items-center gap-2">
                          {v.name}
                          {v.hasTour && (
                            <Badge variant="outline" className="text-xs">
                              Tour
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Label htmlFor="tour-select-customisation" className="text-sm font-medium whitespace-nowrap">Select tour:</Label>
                <Select value={selectedTourId} onValueChange={setSelectedTourId} disabled={!!forcedTourId || tours.length === 0}>
                  <SelectTrigger id="tour-select-customisation" className="w-full sm:flex-1 max-w-md">
                    <SelectValue placeholder={tours.length > 0 ? "Choose a tour" : "No tours available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tours.map((tour) => (
                      <SelectItem key={tour.id} value={tour.id}>
                        {tour.title || "Untitled tour"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedConfig && (
                <div className="mt-6 p-4 bg-card border rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    Customising {selectedVenueGroup?.venue?.name} Tour Chatbot
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Chatbot Name:</span> {selectedConfig.chatbot_name}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      <Badge variant={selectedConfig.is_active ? "default" : "secondary"}>
                        {selectedConfig.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customisation Form */}
      {selectedVenueId && selectedTourId && selectedConfig && (
        <>
          {customisationLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-sm text-muted-foreground">Loading customisation settings...</p>
                </div>
              </CardContent>
            </Card>
          ) : customisation ? (
            <CustomisationForm
              customisation={customisation}
              onUpdate={handleUpdateCustomisation}
              onReset={handleResetToDefaults}
              isLoading={isUpdating}
            />
          ) : null}
        </>
      )}
    </div>
  );
} 