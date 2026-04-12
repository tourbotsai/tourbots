"use client";

import { useMemo, useState } from "react";
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
import { MessageSquare, RefreshCw, Send } from "lucide-react";
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
    setSearchTerm,
    setStatusFilter,
    fetchConversations,
    fetchMessages,
    sendAdminMessage,
  } = useAdminSupportConversations();

  const [replyMessage, setReplyMessage] = useState("");

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

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
        <Card>
          <CardHeader>
            <CardTitle>{activeConversation ? activeConversation.help_topic : "Select a conversation"}</CardTitle>
            <CardDescription>
              {activeConversation
                ? `${activeConversation.requester_name} (${activeConversation.requester_email})`
                : "Choose a conversation on the left to review and reply."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!activeConversation ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                No conversation selected.
              </div>
            ) : (
              <>
                <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-3">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversation Guidance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
              Keep all communication in the same thread so users have a complete support history in-app.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
