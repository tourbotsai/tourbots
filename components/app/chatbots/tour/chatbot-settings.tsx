"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, File, Trash2, Globe, BookOpen, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { useTourChatbotConfig } from "@/hooks/app/useTourChatbotConfig";
import { useTourChatbotDocuments } from "@/hooks/app/useTourChatbotDocuments";
import { useUser } from "@/hooks/useUser";
import { ChatbotConfig } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { HardLimitUsageWidget } from "@/components/shared/hard-limit-usage-widget";
import { HardLimitConfig, HardLimitUsage } from "@/lib/types";
import { ChatbotInfoSections } from "./chatbot-info-sections";
import { ChatbotTriggers } from "./chatbot-triggers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import { NoTourEmptyState } from "../no-tour-empty-state";

interface TourChatbotSettingsProps {
  selectedTourId?: string | null;
  chatbotConfigId?: string | null;
  visibleSections?: {
    config?: boolean;
    information?: boolean;
    documents?: boolean;
    triggers?: boolean;
  };
  /** Called after this chatbot config is deleted so the parent can refresh slots. */
  onDeleted?: () => void | Promise<void>;
}

const MAX_DOCUMENTS_PER_CHATBOT = 10;
const DEFAULT_TOUR_INSTRUCTION_PROMPT =
  "Guide visitors through the virtual tour clearly and concisely. Focus on what they can see in this location and help them navigate the space.";
const DEFAULT_TOUR_GUARDRAIL_PROMPT =
  "You are an AI assistant for this virtual tour. Only answer questions about this location, its spaces, and the virtual tour experience. If a question is unrelated, politely explain that you can only help with tour and location questions.";
const DEFAULT_WEBSITE_INSTRUCTION_PROMPT =
  "Answer questions about the business clearly and concisely. Help visitors understand opening hours, pricing, services, and how to get in touch.";
const DEFAULT_WEBSITE_GUARDRAIL_PROMPT =
  "You are an AI assistant for this business's website. Only answer questions about the business, its services, and how visitors can get in touch. If a question is unrelated, politely explain that you can only help with questions about the business.";

