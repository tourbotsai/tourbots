"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Search,
  X,
} from "lucide-react";
import { Conversation } from "@/lib/types";

interface ConversationGroup {
  conversation_id: string;
  session_id: string;
  messages: Conversation[];
  first_message_time: string;
  last_message_time: string;
  total_messages: number;
  visitor_messages: number;
  bot_messages: number;
  domain?: string;
  ip_address?: string;
  user_agent?: string;
  page_url?: string;
  embed_id?: string;
  avg_response_time?: number;
}

/**
 * Wraps occurrences of `query` within `text` in a highlight mark. Case-insensitive
 * and regex-safe. Returns the plain string when there is no query.
 */
function highlightText(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={i}
        className="rounded-sm bg-yellow-200 px-0.5 text-slate-900 dark:bg-yellow-400/30 dark:text-yellow-50"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function getDeviceType(userAgent?: string) {
  if (!userAgent) return "Desktop";
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return "Mobile";
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return "Tablet";
  }
  return "Desktop";
}

function getDeviceIcon(userAgent?: string) {
  if (!userAgent) return <Monitor className="w-4 h-4" />;
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return <Smartphone className="w-4 h-4" />;
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return <Tablet className="w-4 h-4" />;
  }
  return <Monitor className="w-4 h-4" />;
}

interface ConversationSessionsProps {
  conversations: Conversation[];
  /** Badge text shown on each conversation (e.g. "tour"). */
  typeLabel?: string;
}

/**
 * Collapsible "Conversation sessions" panel with search, device/domain filters,
 * sorting and in-message search highlighting. Shared between the chatbot
 * analytics tab and the tour analytics tab so both behave identically.
 */
