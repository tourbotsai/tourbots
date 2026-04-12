import { useState, useCallback, useEffect, useMemo } from 'react';
import { ChatbotCustomisation } from '@/lib/types';
import { CustomisationPreset } from '@/lib/types/chatbot-customisation';
import { useUser } from '@/hooks/useUser';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';
import { 
  getDefaultCustomisation,
  getAdvancedDefaultCustomisation,
  validateCustomisation,
  customisationPresets
} from '@/lib/chatbot-customisation-service';

interface PresetHookState {
  presets: CustomisationPreset[];
  isLoadingPresets: boolean;
  presetError: string | null;
}

export const useChatbotCustomisation = (chatbotType: 'tour' = 'tour', selectedTourId?: string | null) => {
  const [customisation, setCustomisation] = useState<ChatbotCustomisation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [presetState, setPresetState] = useState<PresetHookState>({
    presets: customisationPresets,
    isLoadingPresets: false,
    presetError: null,
  });
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();

  // Stable default values using useMemo
  const defaultCustomisation = useMemo(() => 
    getDefaultCustomisation(chatbotType), 
    [chatbotType]
  );

  // Advanced default values using useMemo
  const advancedDefaultCustomisation = useMemo(() => 
    getAdvancedDefaultCustomisation(chatbotType), 
    [chatbotType]
  );

  const fetchCustomisation = useCallback(async () => {
    if (!user?.venue?.id || !selectedTourId) {
      setError('No venue found for user');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/app/chatbots/customisation?venueId=${encodeURIComponent(user.venue.id)}&chatbotType=${encodeURIComponent(chatbotType)}&tourId=${encodeURIComponent(selectedTourId)}`,
        { headers: await getAuthHeaders() }
      );
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error || 'Failed to load chatbot customisation');
      }
      const data = await response.json();
      
      if (!data) {
        // Create default customisation if none exists using advanced defaults.
        const createResponse = await fetch('/api/app/chatbots/customisation', {
          method: 'PUT',
          headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            venueId: user.venue.id,
            tourId: selectedTourId,
            chatbotType,
            customisation: advancedDefaultCustomisation,
          }),
        });
        if (!createResponse.ok) {
          const createErrorPayload = await createResponse.json().catch(() => null);
          throw new Error(createErrorPayload?.error || 'Failed to create default customisation');
        }
        const newCustomisation = await createResponse.json();
        setCustomisation(newCustomisation);
      } else {
        setCustomisation(data);
      }
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id, chatbotType, selectedTourId, advancedDefaultCustomisation, getAuthHeaders]);

  // Auto-fetch customisation when user/venue is available
  useEffect(() => {
    if (user?.venue?.id && selectedTourId) {
      fetchCustomisation();
    }
  }, [fetchCustomisation, user?.venue?.id, selectedTourId]);

  const updateCustomisation = useCallback(async (
    updates: Partial<Omit<ChatbotCustomisation, 'id' | 'venue_id' | 'chatbot_type' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user?.venue?.id || !selectedTourId) {
      throw new Error('No venue found for user');
    }

    // Validate updates before sending
    const validation = validateCustomisation(updates);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      throw new Error('Validation failed: ' + validation.errors.join(', '));
    }

    setValidationErrors([]);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/app/chatbots/customisation', {
        method: 'PUT',
        headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          venueId: user.venue.id,
          tourId: selectedTourId,
          chatbotType,
          customisation: updates,
        }),
      });
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error || 'Failed to update chatbot customisation');
      }
      const updatedCustomisation = await response.json();

      setCustomisation(updatedCustomisation);
      setHasUnsavedChanges(false);
      return updatedCustomisation;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.venue?.id, chatbotType, selectedTourId, getAuthHeaders]);

  const updateCustomisationLocal = useCallback((
    updates: Partial<Omit<ChatbotCustomisation, 'id' | 'venue_id' | 'chatbot_type' | 'created_at' | 'updated_at'>>
  ) => {
    if (!customisation) return;

    // Update local state without saving
    const updatedCustomisation = {
      ...customisation,
      ...updates,
    };

    setCustomisation(updatedCustomisation);
    setHasUnsavedChanges(true);

    // Clear validation errors when making changes
    setValidationErrors([]);
  }, [customisation]);

  const saveChanges = useCallback(async () => {
    if (!customisation || !hasUnsavedChanges) return customisation;

    return await updateCustomisation(customisation);
  }, [customisation, hasUnsavedChanges, updateCustomisation]);

  const discardChanges = useCallback(() => {
    fetchCustomisation();
    setHasUnsavedChanges(false);
    setValidationErrors([]);
  }, [fetchCustomisation]);

  const resetToDefaults = useCallback(async () => {
    if (!user?.venue?.id || !selectedTourId) {
      throw new Error('No venue found for user');
    }

    return updateCustomisation(advancedDefaultCustomisation);
  }, [user?.venue?.id, selectedTourId, advancedDefaultCustomisation, updateCustomisation]);

  const resetToLegacyDefaults = useCallback(async () => {
    if (!user?.venue?.id || !selectedTourId) {
      throw new Error('No venue found for user');
    }

    return updateCustomisation(defaultCustomisation);
  }, [user?.venue?.id, selectedTourId, defaultCustomisation, updateCustomisation]);

  // PRESET MANAGEMENT

  const fetchPresets = useCallback(async (category?: string, tags?: string[]) => {
    setPresetState(prev => ({ ...prev, isLoadingPresets: true, presetError: null }));
    
    try {
      let url = '/api/app/chatbots/customisation/presets';
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (tags && tags.length > 0) params.append('tags', tags.join(','));
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, { headers: await getAuthHeaders() });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch presets');
      }

      setPresetState(prev => ({
        ...prev,
        presets: data.presets || data,
        isLoadingPresets: false,
      }));
    } catch (err: any) {
      setPresetState(prev => ({
        ...prev,
        presetError: err.message,
        isLoadingPresets: false,
      }));
    }
  }, [getAuthHeaders]);

  const applyPreset = useCallback(async (presetName: string, applyImmediately: boolean = true) => {
    if (!user?.venue?.id || !customisation) {
      throw new Error('No venue or customisation found');
    }

    try {
      const response = await fetch('/api/app/chatbots/customisation/presets', {
        method: 'POST',
        headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action: 'apply',
          presetName,
          venueId: user.venue.id,
          tourId: selectedTourId,
          chatbotType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply preset');
      }

      if (applyImmediately) {
        // Save immediately
        const updatedCustomisation = await updateCustomisation(data.customisation);
        return updatedCustomisation;
      } else {
        // Just update local state
        setCustomisation(data.customisation);
        setHasUnsavedChanges(true);
        return data.customisation;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user?.venue?.id, selectedTourId, customisation, chatbotType, updateCustomisation, getAuthHeaders]);

  const previewPreset = useCallback(async (presetName: string) => {
    try {
      const response = await fetch('/api/app/chatbots/customisation/presets', {
        method: 'POST',
        headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action: 'preview',
          presetName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to preview preset');
      }

      return data.preview;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [getAuthHeaders]);

  const getSuggestedPresets = useCallback(async () => {
    if (!user?.venue?.id) {
      throw new Error('No venue found for user');
    }

    try {
      const response = await fetch('/api/app/chatbots/customisation/presets', {
        method: 'POST',
        headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action: 'suggest',
          venueId: user.venue.id,
          tourId: selectedTourId,
          chatbotType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get preset suggestions');
      }

      return data.suggestions;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user?.venue?.id, selectedTourId, chatbotType, getAuthHeaders]);

  const generateCoordinatedColours = useCallback(async (primaryColour: string, applyImmediately: boolean = true) => {
    if (!user?.venue?.id || !customisation) {
      throw new Error('No venue or customisation found');
    }

    try {
      const response = await fetch('/api/app/chatbots/customisation/presets', {
        method: 'POST',
        headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          action: 'generate-coordinated',
          primaryColour,
          venueId: user.venue.id,
          tourId: selectedTourId,
          chatbotType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate coordinated colours');
      }

      if (applyImmediately) {
        // Save immediately
        const updatedCustomisation = await updateCustomisation(data.customisation);
        return updatedCustomisation;
      } else {
        // Just update local state
        setCustomisation(data.customisation);
        setHasUnsavedChanges(true);
        return data.customisation;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user?.venue?.id, selectedTourId, customisation, chatbotType, updateCustomisation, getAuthHeaders]);

  // VALIDATION HELPERS

  const validateCurrentCustomisation = useCallback(() => {
    if (!customisation) return { isValid: true, errors: [] };
    
    return validateCustomisation(customisation);
  }, [customisation]);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  // Get current customisation with fallback to defaults
  const currentCustomisation = useMemo(() => {
    if (!customisation) {
      return {
        ...advancedDefaultCustomisation,
        id: '',
        venue_id: user?.venue?.id || '',
        tour_id: selectedTourId || null,
        chatbot_type: chatbotType,
        created_at: '',
        updated_at: '',
      } as ChatbotCustomisation;
    }
    return customisation;
  }, [customisation, advancedDefaultCustomisation, user?.venue?.id, selectedTourId, chatbotType]);

  // Helper to check if a field has been customised from defaults
  const isFieldCustomised = useCallback((fieldName: keyof ChatbotCustomisation) => {
    if (!customisation) return false;
    
    const defaultValue = (advancedDefaultCustomisation as any)[fieldName];
    const currentValue = customisation[fieldName];
    
    return defaultValue !== currentValue;
  }, [customisation, advancedDefaultCustomisation]);

  // Get customisation progress (how many fields have been changed from defaults)
  const customisationProgress = useMemo(() => {
    if (!customisation) return 0;
    
    const customisableFields = Object.keys(advancedDefaultCustomisation);
    const customisedFields = customisableFields.filter(field => 
      isFieldCustomised(field as keyof ChatbotCustomisation)
    );
    
    return Math.round((customisedFields.length / customisableFields.length) * 100);
  }, [customisation, advancedDefaultCustomisation, isFieldCustomised]);

  return {
    // State
    customisation: currentCustomisation,
    isLoading,
    error,
    validationErrors,
    hasUnsavedChanges,
    hasCustomisation: !!customisation,
    customisationProgress,
    
    // Actions
    fetchCustomisation,
    updateCustomisation,
    updateCustomisationLocal,
    saveChanges,
    discardChanges,
    resetToDefaults,
    resetToLegacyDefaults,
    
    // Preset Management
    presets: presetState.presets,
    isLoadingPresets: presetState.isLoadingPresets,
    presetError: presetState.presetError,
    fetchPresets,
    applyPreset,
    previewPreset,
    getSuggestedPresets,
    generateCoordinatedColours,
    
    // Validation
    validateCurrentCustomisation,
    clearValidationErrors,
    isFieldCustomised,
    
    // Legacy support
    getDefaultCustomisation: () => advancedDefaultCustomisation,
  };
}; 