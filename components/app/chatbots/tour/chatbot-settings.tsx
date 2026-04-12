"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, File, Trash2, Globe, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useTourChatbotConfig } from "@/hooks/app/useTourChatbotConfig";
import { useTourChatbotDocuments } from "@/hooks/app/useTourChatbotDocuments";
import { useUser } from "@/hooks/useUser";
import { ChatbotConfig } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { HardLimitUsageWidget } from "@/components/shared/hard-limit-usage-widget";
import { HardLimitConfig, HardLimitUsage } from "@/lib/types";
import { ChatbotInfoSections } from "./chatbot-info-sections";
import { ChatbotTriggers } from "./chatbot-triggers";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";

interface TourChatbotSettingsProps {
  selectedTourId?: string | null;
  visibleSections?: {
    config?: boolean;
    information?: boolean;
    documents?: boolean;
    triggers?: boolean;
  };
}

const DEFAULT_TOUR_INSTRUCTION_PROMPT =
  "Guide visitors through the virtual tour clearly and concisely. Focus on what they can see in this location and help them navigate the space.";
const DEFAULT_TOUR_GUARDRAIL_PROMPT =
  "You are an AI assistant for this virtual tour. Only answer questions about this location, its spaces, and the virtual tour experience. If a question is unrelated, politely explain that you can only help with tour and location questions.";

