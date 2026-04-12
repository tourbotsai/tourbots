"use client";

import { useEffect, useState } from "react";
import { HelpCenterGrid } from "@/components/app/help/HelpCenterGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useSupportConversations } from "@/hooks/app/useSupportConversations";
import { cn } from "@/lib/utils";

export function HelpCenterTabs() {
  const { user } = useUser();
  const {
    conversations,
    messages,
    activeConversationId,
    isLoadingConversations,
    isLoadingMessages,
    isSubmitting,
    setActiveConversationId,
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessage,
    deleteConversation,
  } = useSupportConversations();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    venueName: "",
    helpTopic: "",
    message: "",
  });
  const [replyMessage, setReplyMessage] = useState("");
  const [isComposingNew, setIsComposingNew] = useState(true);
  const [localMessage, setLocalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
    setFormData((prev) => ({
      ...prev,
      name: prev.name || fullName,
      email: prev.email || user.email || "",
      venueName: prev.venueName || user.venue?.name || "",
      phone: prev.phone || user.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    if (conversations.length === 0) {
      setIsComposingNew(true);
    } else if (!isComposingNew && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations, isComposingNew, setActiveConversationId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, helpTopic: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);

    const createdConversation = await createConversation(formData);
    if (createdConversation) {
      setIsComposingNew(false);
      setActiveConversationId(createdConversation.id);
      setFormData((prev) => ({
        ...prev,
        helpTopic: "",
        message: "",
      }));
      setLocalMessage({
        type: "success",
        text: "Support request sent. You can continue this conversation below.",
      });
    }
  };

  const handleOpenConversation = async (conversationId: string) => {
    setIsComposingNew(false);
    await fetchMessages(conversationId);
  };

  const handleSendReply = async () => {
    if (!activeConversationId || !replyMessage.trim()) return;
    const sent = await sendMessage(activeConversationId, replyMessage.trim());
    if (sent) {
      setReplyMessage("");
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeConversationId) return;
    const shouldDelete = window.confirm("Delete this conversation and all messages?");
    if (!shouldDelete) return;

    const deleted = await deleteConversation(activeConversationId);
    if (deleted) {
      setIsComposingNew(true);
      setReplyMessage("");
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) || null;

  return (
    <Tabs defaultValue="guides" className="space-y-6">
      <TabsList className="grid h-10 w-full grid-cols-2 items-stretch rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-input dark:bg-background">
        <TabsTrigger
          value="guides"
          className="h-full rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
        >
          Guides
        </TabsTrigger>
        <TabsTrigger
          value="support"
          className="h-full rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:border dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-slate-100"
        >
          Contact Support
        </TabsTrigger>
      </TabsList>

      <TabsContent value="guides" className="space-y-6">
        <HelpCenterGrid />
      </TabsContent>

      <TabsContent value="support" className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[330px_1fr]">
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background xl:h-[760px] xl:overflow-hidden">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-slate-900 dark:text-slate-100">Your Conversations</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchConversations}
                  disabled={isLoadingConversations}
                  className="dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingConversations && "animate-spin")} />
                  Refresh
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                onClick={() => {
                  setIsComposingNew(true);
                  setActiveConversationId(null);
                  setLocalMessage(null);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Conversation
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 overflow-y-auto xl:max-h-[610px]">
              {conversations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500 dark:border-input dark:text-slate-400">
                  No conversations yet. Start your first support request.
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      !isComposingNew && activeConversationId === conversation.id
                        ? "border-slate-900 bg-slate-50 dark:border-slate-600 dark:bg-neutral-800"
                        : "border-slate-200 hover:bg-slate-50 dark:border-input dark:hover:bg-neutral-800"
                    )}
                    onClick={() => handleOpenConversation(conversation.id)}
                  >
                    <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {conversation.subject || conversation.help_topic}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(conversation.last_message_at)}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{conversation.status}</p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {isComposingNew || !activeConversation ? (
              <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
                <CardHeader>
                  <CardTitle className="text-base text-slate-900 dark:text-slate-100">Contact Support</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Start a new conversation with support. We will reply in this thread.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Full name *</Label>
                        <Input
                          id="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          disabled={isSubmitting}
                          className="border-slate-300 bg-white dark:border-input dark:bg-background dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email address *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@company.com"
                          disabled={isSubmitting}
                          className="border-slate-300 bg-white dark:border-input dark:bg-background dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="venueName" className="text-slate-700 dark:text-slate-300">Company name</Label>
                        <Input
                          id="venueName"
                          value={formData.venueName}
                          onChange={handleChange}
                          placeholder="Your company"
                          disabled={isSubmitting}
                          className="border-slate-300 bg-white dark:border-input dark:bg-background dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Phone number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+44..."
                          disabled={isSubmitting}
                          className="border-slate-300 bg-white dark:border-input dark:bg-background dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="helpTopic" className="text-slate-700 dark:text-slate-300">Issue type *</Label>
                      <Select
                        value={formData.helpTopic}
                        onValueChange={handleSelectChange}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="border-slate-300 bg-white dark:border-input dark:bg-background dark:text-slate-100">
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                        <SelectContent className="dark:border-input dark:bg-background dark:text-slate-100">
                          <SelectItem value="tour-setup">Tour setup</SelectItem>
                          <SelectItem value="chatbot">Chatbot configuration</SelectItem>
                          <SelectItem value="embed">Share and embed</SelectItem>
                          <SelectItem value="billing">Billing and account</SelectItem>
                          <SelectItem value="bug">Bug report</SelectItem>
                          <SelectItem value="general">General support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-slate-700 dark:text-slate-300">Describe the issue *</Label>
                      <Textarea
                        id="message"
                        required
                        minLength={10}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="What is the issue, what did you expect, and what happened instead?"
                        disabled={isSubmitting}
                        className="min-h-[120px] border-slate-300 bg-white dark:border-input dark:bg-background dark:text-slate-100"
                      />
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Start Conversation
                        </>
                      )}
                    </Button>

                    {localMessage?.type === "success" && (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-input dark:bg-background dark:text-slate-300">
                        {localMessage.text}
                      </div>
                    )}
                    {localMessage?.type === "error" && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-input dark:bg-background dark:text-slate-300">
                        {localMessage.text}
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
                <CardHeader className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-base text-slate-900 dark:text-slate-100">{activeConversation.help_topic}</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        Started {formatDate(activeConversation.created_at)}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteConversation}
                      disabled={isSubmitting}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/40 p-3 dark:border-input dark:bg-background">
                    {isLoadingMessages ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Loading messages...</p>
                    ) : messages.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No messages in this conversation yet.</p>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                            message.sender_type === "user"
                              ? "ml-auto bg-slate-900 text-white"
                              : "mr-auto border border-slate-200 bg-white text-slate-800 dark:border-input dark:bg-background dark:text-slate-200"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.message}</p>
                          <p
                            className={cn(
                              "mt-1 text-[11px]",
                              message.sender_type === "user" ? "text-slate-200" : "text-slate-500"
                            )}
                          >
                            {message.sender_type === "user" ? "You" : "Support"} - {formatDate(message.created_at)}
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
                      disabled={isSubmitting}
                      className="min-h-[110px] border-slate-300 bg-white dark:border-input dark:bg-background dark:text-slate-100"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSendReply}
                        disabled={isSubmitting || !replyMessage.trim()}
                        className="bg-slate-900 text-white hover:bg-slate-800"
                      >
                        {isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-input dark:bg-background">
              <CardContent className="flex items-start gap-3 p-4 text-sm text-slate-600 dark:text-slate-400">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                Keep all support updates in one thread so you and your team can track full context.
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

