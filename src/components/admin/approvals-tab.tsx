"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import {
  CheckCircle2, XCircle, Clock, Brain, RefreshCw, AlertCircle,
  ListTodo, FileText, Users,
} from "lucide-react";
import { toast } from "sonner";

type Approval = {
  id: string;
  agentType: string;
  entityType: string;
  action: string;
  payload: Record<string, unknown>;
  reasoning?: string | null;
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  reviewNotes?: string | null;
  gigId?: string | null;
  createdAt: string;
};

const ENTITY_ICONS: Record<string, typeof ListTodo> = {
  Task: ListTodo,
  ContentItem: FileText,
  Contact: Users,
};

const AGENT_LABELS: Record<string, string> = {
  task: "Task Agent",
  content: "Content Agent",
  booking: "Booking Agent",
  email: "Email Agent",
  inquiry: "Inquiry Agent",
  social: "Social Agent",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Čaká na schválenie",
  approved: "Schválené",
  rejected: "Zamietnuté",
};

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `pred ${min}min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `pred ${hr}h`;
  return `pred ${Math.floor(hr / 24)}d`;
}

function fmtPayload(payload: Record<string, unknown>): string {
  return Object.entries(payload)
    .filter(([k]) => !["gigId"].includes(k))
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v.slice(0, 80) : JSON.stringify(v).slice(0, 80)}`)
    .join(" · ");
}

export function ApprovalsTab() {
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [rejecting, setRejecting] = useState<Approval | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/approvals?status=${statusFilter}`);
      if (!res.ok) throw new Error("Načítanie zlyhalo");
      const d = await res.json();
      setItems(d.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznáma chyba");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/approvals/${id}/approve`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Schválenie zlyhalo");
      }
      toast.success("Návrh schválený", { description: "Záznam bol vytvorený." });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setProcessing(rejecting.id);
    try {
      const res = await fetch(`/api/admin/approvals/${rejecting.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: rejectNotes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Zamietnutie zlyhalo");
      }
      toast.success("Návrh zamietnutý");
      setRejecting(null);
      setRejectNotes("");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba");
    } finally {
      setProcessing(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-violet-500" />
            Schválenia AI agentov
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Human-in-the-Loop: AI agenti vytvárajú návrhy, admin schvaľuje pred vykonaním
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Obnoviť
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={pendingCount > 0 ? "border-amber-500/40" : ""}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Čakajúce návrhy</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{pendingCount}</p>
              </div>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Agenti</p>
                <p className="text-3xl font-bold tabular-nums">{Object.keys(AGENT_LABELS).length}</p>
              </div>
              <Brain className="h-5 w-5 text-violet-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Typy entít</p>
                <p className="text-3xl font-bold tabular-nums">{Object.keys(ENTITY_ICONS).length}</p>
              </div>
              <AlertCircle className="h-5 w-5 text-sky-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status filter tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pending">
            Čakajú {pendingCount > 0 && `(${pendingCount})`}
          </TabsTrigger>
          <TabsTrigger value="approved">Schválené</TabsTrigger>
          <TabsTrigger value="rejected">Zamietnuté</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {loading ? (
            <LoadingSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              title={statusFilter === "pending" ? "Žiadne čakajúce návrhy" : `Žiadne ${STATUS_LABELS[statusFilter]?.toLowerCase()} návrhy`}
              description={statusFilter === "pending"
                ? "AI agenti nevytvorili žiadne nové návrhy. Vytvor koncert alebo dopyt pre aktiváciu agentov."
                : "Žiadne návrhy v tomto stave."}
              icon={Brain}
            />
          ) : (
            <ScrollArea className="h-[600px] rounded-md border">
              <div className="divide-y">
                {items.map((item) => {
                  const EntityIcon = ENTITY_ICONS[item.entityType] || FileText;
                  return (
                    <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/30 shrink-0">
                          <EntityIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="secondary" className="text-[10px]">
                              {AGENT_LABELS[item.agentType] || item.agentType}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {item.action}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[item.status]}`}>
                              {STATUS_LABELS[item.status] || item.status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {fmtRelative(item.createdAt)}
                            </span>
                          </div>
                          {/* Payload preview */}
                          <div className="text-sm font-medium mt-1">
                            {item.payload.title || item.payload.name || item.action}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {fmtPayload(item.payload)}
                          </div>
                          {item.reasoning && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
                              💡 {item.reasoning}
                            </div>
                          )}
                          {item.reviewNotes && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              ✗ {item.reviewNotes}
                            </div>
                          )}
                          {item.approvedBy && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {item.status === "approved" ? "Schválil" : "Zamietol"}: {item.approvedBy}
                              {item.approvedAt && ` · ${fmtRelative(item.approvedAt)}`}
                            </div>
                          )}

                          {/* Actions */}
                          {item.status === "pending" && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleApprove(item.id)}
                                disabled={processing === item.id}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Schváliť
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:border-red-500/40"
                                onClick={() => { setRejecting(item); setRejectNotes(""); }}
                                disabled={processing === item.id}
                              >
                                <XCircle className="h-3 w-3" />
                                Zamietnuť
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <Dialog open={!!rejecting} onOpenChange={(v) => !v && setRejecting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zamietnuť návrh</DialogTitle>
            <DialogDescription>
              Návrh bude označený ako zamietnutý. Voliteľne pridaj dôvod.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-muted/50 text-sm">
              <div className="font-medium">{rejecting?.payload.title || rejecting?.action}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {rejecting && fmtPayload(rejecting.payload)}
              </div>
            </div>
            <Textarea
              placeholder="Dôvod zamietnutia (voliteľné)..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Zrušiť</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!!processing}
            >
              {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Zamietnuť návrh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}
