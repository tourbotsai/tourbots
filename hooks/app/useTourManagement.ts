import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';

export function useTourManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getAuthHeaders } = useAuthHeaders();

  const saveTour = async (
    venueId: string,
    tourData: {
      title: string;
      description?: string;
      matterport_tour_id: string;
      matterport_url: string;
    },
    options?: {
      tourId?: string;
      createNewLocation?: boolean;
    },
  ) => {
    try {
      setIsLoading(true);

      if (options?.tourId) {
        const response = await fetch(`/api/app/tours/${options.tourId}`, {
          method: 'PATCH',
          headers: await getAuthHeaders({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            title: tourData.title,
            description: tourData.description || null,
            matterport_tour_id: tourData.matterport_tour_id,
            matterport_url: tourData.matterport_url,
            thumbnail_url: null,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to update location');
        }
      } else if (options?.createNewLocation) {
        const response = await fetch('/api/app/tours', {
          method: 'POST',
          headers: await getAuthHeaders({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            venueId,
            title: tourData.title,
            description: tourData.description || null,
            matterportTourId: tourData.matterport_tour_id,
            matterportUrl: tourData.matterport_url,
            thumbnailUrl: null,
            tourType: 'primary',
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create location');
        }
      } else {
        const response = await fetch('/api/app/tours/upsert', {
          method: 'POST',
          headers: await getAuthHeaders({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            venueId,
            title: tourData.title,
            description: tourData.description || null,
            matterport_tour_id: tourData.matterport_tour_id,
            matterport_url: tourData.matterport_url,
            thumbnail_url: null,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to save primary location');
        }
      }

      toast({
        title: "Tour Saved Successfully",
        description: "Your Matterport tour has been saved and is now active on your profile.",
      });

      return true;
    } catch (error: any) {
      console.error('Error saving tour:', error);
      toast({
        title: "Error Saving Tour",
        description: error.message || "Failed to save tour. Please check your Matterport URL and try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveTour,
    isLoading,
  };
} 