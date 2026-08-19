"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import {
  ShoppingCart, Package, TrendingUp, AlertTriangle, Star, Plus, Pencil, Trash2,
  DollarSign, Boxes, RefreshCw, Crown, Search,
} from "lucide-react";
import { toast } from "sonner";

// =====================================================
// TYPES
// =====================================================

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  sizes: string[];
  colors: string[];
  imageUrl?: string | null;
  active: boolean;
  bestSeller: boolean;
  orderCount: number;
};

type Order = {
  id: string;
  type: string;
  gigId?: string | null;
  productId: string;
  quantity: number;
  unitPrice: number;
  size?: string | null;
  color?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  status: string;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt: string;
  product?: { name: string; category: string; imageUrl?: string | null } | null;
  total: number;
};

type Stats = {
  summary: {
    totalProducts: number;
    activeProducts: number;
    totalStock: number;
    lowStockCount: number;
    bestSellerCount: number;
    monthRevenue: number;
    totalRevenue: number;
    monthOrders: number;
    totalOrders: number;
    monthItemsSold: number;
    totalItemsSold: number;
  };
  lowStockProducts: { id: string; name: string; category: string; stock: number; minStock: number; price: number }[];
  bestSellers: { id: string; name: string; price: number; stock: number; category: string; imageUrl?: string | null }[];
  topProducts: { productId: string; name: string; category: string; price: number; imageUrl?: string | null; quantitySold: number; orderCount: number; revenue: number }[];
  categoryStats: { category: string; productCount: number; stockValue: number; potentialRevenue: number }[];
  recentOrders: Order[];
};

const CATEGORY_LABELS: Record<string, string> = {
  "t-shirt": "Tričká",
  "vinyl": "Vinyly",
  "cd": "CD",
  "poster": "Plagáty",
  "sticker": "Nálepky",
  "other": "Ostatné",
};

const CATEGORY_EMOJI: Record<string, string> = {
  "t-shirt": "👕",
  "vinyl": "💿",
  "cd": "🎵",
  "poster": "🖼️",
  "sticker": "✨",
  "other": "📦",
};

const STATUS_COLORS: Record<string, string> = {
  "confirmed": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "pending": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "shipped": "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  "delivered": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "cancelled": "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  "refunded": "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
};

const STATUS_LABELS: Record<string, string> = {
  "confirmed": "Potvrdená",
  "pending": "Čaká",
  "shipped": "Odoslaná",
  "delivered": "Doručená",
  "cancelled": "Zrušená",
  "refunded": "Refund",
};

