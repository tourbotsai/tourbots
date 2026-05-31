"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, Send, Settings2 } from "lucide-react";
import { useAdminSupportConversations } from "@/hooks/admin/useAdminSupportConversations";
import { cn } from "@/lib/utils";

export function AdminSupportConversations() {
  const {
    conversations,
    messages,
    activeConversationId,
    searchTerm,
    statusFilter,
    isLoadingConversations,
    isLoadingMessages,
    isSubmitting,
    isUpdatingConversation,
    setSearchTerm,
    setStatusFilter,
    fetchConversations,
    fetchMessages,
    sendAdminMessage,
    updateConversation,
  } = useAdminSupportConversations();

  const [replyMessage, setReplyMessage] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editStatus, setEditStatus] = useState<"open" | "closed">("open");

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  useEffect(() => {
    if (!isSettingsOpen && activeConversation) {
      setEditSubject(activeConversation.subject ?? "");
      setEditStatus(activeConversation.status);
    }
  }, [isSettingsOpen, activeConversation]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const handleSendReply = async () => {
    if (!activeConversationId || !replyMessage.trim()) return;
    const sent = await sendAdminMessage(activeConversationId, replyMessage.trim());
    if (sent) {
      setReplyMessage("");
    }
  };

  const handleOpenSettings = () => {
    if (!activeConversation) return;
    setEditSubject(activeConversation.subject ?? "");
    setEditStatus(activeConversation.status);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!activeConversationId) return;
    const updated = await updateConversation(activeConversationId, {
      subject: editSubject.trim(),
      status: editStatus,
    });
    if (updated) {
      setIsSettingsOpen(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="xl:h-[720px] xl:overflow-hidden">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>Contact Conversations</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchConversations} disabled={isLoadingConversations}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingConversations && "animate-spin")} />
              Refresh
            </Button>
          </div>
          <div className="space-y-3">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search conversations..."
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | "open" | "closed")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 overflow-y-auto xl:max-h-[560px]">
          {conversations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No support conversations yet.
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors",
                  activeConversationId === conversation.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/40"
                )}
                onClick={() => fetchMessages(conversation.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="line-clamp-1 text-sm font-medium">
                      {conversation.subject || conversation.help_topic}
                    </p>
                    <p className="text-xs text-muted-foreground">{conversation.requester_email}</p>
                  </div>
                  <Badge variant={conversation.status === "open" ? "default" : "outline"}>
                    {conversation.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated {formatDate(conversation.last_message_at)}
                </p>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="flex flex-col xl:h-[720px]">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <CardTitle>{activeConversation ? activeConversation.help_topic : "Select a conversation"}</CardTitle>
                <CardDescription>
                  {activeConversation
                    ? `${activeConversation.requester_name} (${activeConversation.requester_email})`
                    : "Choose a conversation on the left to review and reply."}
                </CardDescription>
              </div>
              {activeConversation && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOpenSettings}
                  title="Conversation settings"
                  className="shrink-0"
                >
                  <Settings2 className="h-4 w-4" />
                  <span className="sr-only">Conversation settings</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4 overflow-hidden">
            {!activeConversation ? (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                No conversation selected.
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-3">
                  {isLoadingMessages ? (
                    <p className="text-sm text-muted-foreground">Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages in this conversation yet.</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                          message.sender_type === "admin"
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "mr-auto border bg-background"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.message}</p>
                        <p
                          className={cn(
                            "mt-1 text-[11px]",
                            message.sender_type === "admin"
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {message.sender_type === "admin" ? "Admin" : "User"} - {formatDate(message.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <Textarea
                    value={replyMessage}
                    onChange={(event) => setReplyMessage(event.target.value)}
                    placeholder="Write your reply..."
                    className="min-h-[110px]"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSendReply} disabled={isSubmitting || !replyMessage.trim()}>
                      {isSubmitting ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conversation settings</DialogTitle>
            <DialogDescription>
              Rename this conversation or update its status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="conversation-subject">Conversation name</Label>
              <Input
                id="conversation-subject"
                value={editSubject}
                onChange={(event) => setEditSubject(event.target.value)}
                placeholder="Add a conversation name"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversation-status">Status</Label>
              <Select
                value={editStatus}
                onValueChange={(value) => setEditStatus(value as "open" | "closed")}
              >
                <SelectTrigger id="conversation-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(false)}
              disabled={isUpdatingConversation}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={isUpdatingConversation}>
              {isUpdatingConversation && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