export function ConversationSessions({ conversations, typeLabel = "tour" }: ConversationSessionsProps) {
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set());
  const [isConversationsSectionExpanded, setIsConversationsSectionExpanded] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<"all" | "Desktop" | "Mobile" | "Tablet">("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "recent" | "oldest" | "most_messages" | "fewest_messages" | "fastest" | "slowest"
  >("recent");

  // Group raw messages into conversation threads (most recent first by default).
  const conversationGroups = useMemo<ConversationGroup[]>(() => {
    const grouped = conversations.reduce((acc: { [key: string]: Conversation[] }, conversation) => {
      const key = conversation.conversation_id || conversation.session_id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(conversation);
      return acc;
    }, {});

    const groups: ConversationGroup[] = Object.entries(grouped).map(([conversationId, messages]) => {
      const sortedMessages = messages
        .slice()
        .sort((a, b) => (a.message_position || 0) - (b.message_position || 0));
      const visitorMessages = messages.filter((m) => m.message_type === "visitor");
      const botMessages = messages.filter((m) => m.message_type === "bot");
      const responseTimes = messages
        .filter((m) => m.response_time_ms)
        .map((m) => m.response_time_ms!);

      return {
        conversation_id: conversationId,
        session_id: messages[0].session_id,
        messages: sortedMessages,
        first_message_time: sortedMessages[0]?.created_at || "",
        last_message_time: sortedMessages[sortedMessages.length - 1]?.created_at || "",
        total_messages: messages.length,
        visitor_messages: visitorMessages.length,
        bot_messages: botMessages.length,
        domain: messages[0]?.domain || undefined,
        ip_address: messages[0]?.ip_address || undefined,
        user_agent: messages[0]?.user_agent || undefined,
        page_url: messages[0]?.page_url || undefined,
        embed_id: messages[0]?.embed_id || undefined,
        avg_response_time:
          responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : undefined,
      };
    });

    groups.sort(
      (a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
    );

    return groups;
  }, [conversations]);

  const domainOptions = useMemo(() => {
    const set = new Set<string>();
    conversationGroups.forEach((g) => {
      if (g.domain) set.add(g.domain);
    });
    return Array.from(set).sort();
  }, [conversationGroups]);

  const isFiltering =
    searchQuery.trim() !== "" || deviceFilter !== "all" || domainFilter !== "all";

  const filteredGroups = useMemo(() => {
    let result = [...conversationGroups];

    if (deviceFilter !== "all") {
      result = result.filter((g) => getDeviceType(g.user_agent) === deviceFilter);
    }

    if (domainFilter !== "all") {
      result = result.filter((g) => (g.domain || "") === domainFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((g) => {
        if (g.conversation_id.toLowerCase().includes(q)) return true;
        if ((g.domain || "").toLowerCase().includes(q)) return true;
        return g.messages.some(
          (m) =>
            (m.message || "").toLowerCase().includes(q) ||
            (m.response || "").toLowerCase().includes(q)
        );
      });
    }

    switch (sortBy) {
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.last_message_time).getTime() - new Date(b.last_message_time).getTime()
        );
        break;
      case "most_messages":
        result.sort((a, b) => b.total_messages - a.total_messages);
        break;
      case "fewest_messages":
        result.sort((a, b) => a.total_messages - b.total_messages);
        break;
      case "fastest":
        result.sort(
          (a, b) => (a.avg_response_time ?? Infinity) - (b.avg_response_time ?? Infinity)
        );
        break;
      case "slowest":
        result.sort((a, b) => (b.avg_response_time ?? -1) - (a.avg_response_time ?? -1));
        break;
      case "recent":
      default:
        result.sort(
          (a, b) =>
            new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
        );
        break;
    }

    return result;
  }, [conversationGroups, deviceFilter, domainFilter, searchQuery, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setDeviceFilter("all");
    setDomainFilter("all");
  };

  const toggleConversation = (conversationId: string) => {
    const newExpanded = new Set(expandedConversations);
    if (newExpanded.has(conversationId)) {
      newExpanded.delete(conversationId);
    } else {
      newExpanded.add(conversationId);
    }
    setExpandedConversations(newExpanded);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Conversation sessions</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Full chatbot conversation threads with metadata and response timing.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsConversationsSectionExpanded(!isConversationsSectionExpanded)}
          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
        >
          {isConversationsSectionExpanded ? (
            <>
              Collapse
              <ChevronUp className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Expand
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {isConversationsSectionExpanded && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-input dark:bg-background">
          {conversationGroups.length === 0 ? (
            <div className="py-8 text-center">
              <MessageCircle className="mx-auto mb-4 h-10 w-10 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-300">No chatbot conversations yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sessions will appear here once visitors start chatting.
              </p>
            </div>
          ) : (
            <>
              {/* Search / filter / sort controls */}
              <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations, domains or message text…"
                    className="h-9 pl-8 pr-8 dark:border-input dark:bg-background dark:text-slate-100"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Select value={deviceFilter} onValueChange={(v) => setDeviceFilter(v as typeof deviceFilter)}>
                  <SelectTrigger className="h-9 lg:w-[150px] dark:border-input dark:bg-background dark:text-slate-100">
                    <SelectValue placeholder="Device" />
                  </SelectTrigger>
                  <SelectContent className="dark:border-input dark:bg-background dark:text-slate-100">
                    <SelectItem value="all">All devices</SelectItem>
                    <SelectItem value="Desktop">Desktop</SelectItem>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>

                {domainOptions.length > 0 && (
                  <Select value={domainFilter} onValueChange={setDomainFilter}>
                    <SelectTrigger className="h-9 lg:w-[170px] dark:border-input dark:bg-background dark:text-slate-100">
                      <SelectValue placeholder="Domain" />
                    </SelectTrigger>
                    <SelectContent className="dark:border-input dark:bg-background dark:text-slate-100">
                      <SelectItem value="all">All domains</SelectItem>
                      {domainOptions.map((domain) => (
                        <SelectItem key={domain} value={domain}>
                          {domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="h-9 lg:w-[180px] dark:border-input dark:bg-background dark:text-slate-100">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="dark:border-input dark:bg-background dark:text-slate-100">
                    <SelectItem value="recent">Most recent</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="most_messages">Most messages</SelectItem>
                    <SelectItem value="fewest_messages">Fewest messages</SelectItem>
                    <SelectItem value="fastest">Fastest response</SelectItem>
                    <SelectItem value="slowest">Slowest response</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Result count + clear */}
              <div className="mb-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Showing {filteredGroups.length} of {conversationGroups.length}{" "}
                  {conversationGroups.length === 1 ? "conversation" : "conversations"}
                </span>
                {isFiltering && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                  </button>
                )}
              </div>

              {filteredGroups.length === 0 ? (
                <div className="py-10 text-center">
                  <Search className="mx-auto mb-3 h-9 w-9 text-slate-300" />
                  <p className="text-slate-600 dark:text-slate-300">No conversations match your filters</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredGroups.map((group) => (
                    <div
                      key={group.conversation_id}
                      className="rounded-lg border border-slate-200 bg-white p-4 dark:border-input dark:bg-background"
                    >
                      {/* Conversation Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleConversation(group.conversation_id)}
                            className="p-1"
                          >
                            {expandedConversations.has(group.conversation_id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                          <div>
                            <h4 className="font-medium">Conversation #{group.conversation_id.slice(-8)}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span>{new Date(group.first_message_time).toLocaleString()}</span>
                              {group.domain && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {group.domain}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                {getDeviceIcon(group.user_agent)}
                                Device
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700 dark:border-input dark:bg-background dark:text-slate-300">
                            {group.total_messages} messages
                          </Badge>
                          {group.avg_response_time && (
                            <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700 dark:border-input dark:bg-background dark:text-slate-300">
                              {group.avg_response_time}ms avg
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700 dark:border-input dark:bg-background dark:text-slate-300">
                            {typeLabel}
                          </Badge>
                        </div>
                      </div>

                      {/* Expanded Conversation Messages */}
                      {expandedConversations.has(group.conversation_id) && (
                        <div className="space-y-3 border-l-2 border-slate-200 pl-8 dark:border-slate-700">
                          {group.messages.map((message, index) => (
                            <div key={message.id} className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {message.message_type === "visitor" ? (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800">
                                    <Users className="h-3 w-3 text-slate-700 dark:text-slate-300" />
                                  </div>
                                ) : (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800">
                                    <MessageCircle className="h-3 w-3 text-slate-700 dark:text-slate-300" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium">
                                    {message.message_type === "visitor" ? "Visitor" : "Tour Bot"}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span>#{message.message_position || index + 1}</span>
                                    <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                                    {message.response_time_ms && (
                                      <span className="text-slate-600 dark:text-slate-300">{message.response_time_ms}ms</span>
                                    )}
                                  </div>
                                </div>
                                <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                                  {highlightText(
                                    message.message_type === "visitor"
                                      ? message.message || "No message content"
                                      : message.response || "No response content",
                                    searchQuery
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