function fmtPrice(n: number): string {
  return `${n.toFixed(2)}€`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sk-SK", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `pred ${min}min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `pred ${hr}h`;
  return `pred ${Math.floor(hr / 24)}d`;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export function MerchTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "stats">("stats");
  const [search, setSearch] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        fetch("/api/admin/merch/stats"),
        fetch("/api/admin/merch/products"),
        fetch("/api/admin/merch/orders"),
      ]);
      if (!statsRes.ok || !productsRes.ok || !ordersRes.ok) throw new Error("Načítanie zlyhalo");
      const [s, p, o] = await Promise.all([statsRes.json(), productsRes.json(), ordersRes.json()]);
      setStats(s);
      setProducts(p.items || []);
      setOrders(o.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznáma chyba");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (loading && !stats) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-emerald-500" />
            Merchandise OS
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Produkty, sklad, objednávky, event predaj a revenue analýza
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Obnoviť
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setEditingProduct(null); setShowOrderForm(true); }}>
            <Plus className="h-4 w-4" />
            Nová objednávka
          </Button>
          <Button size="sm" onClick={() => { setEditingProduct(null); setShowProductForm(true); }}>
            <Plus className="h-4 w-4" />
            Nový produkt
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Revenue celkom"
            value={fmtPrice(stats.summary.totalRevenue)}
            subtitle={`${fmtPrice(stats.summary.monthRevenue)} tento mesiac`}
            icon={<DollarSign className="h-5 w-5" />}
            accent="emerald"
          />
          <KpiCard
            title="Predané kusy"
            value={stats.summary.totalItemsSold.toLocaleString("sk-SK")}
            subtitle={`${stats.summary.monthItemsSold} tento mesiac`}
            icon={<ShoppingCart className="h-5 w-5" />}
            accent="sky"
          />
          <KpiCard
            title="Aktívne produkty"
            value={stats.summary.activeProducts.toString()}
            subtitle={`${stats.summary.totalProducts} celkom · ${stats.summary.totalStock} ks skladom`}
            icon={<Package className="h-5 w-5" />}
            accent="violet"
          />
          <KpiCard
            title="Low stock alert"
            value={stats.summary.lowStockCount.toString()}
            subtitle={`${stats.summary.bestSellerCount} bestsellerov`}
            icon={<AlertTriangle className="h-5 w-5" />}
            accent={stats.summary.lowStockCount > 0 ? "amber" : "emerald"}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="stats">Štatistiky</TabsTrigger>
          <TabsTrigger value="products">Produkty ({products.length})</TabsTrigger>
          <TabsTrigger value="orders">Objednávky ({orders.length})</TabsTrigger>
        </TabsList>

        {/* STATS TAB */}
        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <>
              {/* Low stock alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Low stock alert
                  </CardTitle>
                  <CardDescription>Produkty pod minimálnou zásobou — treba doplniť</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.lowStockProducts.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">
                      <CheckIcon /> Všetky produkty majú dostatočnú zásobu.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stats.lowStockProducts.map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-3 p-2 rounded-md border bg-amber-50/30 dark:bg-amber-950/10">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl">{CATEGORY_EMOJI[p.category] || "📦"}</span>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{p.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {CATEGORY_LABELS[p.category] || p.category} · {fmtPrice(p.price)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs">
                              {p.stock} ks
                            </Badge>
                            <div className="text-[10px] text-muted-foreground mt-0.5">min: {p.minStock}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top produkty */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Top produkty podľa predaja
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.topProducts.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">
                      Zatiaľ žiadne predané produkty. Vytvor objednávku alebo event predaj.
                    </div>
                  ) : (
                    stats.topProducts.map((p, idx) => {
                      const maxQty = Math.max(...stats.topProducts.map(t => t.quantitySold), 1);
                      return (
                        <div key={p.productId} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-xs w-5 text-center">{idx + 1}.</span>
                              <span className="text-lg">{CATEGORY_EMOJI[p.category] || "📦"}</span>
                              <span className="font-medium truncate">{p.name}</span>
                              <Badge variant="outline" className="text-[10px]">{p.orderCount}× objednávok</Badge>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-muted-foreground">{p.quantitySold} ks</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{fmtPrice(p.revenue)}</span>
                            </div>
                          </div>
                          <Progress value={(p.quantitySold / maxQty) * 100} className="h-1.5" />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Best sellers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Star className="h-4 w-4 text-amber-500" />
                      Best sellery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.bestSellers.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4 text-center">Žiadne best sellery.</div>
                    ) : (
                      <div className="space-y-2">
                        {stats.bestSellers.map(b => (
                          <div key={b.id} className="flex items-center gap-3 p-2 rounded-md border bg-amber-50/30 dark:bg-amber-950/10">
                            <span className="text-xl">{CATEGORY_EMOJI[b.category] || "📦"}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{b.name}</div>
                              <div className="text-xs text-muted-foreground">{CATEGORY_LABELS[b.category] || b.category} · {b.stock} ks skladom</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-semibold">{fmtPrice(b.price)}</div>
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400 ml-auto" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Category stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Boxes className="h-4 w-4 text-violet-500" />
                      Kategórie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.categoryStats.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4 text-center">Žiadne dáta.</div>
                    ) : (
                      <div className="space-y-2">
                        {stats.categoryStats.map(c => (
                          <div key={c.category} className="flex items-center justify-between gap-2 text-sm p-2 rounded-md hover:bg-muted/40">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{CATEGORY_EMOJI[c.category] || "📦"}</span>
                              <div>
                                <div className="font-medium">{CATEGORY_LABELS[c.category] || c.category}</div>
                                <div className="text-xs text-muted-foreground">{c.productCount} produktov · hodnota skladu {fmtPrice(c.stockValue)}</div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-semibold tabular-nums">{fmtPrice(c.potentialRevenue)}</div>
                              <div className="text-[10px] text-muted-foreground">potenciál</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* PRODUCTS TAB */}
        <TabsContent value="products" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hľadať produkty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState
              title={search ? "Žiadne produkty nezodpovedajú vyhľadávaniu" : "Žiadne produkty"}
              description={search ? "Skús iný hľadaný výraz." : "Vytvor prvý merch produkt."}
              icon={Package}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onEdit={() => { setEditingProduct(p); setShowProductForm(true); }}
                  onDeleted={() => void load()}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ORDERS TAB */}
        <TabsContent value="orders" className="space-y-4">
          {orders.length === 0 ? (
            <EmptyState
              title="Žiadne objednávky"
              description="Vytvor prvú objednávku alebo zaznamenaj event predaj."
              icon={ShoppingCart}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="divide-y">
                    {orders.map(o => (
                      <OrderRow key={o.id} order={o} onDeleted={() => void load()} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Product form dialog */}
      <ProductFormDialog
        open={showProductForm}
        onOpenChange={setShowProductForm}
        product={editingProduct}
        onSaved={() => { setShowProductForm(false); void load(); }}
      />

      {/* Order form dialog */}
      <OrderFormDialog
        open={showOrderForm}
        onOpenChange={setShowOrderForm}
        products={products}
        onSaved={() => { setShowOrderForm(false); void load(); }}
      />
    </div>
  );
}

// =====================================================
// PRODUCT CARD
// =====================================================

function ProductCard({ product, onEdit, onDeleted }: { product: Product; onEdit: () => void; onDeleted: () => void }) {
  const margin = product.costPrice > 0 ? ((product.price - product.costPrice) / product.price) * 100 : 100;
  const lowStock = product.stock <= product.minStock;

  return (
    <Card className={lowStock ? "border-amber-500/40" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0">{CATEGORY_EMOJI[product.category] || "📦"}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{product.name}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[product.category] || product.category}</Badge>
                  {product.bestSeller && (
                    <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 mr-1" />
                      Best seller
                    </Badge>
                  )}
                  {!product.active && (
                    <Badge variant="outline" className="text-[10px] bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                      Neaktívny
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-500 hover:text-red-600"
                  onClick={async () => {
                    if (!confirm(`Zmazať "${product.name}"?`)) return;
                    const res = await fetch(`/api/admin/merch/products/${product.id}`, { method: "DELETE" });
                    if (res.ok) { toast.success("Produkt zmazaný"); onDeleted(); }
                    else toast.error("Zmazanie zlyhalo");
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {product.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
            )}

            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Cena</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">{fmtPrice(product.price)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Sklad</div>
                <div className={`font-semibold ${lowStock ? "text-amber-600 dark:text-amber-400" : ""}`}>
                  {product.stock} ks
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Margin</div>
                <div className="font-semibold">{margin.toFixed(0)}%</div>
              </div>
            </div>

            {(product.sizes.length > 0 || product.colors.length > 0) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {product.sizes.map(s => (
                  <Badge key={s} variant="secondary" className="text-[9px] h-5">{s}</Badge>
                ))}
                {product.colors.map(c => (
                  <Badge key={c} variant="secondary" className="text-[9px] h-5">{c}</Badge>
                ))}
              </div>
            )}

            <div className="text-[10px] text-muted-foreground mt-2">
              {product.orderCount} objednávok · slug: {product.slug}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// ORDER ROW
// =====================================================

function OrderRow({ order, onDeleted }: { order: Order; onDeleted: () => void }) {
  return (
    <div className="p-3 hover:bg-muted/30 transition-colors flex items-center gap-3">
      <div className="text-2xl shrink-0">{CATEGORY_EMOJI[order.product?.category || "other"] || "📦"}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{order.product?.name || "Neznámy produkt"}</span>
          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[order.status] || ""}`}>
            {STATUS_LABELS[order.status] || order.status}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {order.type === "event" ? "🎵 Event" : order.type === "online" ? "🌐 Online" : "📦 " + order.type}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {order.quantity} × {fmtPrice(order.unitPrice)}
          {order.size && ` · veľkosť ${order.size}`}
          {order.color && ` · ${order.color}`}
          {order.buyerName && ` · ${order.buyerName}`}
          {order.paymentMethod && ` · ${order.paymentMethod}`}
          {" · "}{fmtRelative(order.createdAt)}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-bold text-emerald-600 dark:text-emerald-400">{fmtPrice(order.quantity * order.unitPrice)}</div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] text-red-500 hover:text-red-600 px-2"
          onClick={async () => {
            if (!confirm("Zmazať objednávku? Sklad sa automaticky doplní.")) return;
            const res = await fetch(`/api/admin/merch/orders/${order.id}`, { method: "DELETE" });
            if (res.ok) { toast.success("Objednávka zmazaná, sklad doplnený"); onDeleted(); }
            else toast.error("Zmazanie zlyhalo");
          }}
        >
          <Trash2 className="h-3 w-3" /> Zmazať
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// PRODUCT FORM DIALOG
// =====================================================

function ProductFormDialog({
  open, onOpenChange, product, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: Product | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("t-shirt");
  const [price, setPrice] = useState("15");
  const [costPrice, setCostPrice] = useState("7");
  const [stock, setStock] = useState("50");
  const [minStock, setMinStock] = useState("5");
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setCategory(product.category);
      setPrice(String(product.price));
      setCostPrice(String(product.costPrice));
      setStock(String(product.stock));
      setMinStock(String(product.minStock));
      setSizes(product.sizes.join(", "));
      setColors(product.colors.join(", "));
      setImageUrl(product.imageUrl || "");
      setActive(product.active);
    } else {
      setName(""); setDescription(""); setCategory("t-shirt");
      setPrice("15"); setCostPrice("7"); setStock("50"); setMinStock("5");
      setSizes("S, M, L, XL"); setColors(""); setImageUrl(""); setActive(true);
    }
  }, [product, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        name, description, category,
        price: parseFloat(price),
        costPrice: parseFloat(costPrice),
        stock: parseInt(stock, 10),
        minStock: parseInt(minStock, 10),
        sizes: sizes.split(",").map(s => s.trim()).filter(Boolean),
        colors: colors.split(",").map(s => s.trim()).filter(Boolean),
        imageUrl, active,
      };
      const url = product
        ? `/api/admin/merch/products/${product.id}`
        : "/api/admin/merch/products";
      const method = product ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Uloženie zlyhalo");
      }
      toast.success(product ? "Produkt aktualizovaný" : "Produkt vytvorený");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Upraviť produkt" : "Nový produkt"}</DialogTitle>
          <DialogDescription>
            {product ? `Upravuješ: ${product.name}` : "Pridaj nový merch produkt do ponuky"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Názov</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tričko D.O.R.A. Logo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Kategória</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{CATEGORY_EMOJI[v]} {l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Cena (€)</Label>
              <Input type="number" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-sm">Popis</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Krátky popis produktu..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Nákupná cena (€)</Label>
              <Input type="number" step="0.5" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm">Sklad (ks)</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Min. sklad (alert)</Label>
              <Input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm">Aktívny</Label>
              <Select value={active ? "true" : "false"} onValueChange={(v) => setActive(v === "true")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Áno, viditeľný</SelectItem>
                  <SelectItem value="false">Ne, skrytý</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm">Veľkosti ( čiarkou oddelené)</Label>
            <Input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S, M, L, XL" />
          </div>
          <div>
            <Label className="text-sm">Farby (čiarkou oddelené)</Label>
            <Input value={colors} onChange={(e) => setColors(e.target.value)} placeholder="čierna, biela" />
          </div>
          <div>
            <Label className="text-sm">URL obrázku</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="/merch/tricko-dora.jpg" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušiť</Button>
          <Button onClick={handleSave} disabled={saving || !name}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            {product ? "Uložiť zmeny" : "Vytvoriť produkt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// ORDER FORM DIALOG
// =====================================================

function OrderFormDialog({
  open, onOpenChange, products, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  products: Product[];
  onSaved: () => void;
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [type, setType] = useState("event");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setProductId(products[0]?.id || "");
      setQuantity("1"); setType("event"); setSize(""); setColor("");
      setBuyerName(""); setBuyerEmail(""); setPaymentMethod("cash"); setNotes("");
    }
  }, [open, products]);

  const selectedProduct = products.find(p => p.id === productId);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        productId,
        quantity: parseInt(quantity, 10),
        type,
        size: size || undefined,
        color: color || undefined,
        buyerName: buyerName || undefined,
        buyerEmail: buyerEmail || undefined,
        paymentMethod,
        notes: notes || undefined,
        unitPrice: selectedProduct?.price,
      };
      const res = await fetch("/api/admin/merch/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Vytvorenie zlyhalo");
      }
      toast.success("Objednávka vytvorená, sklad aktualizovaný");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nová objednávka / predaj</DialogTitle>
          <DialogDescription>Záznam predaja — sklad sa automaticky zníži</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Produkt</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Vyber produkt" /></SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {CATEGORY_EMOJI[p.category] || "📦"} {p.name} — {fmtPrice(p.price)} ({p.stock} ks)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Množstvo</Label>
              <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm">Typ</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">🎵 Event predaj</SelectItem>
                  <SelectItem value="online">🌐 Online objednávka</SelectItem>
                  <SelectItem value="wholesale">📦 Veľkoobchod</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedProduct && selectedProduct.sizes.length > 0 && (
            <div>
              <Label className="text-sm">Veľkosť</Label>
              <Select value={size || "__none__"} onValueChange={(v) => setSize(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {selectedProduct.sizes.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {selectedProduct && selectedProduct.colors.length > 0 && (
            <div>
              <Label className="text-sm">Farba</Label>
              <Select value={color || "__none__"} onValueChange={(v) => setColor(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {selectedProduct.colors.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {type !== "event" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Meno kupujúceho</Label>
                  <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Email</Label>
                  <Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
                </div>
              </div>
            </>
          )}
          <div>
            <Label className="text-sm">Spôsob platby</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 Hotovosť</SelectItem>
                <SelectItem value="card">💳 Karta</SelectItem>
                <SelectItem value="online">🌐 Online</SelectItem>
                <SelectItem value="transfer">🏦 Prevod</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Poznámky</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          {selectedProduct && (
            <div className="p-3 rounded-md bg-muted/50 text-sm flex justify-between">
              <span className="text-muted-foreground">Celkom:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">
                {fmtPrice(parseInt(quantity || "0", 10) * selectedProduct.price)}
              </strong>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušiť</Button>
          <Button onClick={handleSave} disabled={saving || !productId}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            Vytvoriť objednávku
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// HELPERS
// =====================================================

function KpiCard({
  title, value, subtitle, icon, accent,
}: {
  title: string; value: string; subtitle: string;
  icon: React.ReactNode; accent: "emerald" | "sky" | "amber" | "violet";
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40",
    sky: "text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-950/40",
    amber: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40",
    violet: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/40",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`p-2 rounded-lg ${colors[accent]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function CheckIcon() {
  return <span className="text-emerald-500">✓</span>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-96" />
    </div>
  );
}