export function TourChatbotSettings({ selectedTourId, visibleSections }: TourChatbotSettingsProps) {
  const showConfigSection = visibleSections?.config !== false;
  const showInformationSection = visibleSections?.information !== false;
  const showDocumentsSection = visibleSections?.documents !== false;
  const showTriggersSection = visibleSections?.triggers !== false;
  const hasAnyVisibleSection =
    showConfigSection || showInformationSection || showDocumentsSection || showTriggersSection;

  const { tourConfig, isLoading, error, updateConfig, createConfig } = useTourChatbotConfig(selectedTourId);
  const { documents, isUploading, uploadDocument, deleteDocument } = useTourChatbotDocuments(tourConfig?.id, selectedTourId);
  const { user } = useUser();
  const { getAuthHeaders } = useAuthHeaders();
  const { toast } = useToast();
  const [editingConfig, setEditingConfig] = useState<ChatbotConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [isKnowledgeBaseExpanded, setIsKnowledgeBaseExpanded] = useState(false);
  const [hardLimitConfig, setHardLimitConfig] = useState<HardLimitConfig | null>(null);
  const [hardLimitUsage, setHardLimitUsage] = useState<HardLimitUsage | null>(null);
  const [isLoadingHardLimits, setIsLoadingHardLimits] = useState(false);

  // Fetch hard limit data
  useEffect(() => {
    const fetchHardLimits = async () => {
      if (!user?.venue?.id || !selectedTourId) return;
      
      setIsLoadingHardLimits(true);
      try {
        const response = await fetch(`/api/app/chatbots/hard-limits?venueId=${user.venue.id}&chatbotType=tour&tourId=${selectedTourId}`, {
          headers: await getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setHardLimitConfig(data.config);
          setHardLimitUsage(data.usage);
        }
      } catch (error) {
        console.error('Error fetching hard limits:', error);
      } finally {
        setIsLoadingHardLimits(false);
      }
    };

    fetchHardLimits();
  }, [user?.venue?.id, selectedTourId, tourConfig, getAuthHeaders]);

  useEffect(() => {
    if (!selectedTourId) {
      setEditingConfig(null);
      return;
    }

    setEditingConfig(tourConfig || {
      id: '',
      venue_id: user?.venue?.id || '',
      tour_id: selectedTourId,
      chatbot_type: 'tour',
      chatbot_name: 'Tour Assistant',
      welcome_message: '',
      personality_prompt: '',
      instruction_prompt: DEFAULT_TOUR_INSTRUCTION_PROMPT,
      guardrails_enabled: true,
      guardrail_prompt: DEFAULT_TOUR_GUARDRAIL_PROMPT,
      is_active: true,
      created_at: '',
      updated_at: '',
      openai_vector_store_id: null
    } as ChatbotConfig);
  }, [tourConfig, selectedTourId, user?.venue?.id]);

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    
    setIsSaving(true);
    try {
      if (tourConfig) {
        // Update existing config
        await updateConfig(tourConfig.id, {
          chatbot_name: editingConfig.chatbot_name,
          welcome_message: editingConfig.welcome_message,
          personality_prompt: editingConfig.personality_prompt,
          instruction_prompt: editingConfig.instruction_prompt,
          guardrails_enabled: editingConfig.guardrails_enabled,
          guardrail_prompt: editingConfig.guardrail_prompt,
          is_active: editingConfig.is_active,
        });
      } else {
        // Create new config
        await createConfig({
          tour_id: selectedTourId!,
          chatbot_name: editingConfig.chatbot_name,
          welcome_message: editingConfig.welcome_message,
          personality_prompt: editingConfig.personality_prompt,
          instruction_prompt: editingConfig.instruction_prompt,
          guardrails_enabled: editingConfig.guardrails_enabled,
          guardrail_prompt: editingConfig.guardrail_prompt,
          is_active: editingConfig.is_active,
        });
      }
      toast({
        title: "Success",
        description: "Virtual Tour chatbot configuration updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update chatbot configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.venue?.id || !selectedTourId || !tourConfig?.id) return;

    try {
      await uploadDocument(file);
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      // Reset file input
      event.target.value = "";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 sm:p-8">
        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 sm:p-8">
        <p className="text-red-600 text-sm sm:text-base">Error loading chatbot configuration: {error}</p>
      </div>
    );
  }

  if (!selectedTourId) {
    return (
      <div className="text-center p-6 sm:p-8">
        <p className="text-slate-600 text-sm sm:text-base dark:text-slate-400">Select a tour to configure a chatbot.</p>
      </div>
    );
  }

  if (!hasAnyVisibleSection) {
    return (
      <div className="text-center p-6 sm:p-8">
        <p className="text-slate-600 text-sm sm:text-base dark:text-slate-400">
          No settings blocks are enabled for this share.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Chatbot Configuration */}
      {showConfigSection ? (
      <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-input dark:bg-background">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="text-base sm:text-lg">Virtual Tour Chatbot Configuration</span>
                </div>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 dark:text-slate-400">
                Configure your tour-specific AI assistant&apos;s personality and behaviour
              </CardDescription>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
              <Button
                type="button"
                onClick={handleSaveConfig}
                className="bg-slate-900 text-white hover:bg-slate-800"
                disabled={isSaving || !editingConfig || !isConfigExpanded}
              >
                {isSaving ? "Saving..." : <><span className="sm:hidden">Save</span><span className="hidden sm:inline">Save Configuration</span></>}
              </Button>
              <Button
                variant="outline"
                type="button"
                className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                disabled={!selectedTourId}
                onClick={() => setIsConfigExpanded((prev) => !prev)}
              >
                {isConfigExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                {isConfigExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isConfigExpanded && editingConfig && (
          <CardContent className="space-y-4 border-t border-slate-200/80 bg-slate-50/30 pt-5 dark:border-input dark:bg-background">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-1.5">
                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Name</h4>
                <Input
                  id="chatbot-name"
                  value={editingConfig?.chatbot_name || ''}
                  onChange={(e) => setEditingConfig(prev => prev ? {
                    ...prev,
                    chatbot_name: e.target.value,
                  } : null)}
                  placeholder="e.g., Tour Guide, VR Assistant"
                  className="border-slate-200 bg-white text-sm focus-visible:ring-slate-400/70 dark:border-input dark:bg-background dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Status</h4>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-active"
                    checked={editingConfig?.is_active || false}
                    onCheckedChange={(checked) => setEditingConfig(prev => prev ? {
                      ...prev,
                      is_active: checked,
                    } : null)}
                  />
                  <Label htmlFor="is-active" className="text-sm font-medium">
                    Active
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="welcome-message" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Welcome Message
              </Label>
              <Input
                id="welcome-message"
                value={editingConfig?.welcome_message || ''}
                onChange={(e) => setEditingConfig(prev => prev ? {
                  ...prev,
                  welcome_message: e.target.value,
                } : null)}
                placeholder="Hello! I'm your virtual tour guide. How can I help you explore our facilities?"
                className="border-slate-200 bg-white text-sm focus-visible:ring-slate-400/70 dark:border-input dark:bg-background dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="personality-prompt" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Personality
              </Label>
              <Textarea
                id="personality-prompt"
                value={editingConfig?.personality_prompt || ''}
                onChange={(e) => setEditingConfig(prev => prev ? {
                  ...prev,
                  personality_prompt: e.target.value,
                } : null)}
                placeholder="You are a helpful and knowledgeable tour guide. Focus on explaining fitness equipment, facilities, and what visitors can see during their virtual tour..."
                className="min-h-[88px] border-slate-200 bg-white text-sm focus-visible:ring-slate-400/70 dark:border-input dark:bg-background dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instruction-prompt" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Instructions
              </Label>
              <Textarea
                id="instruction-prompt"
                value={editingConfig?.instruction_prompt || ''}
                onChange={(e) => setEditingConfig(prev => prev ? {
                  ...prev,
                  instruction_prompt: e.target.value,
                } : null)}
                placeholder="Add specific instructions for how this chatbot should answer in this tour."
                className="min-h-[140px] border-slate-200 bg-white text-sm focus-visible:ring-slate-400/70 dark:border-input dark:bg-background dark:text-slate-100"
              />
            </div>

            <div className="mt-1 space-y-3 rounded-lg bg-white/70 p-3 dark:border dark:border-input dark:bg-background">
              <div className="flex items-center gap-2">
                <Label htmlFor="guardrails-enabled" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Enable Guardrails
                </Label>
                <Switch
                  id="guardrails-enabled"
                  checked={editingConfig?.guardrails_enabled || false}
                  onCheckedChange={(checked) => setEditingConfig(prev => prev ? {
                    ...prev,
                    guardrails_enabled: checked,
                  } : null)}
                />
              </div>
              
              {editingConfig?.guardrails_enabled && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-input dark:bg-background">
                  <Label htmlFor="guardrail-prompt" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Guardrail Instructions
                  </Label>
                  <Textarea
                    id="guardrail-prompt"
                    value={editingConfig?.guardrail_prompt || ''}
                    onChange={(e) => setEditingConfig(prev => prev ? {
                      ...prev,
                      guardrail_prompt: e.target.value,
                    } : null)}
                    placeholder="Enter guardrail instructions..."
                    className="mt-2 min-h-[120px] border-slate-200 text-sm focus-visible:ring-slate-400/70 dark:border-input dark:bg-background dark:text-slate-100"
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    These instructions help keep the AI focused on venue-related topics and maintain appropriate boundaries.
                  </p>
                </div>
              )}
            </div>

            {/* Hard Limit Usage Display */}
            {hardLimitConfig && !isLoadingHardLimits && (
              <div className="mt-6">
                <HardLimitUsageWidget
                  config={hardLimitConfig}
                  usage={hardLimitUsage}
                  chatbotType="tour"
                  showActions={true}
                  onUpgrade={() => window.open('/app/billing', '_blank')}
                  compact={false}
                />
              </div>
            )}

          </CardContent>
        )}
      </Card>
      ) : null}

      {showInformationSection ? <ChatbotInfoSections chatbotConfigId={tourConfig?.id} /> : null}

      {/* Training Documents */}
      {showDocumentsSection ? (
      <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-input dark:bg-background">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <span>Training Documents</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 dark:text-slate-400">
                Upload documents to improve your tour chatbot&apos;s knowledge of your facilities
              </CardDescription>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
              <Button
                type="button"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={isUploading || !isKnowledgeBaseExpanded}
                size="sm"
                variant="outline"
                className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
              >
                {isUploading ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                )}
                {isUploading ? "Uploading..." : <><span className="sm:hidden">Upload</span><span className="hidden sm:inline">Upload Document</span></>}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 bg-white dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                onClick={() => setIsKnowledgeBaseExpanded((prev) => !prev)}
              >
                {isKnowledgeBaseExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                {isKnowledgeBaseExpanded ? "Collapse" : "Expand"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {isKnowledgeBaseExpanded ? <CardContent className="space-y-4 border-t border-slate-200/80 bg-slate-50/40 pt-5 sm:space-y-6 dark:border-input dark:bg-background">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              Supports PDF, TXT, DOC, DOCX files (max 20MB)
            </p>
          </div>

          {documents.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 dark:border-input dark:bg-background"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:border dark:border-input dark:bg-background dark:text-slate-400">
                      <File className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate dark:text-slate-100">{doc.original_filename}</p>
                      <p className="text-xs text-muted-foreground dark:text-slate-400">
                        {((doc.file_size || 0) / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="flex-shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-6 text-center text-muted-foreground sm:py-8 dark:border-input dark:bg-background dark:text-slate-400">
              <File className="mx-auto mb-2 h-6 w-6 opacity-50 sm:h-8 sm:w-8" />
              <p className="text-sm">No documents uploaded yet</p>
              <p className="text-xs">Upload documents to improve your tour chatbot&apos;s responses</p>
            </div>
          )}
        </CardContent> : null}
      </Card>
      ) : null}

      {showTriggersSection ? <ChatbotTriggers chatbotConfigId={tourConfig?.id} /> : null}
    </div>
  );
} 