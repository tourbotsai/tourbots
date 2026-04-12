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
      thumbnail_url?: string;
    }
  ) => {
    try {
      setIsLoading(true);
      
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
          thumbnail_url: tourData.thumbnail_url || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save tour');
      }

      toast({
        title: "Tour Saved",
        description: "The tour has been saved successfully.",
      });

      return true;
    } catch (error: any) {
      console.error('Error saving tour:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save tour. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeTour = async (tourId: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/app/tours/${tourId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete tour');
      }

      toast({
        title: "Tour Deleted",
        description: "The tour has been deleted successfully.",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting tour:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete tour. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveTour,
    removeTour,
    isLoading,
  };
} 