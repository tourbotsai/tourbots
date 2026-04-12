"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, Trash2, Loader2, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useChatbotDocuments } from "@/hooks/admin/useChatbotDocuments";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface ChatbotTrainingDocumentsProps {
  forcedVenueId?: string;
  hideHeader?: boolean;
}

export function ChatbotTrainingDocuments({
  forcedVenueId,
  hideHeader = false, // kept for API compatibility
}: ChatbotTrainingDocumentsProps = {}) {
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const { documents, isLoading, isUploading, fetchDocuments, uploadDocument, deleteDocument } = useChatbotDocuments();
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleDocuments = useMemo(
    () => documents.filter((doc) => !forcedVenueId || doc.venue_id === forcedVenueId).filter((doc) => doc.chatbot_type === "tour"),
    [documents, forcedVenueId],
  );

  useEffect(() => {
    fetchDocuments(forcedVenueId, "tour");
  }, [fetchDocuments, forcedVenueId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !forcedVenueId || !user?.id) return;

    try {
      await uploadDocument(file, forcedVenueId, user.id, "tour");
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      event.target.value = "";
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(documentId, forcedVenueId, "tour");
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  if (!forcedVenueId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
        Select an account first to manage training documents.
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/95 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span>Training Documents</span>
            </CardTitle>
            <p className="text-xs sm:text-sm mt-1 text-slate-500">
              Upload documents to improve tour chatbot responses for this account.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-slate-200 bg-white"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </CardHeader>

      {isExpanded ? (
        <CardContent className="space-y-4 border-t border-slate-200/80 bg-slate-50/40 pt-5 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              onClick={() => document.getElementById("admin-training-doc-upload")?.click()}
              disabled={isUploading}
              size="sm"
              variant="outline"
              className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100 sm:w-auto"
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
            <input
              id="admin-training-doc-upload"
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <p className="text-xs text-slate-500">Supports PDF, TXT, DOC and DOCX</p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents...
            </div>
          ) : visibleDocuments.length > 0 ? (
            <div className="space-y-2">
              {visibleDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <File className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{doc.original_filename}</p>
                      <p className="text-xs text-slate-500">
                        {((doc.file_size || 0) / 1024).toFixed(1)} KB · {new Date(doc.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white py-6 text-center text-muted-foreground">
              <File className="mx-auto mb-2 h-6 w-6 opacity-50" />
              <p className="text-sm">No training documents uploaded yet.</p>
            </div>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}