export function TourChatbotSettings({ selectedTourId, chatbotConfigId, visibleSections, onDeleted }: TourChatbotSettingsProps) {
  const isWebsiteMode = Boolean(chatbotConfigId);
  const effectiveScopeId = isWebsiteMode ? chatbotConfigId : selectedTourId;
  const showConfigSection = visibleSections?.config !== false;
  const showInformationSection = visibleSections?.information !== false;
  const showDocumentsSection = visibleSections?.documents !== false;
  // Triggers live on the Actions tab in the main app. Agency portal still opts in via visibleSections.
  const showTriggersSection = visibleSections?.triggers === true;
  const hasAnyVisibleSection =
    showConfigSection || showInformationSection || showDocumentsSection || showTriggersSection;

  const { tourConfig, isLoading, error, updateConfig, createConfig, deleteConfig } = useTourChatbotConfig(
    isWebsiteMode ? null : selectedTourId,
    undefined,
    isWebsiteMode ? chatbotConfigId : undefined
  );
  const { documents, isUploading, uploadDocument, deleteDocument } = useTourChatbotDocuments(
    tourConfig?.id,
    isWebsiteMode ? null : selectedTourId
  );
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
  const [pendingDeleteDoc, setPendingDeleteDoc] = useState<{ id: string; name: string } | null>(null);
  const [pendingDeleteChatbot, setPendingDeleteChatbot] = useState(false);

  const handleDeleteChatbot = async () => {
    if (!tourConfig?.id) return;
    try {
      await deleteConfig(tourConfig.id);
      toast({
        title: "Chatbot deleted",
        description: isWebsiteMode
          ? "The website chatbot has been removed and the bot slot is free to use again."
          : "This tour's chatbot configuration has been removed. You can create a new one when you need it.",
      });
      await onDeleted?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete chatbot",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Fetch hard limit data
  useEffect(() => {
    const fetchHardLimits = async () => {
      if (!user?.venue?.id || !effectiveScopeId) return;

      setIsLoadingHardLimits(true);
      try {
        const params = isWebsiteMode
          ? `chatbotType=website&chatbotConfigId=${effectiveScopeId}`
          : `chatbotType=tour&tourId=${effectiveScopeId}`;
        const response = await fetch(`/api/app/chatbots/hard-limits?venueId=${user.venue.id}&${params}`, {
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
  }, [user?.venue?.id, effectiveScopeId, isWebsiteMode, tourConfig, getAuthHeaders]);

  useEffect(() => {
    if (!effectiveScopeId) {
      setEditingConfig(null);
      return;
    }

    setEditingConfig(tourConfig || (isWebsiteMode ? {
      id: '',
      venue_id: user?.venue?.id || '',
      tour_id: null,
      chatbot_type: 'website',
      chatbot_name: 'Website Assistant',
      welcome_message: '',
      personality_prompt: '',
      instruction_prompt: DEFAULT_WEBSITE_INSTRUCTION_PROMPT,
      guardrails_enabled: true,
      guardrail_prompt: DEFAULT_WEBSITE_GUARDRAIL_PROMPT,
      is_active: true,
      created_at: '',
      updated_at: '',
      openai_vector_store_id: null
    } : {
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
    }) as ChatbotConfig);
  }, [tourConfig, effectiveScopeId, isWebsiteMode, selectedTourId, user?.venue?.id]);

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
        await createConfig(
          isWebsiteMode
            ? {
                chatbot_type: 'website',
                chatbot_name: editingConfig.chatbot_name,
                welcome_message: editingConfig.welcome_message,
                personality_prompt: editingConfig.personality_prompt,
                instruction_prompt: editingConfig.instruction_prompt,
                guardrails_enabled: editingConfig.guardrails_enabled,
                guardrail_prompt: editingConfig.guardrail_prompt,
                is_active: editingConfig.is_active,
              }
            : {
                tour_id: selectedTourId!,
                chatbot_name: editingConfig.chatbot_name,
                welcome_message: editingConfig.welcome_message,
                personality_prompt: editingConfig.personality_prompt,
                instruction_prompt: editingConfig.instruction_prompt,
                guardrails_enabled: editingConfig.guardrails_enabled,
                guardrail_prompt: editingConfig.guardrail_prompt,
                is_active: editingConfig.is_active,
              }
        );
      }
      toast({
        title: "Success",
        description: `${isWebsiteMode ? "Website" : "Virtual Tour"} chatbot configuration updated successfully`,
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
    if (!file || !user?.venue?.id || !effectiveScopeId || !tourConfig?.id) return;

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
      throw error;
    }
  };

  const handleViewDocument = async (documentId?: string | null) => {
    if (!documentId) {
      toast({
        title: "Error",
        description: "Document link is unavailable",
        variant: "destructive",
      });
      return;
    }

    try {
      const venueId = user?.venue?.id || '';
      // Bucket is private; the view route requires a Firebase bearer token to mint a signed URL.
      const response = await fetch(
        `/api/app/chatbots/documents/view?documentId=${encodeURIComponent(documentId)}&venueId=${encodeURIComponent(venueId)}`,
        { headers: await getAuthHeaders() }
      );
      const data = await response.json();
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || 'Failed to open document');
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Could not open document",
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

  if (!effectiveScopeId) {
    return <NoTourEmptyState />;
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
                  <span className="text-base sm:text-lg">Chatbot Configuration</span>
                </div>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 dark:text-slate-400">
                Configure your AI assistant&apos;s personality and behaviour
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
                disabled={!effectiveScopeId}
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
                placeholder={
                  isWebsiteMode
                    ? "Hello! I'm here to help. What would you like to know about us?"
                    : "Hello! I'm your virtual tour guide. How can I help you explore our facilities?"
                }
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
                placeholder={
                  isWebsiteMode
                    ? "You are a helpful and knowledgeable assistant for this business. Focus on answering questions about services, pricing, and how to get in touch..."
                    : "You are a helpful and knowledgeable tour guide. Focus on explaining fitness equipment, facilities, and what visitors can see during their virtual tour..."
                }
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
                placeholder={
                  isWebsiteMode
                    ? "Add specific instructions for how this chatbot should answer website visitors."
                    : "Add specific instructions for how this chatbot should answer in this tour."
                }
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
                  chatbotType={isWebsiteMode ? "website" : "tour"}
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
      !tourConfig?.id ? (
      <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm dark:border-input dark:bg-background">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:border dark:border-input dark:bg-background dark:text-slate-300 dark:ring-0">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <span>Training Documents</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1 dark:text-slate-400">
            Create and save your chatbot in the Configuration section first to manage training documents.
          </CardDescription>
        </CardHeader>
      </Card>
      ) : (
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
                disabled={isUploading || !isKnowledgeBaseExpanded || documents.length >= MAX_DOCUMENTS_PER_CHATBOT}
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
            <p className={`text-xs sm:ml-auto ${documents.length >= MAX_DOCUMENTS_PER_CHATBOT ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
              {documents.length} / {MAX_DOCUMENTS_PER_CHATBOT} documents used
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
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(doc.id)}
                      className="flex-shrink-0 text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-neutral-800 dark:hover:text-slate-100"
                      title="View document"
                      aria-label={`View ${doc.original_filename}`}
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDeleteDoc({ id: doc.id, name: doc.original_filename })}
                      className="flex-shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      title="Delete document"
                      aria-label={`Delete ${doc.original_filename}`}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
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
      )
      ) : null}

      {showTriggersSection ? (
        <ChatbotTriggers chatbotConfigId={tourConfig?.id} chatbotType={isWebsiteMode ? 'website' : 'tour'} />
      ) : null}

      {tourConfig?.id ? (
        <Card className="overflow-hidden border-red-200/80 bg-white/95 shadow-sm dark:border-red-900/50 dark:bg-background">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/60">
                    <Trash2 className="h-4 w-4" />
                  </span>
                  Delete chatbot
                </CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm dark:text-slate-400">
                  {isWebsiteMode
                    ? "Permanently remove this website chatbot and free the bot slot on your plan."
                    : "Remove this tour chatbot configuration. The tour itself stays in Tours; you can set up a new chatbot later."}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-red-200 bg-white text-red-700 hover:bg-red-50 hover:text-red-800 sm:w-auto dark:border-red-900/60 dark:bg-background dark:text-red-300 dark:hover:bg-red-950/40"
                onClick={() => setPendingDeleteChatbot(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete chatbot
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      <ConfirmDialog
        open={pendingDeleteChatbot}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteChatbot(false);
        }}
        title={
          isWebsiteMode
            ? `Delete "${tourConfig?.chatbot_name || "Website Assistant"}"?`
            : "Delete chatbot for this tour?"
        }
        description={
          isWebsiteMode
            ? "This website chatbot, its training documents, and related settings will be permanently deleted. This cannot be undone."
            : "This tour chatbot configuration, training documents, and related settings will be permanently deleted. The Matterport tour will not be deleted. This cannot be undone."
        }
        confirmText="Delete chatbot"
        destructive
        onConfirm={handleDeleteChatbot}
      />

      <ConfirmDialog
        open={pendingDeleteDoc !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteDoc(null);
        }}
        title="Delete this document?"
        description={
          pendingDeleteDoc
            ? `"${pendingDeleteDoc.name}" will be permanently removed from your chatbot's knowledge. This cannot be undone.`
            : "This document will be permanently removed from your chatbot's knowledge. This cannot be undone."
        }
        confirmText="Delete document"
        destructive
        onConfirm={async () => {
          if (pendingDeleteDoc) {
            await handleDeleteDocument(pendingDeleteDoc.id);
          }
        }}
      />
    </div>
  );
} 