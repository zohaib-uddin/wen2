import React, { useState, useEffect } from "react";
import { useShop } from "../context/ShopContext";
import { useAuth } from "@clerk/clerk-react";
import { Product } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  AdminOrder,
  AdminMessage
} from "../lib/mockData";
import { generateAdminWhatsAppLink } from "../lib/utils/whatsapp";
import { supabase } from "../lib/supabase/client";
import { Sidebar } from "../components/admin/Sidebar";
import { AdminHeader } from "../components/admin/AdminHeader";
import { StatCard } from "../components/shared/StatCard";
import { StatusBadge } from "../components/shared/StatusBadge";
import { ImageUploader } from "../components/shared/ImageUploader";
import { DataTable } from "../components/shared/DataTable";
import { Switch } from "../components/shared/Switch";
import { Pagination } from "../components/shared/Pagination";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { 
  Plus, Search, Edit2, Trash2, Printer, PhoneCall, Mail, Eye,
  CheckCheck, Settings2, Sparkles, Filter, CheckCircle2, 
  ChevronRight, ArrowLeft, RefreshCw, Layers, Sliders, Truck 
} from "lucide-react";

import { ConfirmModal } from "../components/shared/ConfirmModal";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export const AdminPage: React.FC = () => {
  const { products, setProducts, user, profile, authLoading, navigate, triggerToast, updateProfile, getClient } = useShop();
  const { getToken } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSectionState] = useState(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin/')) {
      return path.split('/')[2] || "dashboard";
    }
    return "dashboard";
  });

  const setActiveSection = (section: string) => {
    setActiveSectionState(section);
    const newPath = `/admin/${section === 'dashboard' ? '' : section}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin/')) {
        const section = path.split('/')[2] || "dashboard";
        setActiveSectionState(section);
      } else if (path === '/admin') {
        setActiveSectionState("dashboard");
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [graphType, setGraphType] = useState<"revenue" | "orders">("revenue");
  const [timeRange, setTimeRange] = useState<"today" | "yesterday" | "7days" | "14days" | "1month" | "3months">("7days");
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{ id?: string; name: string; type: "skin" | "hair" } | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadInvoicePDF = async (elementId: string, orderId: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      triggerToast("Invoice capture element not found.", undefined, undefined, "error");
      return;
    }

    setIsExporting(true);
    triggerToast("Generating your high-quality PDF invoice...");

    try {
      // Temporarily expand the element to its full scroll height
      const originalOverflow = element.style.overflow;
      const originalHeight = element.style.height;
      const originalMaxHeight = element.style.maxHeight;

      element.style.overflow = 'visible';
      element.style.height = 'max-content';
      element.style.maxHeight = 'none';

      // Temporarily hide action/print-suppressed elements
      const actions = element.querySelectorAll(".invoice-no-print");
      actions.forEach(act => {
        (act as HTMLElement).style.display = "none";
      });

      await new Promise(resolve => setTimeout(resolve, 300));

      const imgData = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          overflow: 'visible',
          height: 'max-content',
          maxHeight: 'none'
        }
      });

      // Restore elements visibility and styles
      actions.forEach(act => {
        (act as HTMLElement).style.display = "";
      });
      element.style.overflow = originalOverflow;
      element.style.height = originalHeight;
      element.style.maxHeight = originalMaxHeight;

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // We need aspect ratio
      const imgProps = pdf.getImageProperties(imgData);
      const canvasWidth = imgProps.width;
      const canvasHeight = imgProps.height;

      const margin = 12; // margins in mm
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (canvasHeight * contentWidth) / canvasWidth;

      let heightLeft = contentHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - (margin * 2));

      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - contentHeight + margin;
        pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - (margin * 2));
      }

      pdf.save(`WEN-Invoice-${orderId}.pdf`);
      triggerToast("Invoice PDF downloaded successfully!");
    } catch (err: any) {
      console.error("PDF generation failure:", err);
      triggerToast("Could not generate PDF invoice: " + err.message, undefined, undefined, "error");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('admin-sign-in');
      } else if (profile && profile.role !== 'admin') {
        navigate('admin-sign-in');
      }
    }
  }, [user, profile, authLoading]);



  // Local States for Managing Admin entities with persistence support
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [replyingMessage, setReplyingMessage] = useState<AdminMessage | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productTargets, setProductTargets] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [productTargetsLoading, setProductTargetsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Coupon States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [isEditingCoupon, setIsEditingCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  // Product Add/Edit Overlay States
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isMultiSizeMode, setIsMultiSizeMode] = useState(false);

  const handleAddCategory = async (name: string) => {
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-clerk-id": user?.id || ""
        },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCategories(prev => [...prev, data.category]);
        if (editingProduct) {
          setEditingProduct(prev => prev ? { ...prev, category: data.category.name } : null);
        }
        triggerToast("Category added successfully!");
      } else {
        alert(data.error || "Failed to add category.");
      }
    } catch (err) {
      console.error("Error creating category:", err);
      alert("Error adding category.");
    }
  };

  const handleAddProductTarget = async (name: string, type: "skin" | "hair") => {
    try {
      const response = await fetch("/api/admin/product-targets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-clerk-id": user?.id || ""
        },
        body: JSON.stringify({ name, type })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProductTargets(prev => [...prev, data.target]);
        const currentConcerns = editingProduct?.concern ? editingProduct.concern.split(", ").filter(Boolean) : [];
        if (!currentConcerns.includes(data.target.name)) {
          const updated = [...currentConcerns, data.target.name].join(", ");
          setEditingProduct(prev => prev ? { ...prev, concern: updated } : null);
        }
        triggerToast("Target concern added successfully!");
      } else {
        alert(data.error || "Failed to add target concern.");
      }
    } catch (err) {
      console.error("Error creating product target:", err);
      alert("Error adding product target.");
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Invoice display overlay state
  const [invoiceOrder, setInvoiceOrder] = useState<AdminOrder | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<AdminOrder | null>(null);

  // Dynamic chart data calculations based on Graph Type & Time Range filter
  const analyticsChartData = React.useMemo(() => {
    const data: { name: string; value: number }[] = [];
    const now = new Date();
    let numDays = 7;

    if (timeRange === "today") numDays = 1;
    else if (timeRange === "yesterday") numDays = 2;
    else if (timeRange === "14days") numDays = 14;
    else if (timeRange === "1month") numDays = 30;
    else if (timeRange === "3months") numDays = 90;

    const datesList: Date[] = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      datesList.push(d);
    }

    let finalDates = datesList;
    if (timeRange === "yesterday") {
      const yest = new Date();
      yest.setDate(now.getDate() - 1);
      finalDates = [yest];
    } else if (timeRange === "today") {
      finalDates = [now];
    }

    finalDates.forEach(date => {
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      let totalValue = 0;

      orders.forEach(order => {
        const orderDate = new Date(order.date);
        if (!isNaN(orderDate.getTime())) {
          const orderLabel = orderDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (orderLabel === label) {
            if (graphType === "revenue") {
              if (order.status === "Delivered") {
                totalValue += order.totalPrice;
              }
            } else {
              // Count orders (all statuses)
              totalValue += 1;
            }
          }
        }
      });

      data.push({
        name: label,
        value: totalValue
      });
    });

    return data;
  }, [orders, graphType, timeRange]);

  // Fetch Live analytics and records from Supabase REST APIs
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          "x-clerk-id": user?.id || ""
        };

        // 1. Fetch live messages from REST API
        const messagesRes = await fetch("/api/admin/messages", { headers });
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          if (messagesData.success && messagesData.messages) {
            const mappedMsgs: AdminMessage[] = messagesData.messages.map((m: any) => ({
              id: m.id,
              name: m.name,
              email: m.email,
              phone: m.phone || "N/A",
              subject: m.subject || "Product Query",
              message: m.message,
              date: new Date(m.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
              isRead: m.is_read
            }));
            setMessages(mappedMsgs);
          } else {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }

        // 2. Fetch live orders with full-stack Express REST API
        const ordersRes = await fetch("/api/admin/orders", { headers });
        let mappedOrders: AdminOrder[] = [];
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (ordersData.success && ordersData.orders) {
            mappedOrders = ordersData.orders;
          }
        } else {
          console.warn("Failed to fetch admin orders via REST API");
        }

        const manualOrders = savedList.filter(mo => !mappedOrders.some(mo2 => mo2.orderId === mo.orderId));
        const combinedOrders = [...mappedOrders, ...manualOrders];
        combinedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOrders(combinedOrders);

        // 3. Fetch registered customer profiles with full-stack Express REST API
        const customersRes = await fetch("/api/admin/customers", { headers });
        if (customersRes.ok) {
          const custData = await customersRes.json();
          if (custData.success && custData.customers) {
            setCustomers(custData.customers);
          }
        } else {
          console.warn("Failed to fetch admin customers via REST API");
          setCustomers([]);
        }
        setCustomersLoading(false);

        // 4. Fetch shop categories with full-stack Express REST API
        const categoriesRes = await fetch("/api/admin/categories", { headers });
        if (categoriesRes.ok) {
          const catData = await categoriesRes.json();
          if (catData.success && catData.categories) {
            setCategories(catData.categories);
          }
        } else {
          console.warn("Failed to fetch admin categories via REST API");
          setCategories([]);
        }
        setCategoriesLoading(false);

        // 5. Fetch coupons with full-stack Express REST API
        const couponsRes = await fetch("/api/admin/coupons", { headers });
        if (couponsRes.ok) {
          const coupData = await couponsRes.json();
          if (coupData.success && coupData.coupons) {
            setCoupons(coupData.coupons);
          }
        } else {
          console.warn("Failed to fetch admin coupons via REST API");
          setCoupons([]);
        }
        setCouponsLoading(false);

        // 6. Fetch product targets
        const targetsRes = await fetch("/api/admin/product-targets");
        if (targetsRes.ok) {
          const tarData = await targetsRes.json();
          if (tarData.success && tarData.targets) {
            setProductTargets(tarData.targets);
          }
        } else {
          console.warn("Failed to fetch product targets");
          setProductTargets([]);
        }
        setProductTargetsLoading(false);

      } catch (err) {
        console.warn("Could not load fresh live analytics from Supabase REST APIs.", err);
        setCustomersLoading(false);
        setCategoriesLoading(false);
        setCouponsLoading(false);
        setProductTargetsLoading(false);
      }
    };

    const savedTrackerRaw = localStorage.getItem("wen_order_tracking_db");
    const savedList: AdminOrder[] = savedTrackerRaw ? Object.values(JSON.parse(savedTrackerRaw)) : [];

    if (user?.id) {
      fetchAdminData();
    }
  }, [products, user?.id]);

  // Sync orders change to local DB and Supabase via REST API
  const updateOrderInDb = async (orderId: string, updatedFields: Partial<AdminOrder>) => {
    const nextOrders = orders.map(o => o.orderId === orderId ? { ...o, ...updatedFields } : o);
    setOrders(nextOrders as any);

    const savedTrackerRaw = localStorage.getItem("wen_order_tracking_db");
    const trackerDb = savedTrackerRaw ? JSON.parse(savedTrackerRaw) : {};
    
    if (trackerDb[orderId]) {
      trackerDb[orderId] = { ...trackerDb[orderId], ...updatedFields };
      try {
        localStorage.setItem("wen_order_tracking_db", JSON.stringify(trackerDb));
      } catch (e) {
        console.warn("Could not save tracking DB", e);
      }
    }

    try {
      if (updatedFields.status || updatedFields.paymentStatus !== undefined) {
        await fetch(`/api/admin/orders/${orderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-clerk-id": user?.id || ""
          },
          body: JSON.stringify({ 
            status: updatedFields.status,
            payment_status: updatedFields.paymentStatus 
          })
        });
      }
    } catch (e) {
      console.warn("Could not save order update to Supabase REST API.", e);
    }
  };

  const deleteOrder = async (orderId: string) => {
    showConfirm(
      "Cancel and Delete Order",
      `Are you sure you wish to cancel and delete order ${orderId}?`,
      async () => {
        setOrders(orders.filter(o => o.orderId !== orderId));
        
        const savedTrackerRaw = localStorage.getItem("wen_order_tracking_db");
        if (savedTrackerRaw) {
          const trackerDb = JSON.parse(savedTrackerRaw);
          if (trackerDb[orderId]) {
            delete trackerDb[orderId];
            try {
              localStorage.setItem("wen_order_tracking_db", JSON.stringify(trackerDb));
            } catch (e) {
              console.warn("Could not save tracking DB", e);
            }
          }
        }

        try {
          await fetch(`/api/admin/orders/${orderId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "x-clerk-id": user?.id || ""
            }
          });
        } catch (e) {
          console.warn("Could not delete order from Supabase REST API.", e);
        }
      }
    );
  };

  const handleToggleProductBestSeller = async (prodId: string, value: boolean) => {
    setProducts(prev => prev.map(p => p.id === prodId ? { ...p, isBestSeller: value } : p));
    try {
      const client = await getClient();
      const { error } = await client
        .from("products")
        .update({ is_bestseller: value })
        .eq("id", prodId);
        
      if (error) {
        console.error("Supabase Error toggling best seller:", error.message, error.details);
      } else {
        console.log("Successfully toggled best seller on Supabase for:", prodId);
      }
    } catch (e) {
      console.warn("Error toggling best seller on Supabase.", e);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    showConfirm(
      "Delete Formulation",
      "Are you sure you wish to delete this secret formulation from the database?",
      async () => {
        setProducts(prev => prev.filter(p => p.id !== prodId));
        try {
          const response = await fetch(`/api/admin/products/${prodId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "x-clerk-id": user?.id || ""
            }
          });
          
          if (!response.ok) {
            const errData = await response.json();
            console.error("Error deleting product from DB:", errData.error);
            triggerToast(`Error deleting formulation: ${errData.error || response.statusText}`);
          } else {
            console.log("Successfully deleted product from Supabase via backend API:", prodId);
            triggerToast("Product deleted successfully");
          }
        } catch (e: any) {
          console.warn("Error deleting product from Supabase.", e);
        }
      }
    );
  };

  const handleStartAddProduct = () => {
    setEditingProduct({
      id: `wen-${Date.now()}`,
      name: "",
      category: "Select a Category",
      price: 0,
      originalPrice: 0,
      rating: 5.0,
      reviewCount: 0,
      description: "",
      keyBenefits: [],
      potencyExplanation: "",
      idealFor: [],
      howToUse: "",
      ingredients: "",
      concern: "",
      variants: [],
      selectedVariant: "",
      isBestSeller: false,
      isNewArrival: true,
      reviewsList: []
    });
    setIsMultiSizeMode(false);
    setIsEditingProduct(true);
  };

  const handleStartEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsMultiSizeMode(!!(prod.variants && prod.variants.length > 0));
    setIsEditingProduct(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.id || !editingProduct.name) return;

    const completeProduct = editingProduct as Product;

    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === completeProduct.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = completeProduct;
        return next;
      } else {
        return [...prev, completeProduct];
      }
    });

    try {
      const client = await getClient();
      const { data: catData } = await client
        .from("categories")
        .select("id")
        .eq("name", completeProduct.category)
        .maybeSingle();

      const categoryId = catData?.id || null;

      const generatedSlug = completeProduct.name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      const hasVariants = isMultiSizeMode;
      const dbProductFields = {
        name: completeProduct.name,
        slug: generatedSlug,
        price: hasVariants ? null : Number(completeProduct.price),
        compare_price: hasVariants ? null : (completeProduct.originalPrice ? Number(completeProduct.originalPrice) : null),
        description: completeProduct.description || "",
        short_description: completeProduct.potencyExplanation || "",
        concern: completeProduct.concern || null,
        images: [completeProduct.image],
        category_id: categoryId,
        is_bestseller: completeProduct.isBestSeller || false,
        is_featured: completeProduct.isNewArrival || false,
        benefits: completeProduct.keyBenefits || [],
        ingredients: [completeProduct.ingredients || ""],
        how_to_use: completeProduct.howToUse || "",
        stock_quantity: hasVariants ? null : (completeProduct.stock_quantity !== undefined ? Number(completeProduct.stock_quantity) : 100),
        rating: completeProduct.rating !== undefined ? Number(completeProduct.rating) : 4.5,
        reviews_count: completeProduct.reviews_count !== undefined ? Number(completeProduct.reviews_count) : 10,
        size: hasVariants ? null : (completeProduct.size || "100ml"),
        gallery_images: completeProduct.gallery_images || [],
        has_variants: hasVariants ? true : false,
      };

      const finalId = completeProduct.id;
      const isNew = finalId.startsWith("wen-");
      let actualProductId = finalId;

      if (!isNew) {
        const { error } = await client
          .from("products")
          .update(dbProductFields)
          .eq("id", finalId);

        if (error) {
          console.error("Supabase Error updating product details:", error.message, error.details);
          alert(`Supabase Error: ${error.message}\nMake sure your public RLS policies allow authenticated/anonymous writes to the products table.`);
          return;
        } else {
          console.log("Successfully updated product in Supabase catalog:", finalId);
        }
      } else {
        const { error, data } = await client
          .from("products")
          .insert(dbProductFields)
          .select()
          .maybeSingle();

        if (error) {
          console.error("Supabase Error inserting new product:", error.message, error.details);
          alert(`Supabase Error: ${error.message}\nMake sure your public RLS policies allow authenticated/anonymous writes to the products table.`);
          return;
        } else if (data) {
          console.log("Successfully inserted product in Supabase catalog:", data);
          actualProductId = data.id;
          // Sync state with the actual newly assigned product UUID from the database
          setProducts(prev => prev.map(p => p.id === completeProduct.id ? { ...p, id: data.id } : p));
        }
      }

      // Handle Product Variants Save
      if (dbProductFields.has_variants && completeProduct.variants && completeProduct.variants.length > 0) {
        // Remove existing variants
        await client.from("product_variants").delete().eq("product_id", actualProductId);
        
        // Insert new ones
        const variantInserts = completeProduct.variants.map((v: any) => ({
          product_id: actualProductId,
          size: v.size || "Default Size",
          price: isNaN(Number(v.price)) ? 0 : Number(v.price),
          compare_price: v.compare_price && !isNaN(Number(v.compare_price)) ? Number(v.compare_price) : null,
          stock_quantity: v.stock_quantity && !isNaN(Number(v.stock_quantity)) ? Number(v.stock_quantity) : 0,
        }));
        
        const { error: varError } = await client.from("product_variants").insert(variantInserts);
        if (varError) console.error("Error saving variants:", varError);
      } else {
        // Clean up variants if turned off
        await client.from("product_variants").delete().eq("product_id", actualProductId);
      }
    } catch (err) {
      console.warn("Could not persist product to Supabase.", err);
    }

    setIsEditingProduct(false);
    setEditingProduct(null);
  };

  const toggleMessageRead = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRead: !m.isRead } : m));
  };

  const handleDeleteMessage = async (msgId: string) => {
    showConfirm(
      "Delete Inquiry Message",
      "Are you sure you wish to delete this inquiry message?",
      async () => {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        try {
          const token = await getToken();
          const res = await fetch(`/api/admin/messages/${msgId}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,
              "x-clerk-id": user?.id || ""
            }
          });
            
          if (!res.ok) {
            triggerToast(`Error deleting message`);
          } else {
            console.log("Successfully deleted message:", msgId);
            triggerToast("Inquiry deleted successfully");
          }
        } catch (e: any) {
          console.warn("Error deleting message.", e);
        }
      }
    );
  };

  // Safe WhatsApp Direct API response setup for Pakistani regional cells
  const handleOpenReply = (msg: AdminMessage) => {
    setReplyingMessage(msg);
    setReplyContent("");
  };

  const handleSendReply = async () => {
    if (!replyingMessage || !replyContent.trim()) {
      triggerToast("Please enter a reply message.", undefined, undefined, "error");
      return;
    }

    setIsSendingReply(true);
    try {
      const response = await fetch("/api/admin/reply-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-clerk-id": user?.id || ""
        },
        body: JSON.stringify({
          messageId: replyingMessage.id,
          name: replyingMessage.name,
          email: replyingMessage.email,
          subject: replyingMessage.subject,
          originalMessage: replyingMessage.message,
          date: replyingMessage.date,
          replyContent: replyContent
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send reply");
      }

      triggerToast("Reply dispatched successfully to user via Email");
      
      // Mark as read locally if success
      setMessages(prev => prev.map(m => m.id === replyingMessage.id ? { ...m, isRead: true } : m));
      
      setReplyingMessage(null);
      setReplyContent("");
    } catch (err: any) {
      console.error("Reply error:", err);
      triggerToast(err.message || "Failed to dispatch reply.", undefined, undefined, "error");
    } finally {
      setIsSendingReply(false);
    }
  };

  // Category CRUD states
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const handleStartAddCategory = () => {
    setEditingCategory({
      name: "",
      slug: "",
      image_url: "",
      descriptionText: "",
      target_concern: ""
    });
    setIsEditingCategory(true);
  };

  const handleStartEditCategory = (cat: any) => {
    const desc = cat.description || "";
    const parts = desc.split("||");
    const descText = parts[0] || "";
    const targetConcern = parts[1] || "";
    setEditingCategory({
      ...cat,
      descriptionText: descText || desc,
      target_concern: targetConcern
    });
    setIsEditingCategory(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name) return;

    // Generate slug if none provided
    const slug = editingCategory.slug || editingCategory.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const dbCategoryFields = {
      name: editingCategory.name,
      slug: slug,
      display_order: editingCategory.display_order || 1
    };

    try {
      const headers = {
        "Content-Type": "application/json",
        "x-clerk-id": user?.id || ""
      };

      if (editingCategory.id) {
        // Update existing category via API
        const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(dbCategoryFields)
        });

        if (!response.ok) {
          const errData = await response.json();
          alert(`Error updating category: ${errData.error || response.statusText}`);
        } else {
          const resData = await response.json();
          setCategories(prev => prev.map(c => c.id === editingCategory.id ? resData.category : c));
          triggerToast("Category updated successfully");
        }
      } else {
        // Insert new category via API
        const response = await fetch("/api/admin/categories", {
          method: "POST",
          headers,
          body: JSON.stringify(dbCategoryFields)
        });

        if (!response.ok) {
          const errData = await response.json();
          alert(`Error creating category: ${errData.error || response.statusText}`);
        } else {
          const resData = await response.json();
          setCategories(prev => [...prev, resData.category]);
          triggerToast("New category registered successfully");
        }
      }
    } catch (err: any) {
      console.warn("Could not save category to Supabase REST API:", err);
      alert(`Network error: ${err.message}`);
    }

    setIsEditingCategory(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (catId: string) => {
    showConfirm(
      "Delete Category",
      "Are you sure you wish to delete this category? Active products in this category will not be deleted but will have their category reference cleared.",
      async () => {
        try {
          const response = await fetch(`/api/admin/categories/${catId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "x-clerk-id": user?.id || ""
            }
          });

          if (!response.ok) {
            const errData = await response.json();
            triggerToast(`Error deleting category: ${errData.error || response.statusText}`);
          } else {
            setCategories(prev => prev.filter(c => c.id !== catId));
            triggerToast("Category deleted successfully");
          }
        } catch (err: any) {
          console.warn("Could not delete category from Supabase REST API:", err);
          triggerToast(`Network error: ${err.message}`);
        }
      }
    );
  };

  const handleDeleteProductTarget = async (targetId: string) => {
    showConfirm(
      "Delete Target Concern",
      "Are you sure you wish to delete this Target Concern?",
      async () => {
        try {
          const response = await fetch(`/api/admin/product-targets/${targetId}`, {
            method: "DELETE",
            headers: {
              "x-clerk-id": user?.id || ""
            }
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setProductTargets(prev => prev.filter(t => t.id !== targetId));
            triggerToast("Target concern deleted successfully!");
          } else {
            triggerToast(data.error || "Failed to delete target concern.");
          }
        } catch (err: any) {
          console.error("Error deleting product target:", err);
          triggerToast("Error deleting product target.");
        }
      }
    );
  };

  const handleSaveProductTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;

    try {
      const isEdit = !!editingTarget.id;
      const url = isEdit 
        ? `/api/admin/product-targets/${editingTarget.id}` 
        : "/api/admin/product-targets";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-clerk-id": user?.id || ""
        },
        body: JSON.stringify({ name: editingTarget.name, type: editingTarget.type })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        if (isEdit) {
          setProductTargets(prev => prev.map(t => t.id === editingTarget.id ? data.target : t));
          triggerToast("Target concern updated successfully!");
        } else {
          setProductTargets(prev => [...prev, data.target]);
          triggerToast("Target concern created successfully!");
        }
        setIsEditingTarget(false);
        setEditingTarget(null);
      } else {
        alert(data.error || "Failed to save target concern");
      }
    } catch (err: any) {
      console.warn("Could not save target concern:", err);
      alert(`Network error: ${err.message}`);
    }
  };

  // Profile update form states (simplified)
  const [profileName, setProfileName] = useState(profile?.full_name || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Sync profile values when profile state loads
  useEffect(() => {
    if (profile) {
      setProfileName(profile.full_name || "");
    }
  }, [profile]);

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await updateProfile({
        fullName: profileName
      });
      if (res.success) {
        triggerToast("Administrative profile updated successfully");
      } else {
        triggerToast("Failed to update profile: " + res.error);
      }
    } catch (err: any) {
      triggerToast("Error updating profile: " + err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  // Coupon CRUD Handlers
  const handleStartAddCoupon = () => {
    setEditingCoupon({
      code: "",
      discount_percentage: 10,
      is_active: true,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsEditingCoupon(true);
  };

  const handleStartEditCoupon = (coupon: any) => {
    const startDateFormatted = coupon.start_date ? new Date(coupon.start_date).toISOString().split('T')[0] : "";
    const endDateFormatted = coupon.end_date ? new Date(coupon.end_date).toISOString().split('T')[0] : "";
    
    setEditingCoupon({
      ...coupon,
      start_date: startDateFormatted,
      end_date: endDateFormatted
    });
    setIsEditingCoupon(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon || !editingCoupon.code || !editingCoupon.discount_percentage) return;

    const codeUpper = editingCoupon.code.trim().toUpperCase();
    const dbCouponFields = {
      code: codeUpper,
      discount_percentage: Number(editingCoupon.discount_percentage),
      is_active: editingCoupon.is_active,
      start_date: editingCoupon.start_date ? new Date(editingCoupon.start_date).toISOString() : null,
      end_date: editingCoupon.end_date ? new Date(editingCoupon.end_date).toISOString() : null,
    };

    try {
      const headers = {
        "Content-Type": "application/json",
        "x-clerk-id": user?.id || ""
      };

      if (editingCoupon.id) {
        // Update existing coupon via API
        const response = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(dbCouponFields)
        });

        if (!response.ok) {
          const errData = await response.json();
          alert(`Error updating coupon: ${errData.error || response.statusText}`);
        } else {
          const resData = await response.json();
          setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? resData.coupon : c));
          triggerToast("Coupon code updated successfully");
        }
      } else {
        // Insert new coupon via API
        const response = await fetch("/api/admin/coupons", {
          method: "POST",
          headers,
          body: JSON.stringify(dbCouponFields)
        });

        if (!response.ok) {
          const errData = await response.json();
          alert(`Error creating coupon: ${errData.error || response.statusText}`);
        } else {
          const resData = await response.json();
          setCoupons(prev => [resData.coupon, ...prev]);
          triggerToast("New coupon registered successfully");
        }
      }
    } catch (err: any) {
      console.warn("Could not save coupon to Supabase REST API:", err);
      alert(`Network error: ${err.message}`);
    }

    setIsEditingCoupon(false);
    setEditingCoupon(null);
  };

  const handleDeleteCoupon = async (couponId: string) => {
    showConfirm(
      "Delete Coupon",
      "Are you sure you wish to delete this coupon? Users will no longer be able to use it.",
      async () => {
        try {
          const response = await fetch(`/api/admin/coupons/${couponId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "x-clerk-id": user?.id || ""
            }
          });

          if (!response.ok) {
            const errData = await response.json();
            triggerToast(`Error deleting coupon: ${errData.error || response.statusText}`);
          } else {
            setCoupons(prev => prev.filter(c => c.id !== couponId));
            triggerToast("Coupon deleted successfully");
          }
        } catch (err: any) {
          console.warn("Could not delete coupon from Supabase REST API:", err);
          triggerToast(`Network error: ${err.message}`);
        }
      }
    );
  };

  // Dynamic filter lists calculation
  const filteredProducts = products.filter(p => 
    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (o.orderId || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (o.phone || "").includes(searchQuery);
    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleNotificationClick = (notif: any) => {
    if (notif.type === "new_order" && notif.data?.order_number) {
      setActiveSection("orders");
      const orderToSelect = orders.find(o => o.orderId === notif.data.order_number);
      if (orderToSelect) {
        setSelectedOrderDetail(orderToSelect);
      } else {
        triggerToast("Order details are still loading...", undefined, undefined, "info");
      }
    } else if (notif.type === "new_message") {
      setActiveSection("messages");
    } else if (notif.type === "new_customer" || notif.type === "new_user") {
      setActiveSection("customers");
    } else if (notif.type === "low_stock") {
      setActiveSection("products");
    }
  };

  if (authLoading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-[#F7F2EA] flex items-center justify-center">
        <div className="text-[#1F4D3A] font-playfair font-bold text-xl uppercase tracking-widest animate-pulse">
          Authenticating Admin Sanctuary...
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F7F2EA] flex items-center justify-center p-8 text-center">
        <div className="max-w-md bg-white border border-[#E8E1D3] p-8 rounded-2xl">
          <h2 className="font-playfair text-2xl font-bold text-rose-700 mb-2">ACCESS RESTRICTED</h2>
          <p className="text-xs text-gray-550 font-sans leading-relaxed mb-6">
            This premium administrative panel requires verified cryptographic security keys. Redirecting to Admin Sanctuary...
          </p>
          <button
            onClick={() => navigate('admin-sign-in')}
            className="px-5 py-3 bg-[#1F4D3A] hover:bg-[#153427] text-white text-[10px] font-bold tracking-widest uppercase rounded-xl"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col lg:flex-row text-left font-sans text-[#2C2C2C]">
      {/* Sidebar collapsible drawer panel */}
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={(sec) => { setActiveSection(sec); setSearchQuery(""); }} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
      />

      {/* Main administrative viewport column */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          title={activeSection === "dashboard" ? "Admin Control Room" : `${activeSection} Management`} 
          onNotificationClick={handleNotificationClick}
        />

        {/* Dashboard Panels Router Body */}
        <main className="flex-grow p-6 sm:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-8">
          
          {/* A. WORKSPACE VIEWPORT OVERLAY: ADD / EDIT PRODUCT */}
          {isEditingProduct && editingProduct ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#E8E1D3] rounded-3xl p-6 sm:p-10 space-y-8"
            >
              <div className="flex items-center gap-3.5 pb-5 border-b border-[#e5e5e5] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingProduct(false)}
                  className="p-2.5 hover:bg-gray-150 border border-gray-150 text-[#757575] rounded-xl cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4.5 h-4.5 text-[#1F4D3A]" />
                </button>
                <div>
                  <span className="text-[9px] font-mono tracking-[0.22em] text-[#C9A227] uppercase font-bold">Secret Apothecary Registry</span>
                  <h3 className="font-playfair text-2xl font-bold text-[#1F4D3A] tracking-wider uppercase">
                    {editingProduct.id && products.some(p => p.id === editingProduct.id) ? "Update Product" : "Add New Product"}
                  </h3>
                </div>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-8">
                {/* Visual image box */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <ImageUploader 
                      defaultImage={editingProduct.image || ""}
                      onImageSelected={(base64) => setEditingProduct({ ...editingProduct, image: base64 })}
                    />

                    {/* Gallery Images Section */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4.5 space-y-4 text-left">
                      <div className="flex items-center justify-between">
                        <span className="block text-xs font-bold uppercase tracking-wider text-[#1F4D3A] font-sans">
                          Gallery Images
                        </span>
                        <span className="text-[9px] text-[#C9A227] font-bold uppercase">
                          {(editingProduct.gallery_images || []).length} Loaded
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {/* List current gallery images */}
                        {(editingProduct.gallery_images || []).map((imgUrl, idx) => (
                          <div key={idx} className="relative aspect-square border border-stone-200 rounded-xl overflow-hidden group shadow-2xs">
                            <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (editingProduct.gallery_images || []).filter((_, i) => i !== idx);
                                  setEditingProduct({ ...editingProduct, gallery_images: updated });
                                }}
                                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-transform hover:scale-110 cursor-pointer"
                                title="Remove Image"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Interactive File Selector Card */}
                        <label className="border-2 border-dashed border-[#E8E1D3] hover:border-[#C9A227] aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-white text-[#C9A227] hover:bg-[#1F4D3A]/5 shadow-2xs">
                          <Plus className="w-5 h-5" />
                          <span className="text-[8px] font-bold mt-1 uppercase tracking-widest text-[#1F4D3A]">Add Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const base64 = reader.result as string;
                                  const currentGallery = editingProduct.gallery_images || [];
                                  setEditingProduct({
                                    ...editingProduct,
                                    gallery_images: [...currentGallery, base64]
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[9px] text-[#757575] font-light leading-normal">
                        Click "Add Image" to select a photo file from your device. Hover over any thumbnail to delete.
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-1.5 flex flex-col">
                      <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Formula Identifier (ID)</label>
                      <input 
                        type="text" 
                        value={editingProduct.id || ""}
                        disabled
                        className="w-full bg-[#f5f5f5] border border-[#e5e5e5] text-[#757575] px-4 py-3 rounded-xl outline-none" 
                      />
                    </div>

                    <div className="space-y-1.5 flex flex-col">
                      <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Formulation Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Saffron Infused Recovery Oil"
                        value={editingProduct.name || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        required
                        className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none" 
                      />
                    </div>

                     <div className="space-y-1.5 flex flex-col">
                      <label className="font-bold text-[#1F4D3A] uppercase tracking-wider flex justify-between items-center">
                        <span>Category</span>
                        <button
                          type="button"
                          onClick={() => {
                            const name = prompt("Enter new formulation category name:");
                            if (name && name.trim()) {
                              handleAddCategory(name.trim());
                            }
                          }}
                          className="text-[10px] text-[#C9A227] hover:text-[#1F4D3A] transition font-bold uppercase tracking-wider cursor-pointer"
                        >
                          + Add New Category
                        </button>
                      </label>
                      <select 
                        value={editingProduct.category || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none"
                      >
                        <option value="">Select a Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 flex flex-col">
                      <label className="font-bold text-[#1F4D3A] uppercase tracking-wider flex justify-between items-center">
                        <span>Target Concerns</span>
                        <button
                          type="button"
                          onClick={() => {
                            const name = prompt("Enter target concern (e.g. Fine Lines, Hair Fall):");
                            if (name && name.trim()) {
                              const type = confirm("Is this concern for Hair Care? (Click Cancel for Skin Care)") ? "hair" : "skin";
                              handleAddProductTarget(name.trim(), type);
                            }
                          }}
                          className="text-[10px] text-[#C9A227] hover:text-[#1F4D3A] transition font-bold uppercase tracking-wider cursor-pointer"
                        >
                          + Add New Target
                        </button>
                      </label>
                      <select 
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const currentConcerns = editingProduct.concern ? editingProduct.concern.split(", ").filter(Boolean) : [];
                          if (!currentConcerns.includes(val)) {
                            const updated = [...currentConcerns, val].join(", ");
                            setEditingProduct({ ...editingProduct, concern: updated });
                          }
                        }}
                        className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none"
                      >
                        <option value="">Choose concern to add...</option>
                        {productTargets.filter(t => {
                          if (!editingProduct.category) return true;
                          const catLower = (editingProduct.category || "").toLowerCase();
                          const isHairCat = catLower.includes("hair") || catLower.includes("shampoo") || catLower.includes("oil") || catLower.includes("scalp") || catLower.includes("conditioner");
                          return isHairCat ? t.type === "hair" : t.type === "skin";
                        }).map((t) => (
                          <option key={t.id} value={t.name}>{t.name} ({t.type === 'hair' ? 'Hair' : 'Skin'})</option>
                        ))}
                      </select>
                      
                      {editingProduct.concern && editingProduct.concern.split(", ").filter(Boolean).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {editingProduct.concern.split(", ").filter(Boolean).map((conc) => (
                            <span key={conc} className="inline-flex items-center gap-1 bg-[#1F4D3A]/5 border border-[#1F4D3A]/20 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#1F4D3A]">
                              {conc}
                              <button
                                type="button"
                                onClick={() => {
                                  const currentConcerns = editingProduct.concern ? editingProduct.concern.split(", ").filter(Boolean) : [];
                                  const updated = currentConcerns.filter(c => c !== conc).join(", ");
                                  setEditingProduct({ ...editingProduct, concern: updated || undefined });
                                }}
                                className="hover:text-[#C9A227] font-bold text-xs leading-none"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex flex-col sm:col-span-2 mt-4 p-5 border-2 border-[#E8E1D3] rounded-2xl bg-stone-50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <label className="font-bold text-[#1F4D3A] uppercase tracking-wider text-sm flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#C9A227]" />
                            Pricing & Sizing Strategy
                          </label>
                          <p className="text-[10px] text-[#757575] mt-1">Enable multiple sizes for this formulation (e.g. 50ml, 100ml, 250ml).</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-[#1F4D3A] uppercase">{isMultiSizeMode ? "Multi-Size" : "Single Size"}</span>
                          <Switch 
                            checked={isMultiSizeMode}
                            onChange={(val) => {
                              setIsMultiSizeMode(val);
                              // Preserve data: only initialize empty variants if switching to multi-size and it's empty
                              if (val && (!editingProduct.variants || editingProduct.variants.length === 0)) {
                                setEditingProduct({
                                  ...editingProduct,
                                  variants: [{
                                    id: `var-${Date.now()}`,
                                    size: editingProduct.size || "100ml",
                                    price: editingProduct.price || 0,
                                    compare_price: editingProduct.originalPrice || 0,
                                    stock_quantity: editingProduct.stock_quantity || 0,
                                  }]
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {isMultiSizeMode ? (
                        <div className="space-y-4 pt-4 border-t border-[#E8E1D3]">
                          {editingProduct.variants?.map((v: any, index: number) => (
                            <div key={v.id || index} className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 bg-white border border-[#E8E1D3] rounded-xl items-end relative shadow-xs">
                              <div className="flex flex-col space-y-1.5 sm:col-span-1">
                                <label className="text-[9px] font-bold text-[#1F4D3A] uppercase tracking-wider">Size/Volume</label>
                                <input type="text" placeholder="e.g. 50ml" value={v.size} onChange={e => {
                                  const newVars = [...editingProduct.variants!];
                                  newVars[index].size = e.target.value;
                                  setEditingProduct({...editingProduct, variants: newVars});
                                }} className="border border-[#e5e5e5] focus:border-[#C9A227] px-3 py-2.5 rounded-lg outline-none text-xs" />
                              </div>
                              <div className="flex flex-col space-y-1.5 sm:col-span-1">
                                <label className="text-[9px] font-bold text-[#1F4D3A] uppercase tracking-wider">Compare Price</label>
                                <input type="number" placeholder="0" value={v.compare_price || 0} onChange={e => {
                                  const newVars = [...editingProduct.variants!];
                                  newVars[index].compare_price = Number(e.target.value);
                                  setEditingProduct({...editingProduct, variants: newVars});
                                }} className="border border-[#e5e5e5] focus:border-[#C9A227] px-3 py-2.5 rounded-lg outline-none text-xs" />
                              </div>
                              <div className="flex flex-col space-y-1.5 sm:col-span-1">
                                <label className="text-[9px] font-bold text-[#1F4D3A] uppercase tracking-wider">Sale Price (Rs)</label>
                                <input type="number" placeholder="0" value={v.price} onChange={e => {
                                  const newVars = [...editingProduct.variants!];
                                  newVars[index].price = Number(e.target.value);
                                  setEditingProduct({...editingProduct, variants: newVars});
                                }} className="border border-[#e5e5e5] focus:border-[#C9A227] px-3 py-2.5 rounded-lg outline-none text-xs font-bold text-emerald-700" />
                              </div>
                              <div className="flex flex-col space-y-1.5 sm:col-span-1">
                                <label className="text-[9px] font-bold text-[#1F4D3A] uppercase tracking-wider">Stock Qty</label>
                                <input type="number" placeholder="0" value={v.stock_quantity} onChange={e => {
                                  const newVars = [...editingProduct.variants!];
                                  newVars[index].stock_quantity = Number(e.target.value);
                                  setEditingProduct({...editingProduct, variants: newVars});
                                }} className="border border-[#e5e5e5] focus:border-[#C9A227] px-3 py-2.5 rounded-lg outline-none text-xs" />
                              </div>
                              <div className="sm:col-span-1 flex justify-end pb-1">
                                <button type="button" onClick={() => {
                                  const newVars = editingProduct.variants!.filter((_, i) => i !== index);
                                  setEditingProduct({...editingProduct, variants: newVars});
                                }} className="p-2.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 flex items-center justify-center transition-colors shadow-xs">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-start">
                            <button type="button" onClick={() => {
                              setEditingProduct({
                                ...editingProduct,
                                variants: [...editingProduct.variants!, {
                                }]
                              })
                            }} className="px-4 py-2.5 bg-[#C9A227]/10 text-[#C9A227] hover:bg-[#C9A227]/20 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer">
                              <Plus className="w-4 h-4" /> Add Another Size Variant
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-[#E8E1D3]">
                          <div className="space-y-1.5 flex flex-col">
                            <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Compare Price (Rs.)</label>
                            <input 
                              type="number" 
                              value={editingProduct.originalPrice || 0}
                              onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: parseInt(e.target.value) || 0 })}
                              className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none" 
                            />
                          </div>

                          <div className="space-y-1.5 flex flex-col">
                            <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Sale Price (Rs.)</label>
                            <input 
                              type="number" 
                              value={editingProduct.price || 0}
                              onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })}
                              required
                              className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none font-bold text-emerald-700" 
                            />
                          </div>

                          <div className="space-y-1.5 flex flex-col">
                            <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Product Size</label>
                            <input 
                              type="text" 
                              placeholder="e.g. 100ml"
                              value={editingProduct.size || ""}
                              onChange={(e) => setEditingProduct({ ...editingProduct, size: e.target.value })}
                              className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none" 
                            />
                          </div>

                          <div className="space-y-1.5 flex flex-col sm:col-span-3">
                            <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Stock Quantity</label>
                            <input 
                              type="number" 
                              value={editingProduct.stock_quantity !== undefined ? editingProduct.stock_quantity : 0}
                              onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) || 0 })}
                              required
                              className="w-full max-w-[200px] border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none" 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1.5 flex flex-col">
                      <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Review Stars (0.0 to 5.0)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        min="0"
                        max="5"
                        value={editingProduct.rating !== undefined ? editingProduct.rating : 4.5}
                        onChange={(e) => setEditingProduct({ ...editingProduct, rating: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none" 
                      />
                    </div>

                    <div className="space-y-1.5 flex flex-col">
                      <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Reviews Count</label>
                      <input 
                        type="number" 
                        value={editingProduct.reviews_count !== undefined ? editingProduct.reviews_count : (editingProduct.reviewCount !== undefined ? editingProduct.reviewCount : 10)}
                        onChange={(e) => setEditingProduct({ ...editingProduct, reviews_count: parseInt(e.target.value) || 0 })}
                        className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none" 
                      />
                    </div>
                  </div>
                </div>

                {/* Elaborated TextAreas */}
                <div className="space-y-5 text-xs">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Brief Therapeutic Description</label>
                    <textarea 
                      rows={3}
                      placeholder="Give deep details about Kashmiri saffron counts, molecular weights, etc."
                      value={editingProduct.description || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      required
                      className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4.5 py-3 rounded-xl outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5 flex flex-col">
                      <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Potency and Clinical Science Explanation</label>
                      <textarea 
                        rows={3}
                        placeholder="Clinical assay results e.g. 53% cell increase."
                        value={editingProduct.potencyExplanation || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, potencyExplanation: e.target.value })}
                        className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4.5 py-3 rounded-xl outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-1.5 flex flex-col">
                      <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Pure Ingredients Composition</label>
                      <textarea 
                        rows={3}
                        placeholder="Comma separated botanical elements..."
                        value={editingProduct.ingredients || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, ingredients: e.target.value })}
                        className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4.5 py-3 rounded-xl outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                    <div className="space-y-1.5 flex flex-col">
                      <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Benefits (Comma separated)</label>
                      <textarea 
                        rows={3}
                        placeholder="E.g., Brightens skin, Removes acne, Hydrates deeply"
                        value={editingProduct.keyBenefits ? editingProduct.keyBenefits.join(", ") : ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, keyBenefits: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
                        className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4.5 py-3 rounded-xl outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-1.5 flex flex-col">
                      <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">How to Use</label>
                      <textarea 
                        rows={3}
                        placeholder="Instructions for application..."
                        value={editingProduct.howToUse || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, howToUse: e.target.value })}
                        className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4.5 py-3 rounded-xl outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Sticky control footer bar */}
                <div className="pt-6 border-t border-[#e5e5e5] flex items-center justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setIsEditingProduct(false)}
                    className="px-5 py-3.5 border border-[#e5e5e5] hover:bg-[#f5f5f5] text-xs font-bold uppercase tracking-widest rounded-xl text-[#757575] hover:text-[#1a1a1a] transition-colors cursor-pointer"
                  >
                    Discard Draft
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-[#1F4D3A] hover:bg-[#153427] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer hover:scale-102 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C9A227]" />
                    <span>Save Secret Formulation</span>
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <>
              {/* SECTION 1: DASHBOARD ANALYTICS OVERVIEW */}
              {activeSection === "dashboard" && (
                <div className="space-y-8">
                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                      title="Total Store Revenue (PKR)" 
                      value={`Rs. ${orders.reduce((acc, o) => o.status === "Delivered" ? acc + (Number(o.totalPrice) || 0) : acc, 0).toLocaleString()}`}
                      iconName="CreditCard"
                      colorTheme="green"
                      percentageChange="Delivered Only"
                      isPositive={true}
                    />
                    <StatCard 
                      title="Completed Orders" 
                      value={`${orders.filter(o => o.status === "Delivered").length} / ${orders.length}`}
                      iconName="ShoppingBag"
                      colorTheme="dark-green"
                      percentageChange="5.4%"
                      isPositive={true}
                    />
                    <StatCard 
                      title="Total Customers" 
                      value={customers.length}
                      iconName="Users"
                      colorTheme="gold"
                      percentageChange={`${customers.length > 0 ? "Active" : "No Customers"}`}
                      isPositive={true}
                    />
                    <StatCard 
                      title="Product Stock Alerts" 
                      value={products.filter(p => (p.stock_quantity !== undefined ? p.stock_quantity : 15) < 10).length}
                      iconName="Settings2"
                      colorTheme="red"
                      percentageChange="Low"
                      isPositive={false}
                    />
                  </div>

                  {/* Graph Grid: Sales Curve vs stock */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Area Graph Chart */}
                    <div className="lg:col-span-2 bg-white border border-[#E8E1D3] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#E8E1D3] gap-4">
                        <div>
                          <h4 className="font-playfair text-lg font-bold text-[#1F4D3A] uppercase tracking-wider">
                            {graphType === "revenue" ? "Revenue Analytics" : "Order Volume Analytics"}
                          </h4>
                          <p className="text-[10px] text-[#757575] font-light font-sans mt-0.5">
                            {graphType === "revenue" 
                              ? "Real-time daily delivered revenue transaction inflows in Pakistan Standard Time (PKR)." 
                              : "Total logged orders count including all processing states."}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Graph Type Switcher */}
                          <div className="bg-[#1F4D3A]/5 p-1 rounded-xl flex gap-1 border border-[#1F4D3A]/10">
                            <button
                              type="button"
                              onClick={() => setGraphType("revenue")}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${
                                graphType === "revenue" 
                                  ? "bg-[#1F4D3A] text-white" 
                                  : "text-[#757575] hover:text-[#1a1a1a]"
                              }`}
                            >
                              Revenue
                            </button>
                            <button
                              type="button"
                              onClick={() => setGraphType("orders")}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${
                                graphType === "orders" 
                                  ? "bg-[#1F4D3A] text-white" 
                                  : "text-[#757575] hover:text-[#1a1a1a]"
                              }`}
                            >
                              Orders
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Time Range Selector Row */}
                      <div className="flex flex-wrap items-center gap-1.5 py-4 border-b border-gray-50">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#C9A227] mr-1">Time Horizon:</span>
                        {(["today", "yesterday", "7days", "14days", "1month", "3months"] as const).map((range) => {
                          const labels: Record<string, string> = {
                            today: "Today",
                            yesterday: "Yesterday",
                            "7days": "7 Days",
                            "14days": "14 Days",
                            "1month": "30 Days",
                            "3months": "90 Days"
                          };
                          return (
                            <button
                              key={range}
                              type="button"
                              onClick={() => setTimeRange(range)}
                              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition cursor-pointer ${
                                timeRange === range 
                                  ? "bg-[#C9A227] text-white border-[#C9A227]" 
                                  : "bg-white border-[#e5e5e5] text-[#757575] hover:border-[#e5e5e5] hover:text-[#1a1a1a]"
                              }`}
                            >
                              {labels[range]}
                            </button>
                          );
                        })}
                      </div>

                      <div className="h-[280px] w-full pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analyticsChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={graphType === "revenue" ? "#1F4D3A" : "#C9A227"} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={graphType === "revenue" ? "#1F4D3A" : "#C9A227"} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E1D3" />
                            <XAxis dataKey="name" stroke="#757575" fontSize={10} tickLine={false} />
                            <YAxis stroke="#757575" fontSize={10} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: "#0F1411", border: "1px solid #1E2B24", color: "#F7F2EA", borderRadius: "12px", fontFamily: "sans-serif", fontSize: "11px" }}
                              labelStyle={{ fontSize: "11px", color: "#C9A227", fontWeight: "bold" }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              name={graphType === "revenue" ? "PKR Revenue" : "Orders Vol"} 
                              stroke={graphType === "revenue" ? "#1F4D3A" : "#C9A227"} 
                              strokeWidth={2.5} 
                              fillOpacity={1} 
                              fill="url(#colorValue)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Stock Alert panel representation */}
                    <div className="lg:col-span-1 bg-white border border-[#E8E1D3] rounded-3xl p-6 shadow-xs flex flex-col text-left justify-between">
                      <div className="pb-4 border-b border-[#e5e5e5]">
                        <h4 className="font-playfair text-lg font-bold text-[#1F4D3A] uppercase tracking-wider">Apothecary Stocks</h4>
                        <p className="text-[10px] text-[#757575] font-light font-sans mt-0.5">Critical alert levels requiring extract prep.</p>
                      </div>

                      <div className="py-2.5 space-y-4">
                        {products.slice(0, 3).map((prod) => {
                          const stock = prod.stock_quantity !== undefined ? prod.stock_quantity : 15;
                          const percent = Math.min(100, Math.max(5, (stock / 50) * 100));
                          const color = stock < 10 ? "bg-amber-500" : "bg-[#1F4D3A]";
                          const textClass = stock < 10 ? "text-amber-600" : "text-[#1F4D3A]";
                          return (
                            <div key={prod.id} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="truncate max-w-[170px] text-[#2C2C2C]">{prod.name}</span>
                                <span className={textClass}>{stock} left</span>
                              </div>
                              <div className="w-full bg-[#f5f5f5] h-2 rounded-full overflow-hidden">
                                <div className={`${color} h-full`} style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        {products.length === 0 && (
                          <p className="text-xs text-[#757575] font-light italic">No products available in catalogue.</p>
                        )}
                      </div>

                      <button
                        onClick={() => setActiveSection("products")}
                        className="w-full py-3 bg-[#f5f5f5] hover:bg-[#f5f5f5] border border-gray-250 text-[#757575] hover:text-[#1a1a1a] font-sans font-bold text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer block"
                      >
                        Adjust Formula Stock Entries
                      </button>
                    </div>
                  </div>

                  {/* Recent Placed Transactions Table layout */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-playfair text-lg font-bold text-[#1F4D3A] uppercase tracking-wider">Recent Orders Dispatch queue</h4>
                      <button 
                        onClick={() => setActiveSection("orders")}
                        className="text-[#C9A227] text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        View shipping book <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="border border-[#E8E1D3] bg-white rounded-2xl overflow-hidden divide-y divide-gray-100">
                      {orders.slice(0, 3).map((order) => (
                        <div key={order.orderId} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[#f5f5f5]/10 transition-colors text-xs text-left">
                          <div>
                            <span className="font-mono font-bold text-[#1F4D3A] block">{order.orderId}</span>
                            <span className="text-[10px] text-[#757575] block mt-0.5">{order.fullName} • {order.address.split(",")[2]} • {order.items.length} Articles</span>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <span className="font-bold text-[#1F4D3A] block">Rs. {(order.totalPrice || 0).toLocaleString()}</span>
                              <StatusBadge status={order.status} />
                            </div>
                            <button
                              onClick={() => setInvoiceOrder(order)}
                              className="p-2 border border-[#e5e5e5] hover:border-[#1F4D3A] rounded-xl text-[#757575] hover:text-[#1F4D3A] transition-colors cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: PRODUCTS CATALOGUE PANEL */}
              {activeSection === "products" && (
                <div className="space-y-6">
                  {/* Filters toolrow */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                    <div className="relative max-w-sm flex-1">
                      <Search className="w-4 h-4 text-[#757575] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search product formulations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-[#E8E1D3] rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-[#C9A227] transition-all"
                      />
                    </div>

                    <button
                      onClick={handleStartAddProduct}
                      className="px-5 py-3 bg-[#1F4D3A] hover:bg-[#153427] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Plus className="w-4.5 h-4.5 text-[#C9A227]" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  {/* Formulations Catalogue Table */}
                  <DataTable<Product> 
                    data={filteredProducts}
                    keyExtractor={(row) => row.id}
                    columns={[
                      {
                        header: "Visual Media",
                        accessor: (row) => (
                          <img 
                            src={row.image} 
                            alt={row.name} 
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 object-cover rounded-lg border border-gray-150 shadow-sm"
                          loading="lazy" />
                        )
                      },
                      {
                        header: "Formulation",
                        accessor: (row) => (
                          <div>
                            <span className="font-semibold text-[#2C2C2C] text-xs block truncate max-w-[220px]">{row.name}</span>
                            <span className="text-[9px] text-[#C9A227] font-mono tracking-wider uppercase font-semibold">{row.category}</span>
                          </div>
                        )
                      },
                      {
                        header: "Regional Cost",
                        accessor: (row) => (
                          <div className="font-sans text-xs">
                            <span className="font-bold text-[#1F4D3A] block">Rs. {(row.price || 0).toLocaleString()}</span>
                            {row.originalPrice && (
                              <span className="text-[10px] text-[#757575] line-through">Rs. {row.originalPrice.toLocaleString()}</span>
                            )}
                          </div>
                        )
                      },
                      {
                        header: "Best-Seller",
                        accessor: (row) => (
                          <Switch 
                            checked={!!row.isBestSeller}
                            onChange={(val) => handleToggleProductBestSeller(row.id, val)}
                          />
                        )
                      },
                      {
                        header: "Actions",
                        accessor: (row) => (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEditProduct(row)}
                              className="p-2 border border-gray-150 hover:border-[#1F4D3A] text-[#757575] hover:text-[#1F4D3A] rounded-lg transition-colors cursor-pointer"
                              aria-label="Edit formulation"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(row.id)}
                              className="p-2 border border-rose-100 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              aria-label="Delete formulation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              )}

              {/* SECTION 3: ORDERS MANAGEMENT PANEL */}
              {activeSection === "orders" && (
                <div className="space-y-6">
                  {/* Filters search */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                    <div className="relative max-w-sm flex-1">
                      <Search className="w-4 h-4 text-[#757575] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search shipping book (ID/Name/Cell)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-[#E8E1D3] rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-[#C9A227] transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-left">
                      <Filter className="w-4 h-4 text-[#1F4D3A]" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-[#E8E1D3] focus:border-[#C9A227] px-3.5 py-2.5 rounded-xl outline-none font-sans"
                      >
                        <option value="All">All statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Orders DataTable */}
                  <DataTable<AdminOrder> 
                    data={filteredOrders}
                    keyExtractor={(row) => row.orderId}
                    columns={[
                      {
                        header: "Order code",
                        accessor: (row) => (
                          <div>
                            <span className="font-mono font-bold text-[#1F4D3A] text-xs block">{row.orderId}</span>
                            <span className="text-[10px] text-[#757575]">{row.date}</span>
                          </div>
                        )
                      },
                      {
                        header: "Consignee",
                        accessor: (row) => (
                          <div>
                            <span className="font-semibold text-[#2C2C2C] block">{row.fullName}</span>
                            <span className="text-[10px] text-[#757575] block mt-0.5">{row.phone}</span>
                          </div>
                        )
                      },
                      {
                        header: "Products summary",
                        accessor: (row) => (
                          <span className="text-[11px] text-gray-650 truncate max-w-[200px] block font-light">
                            {row.items.map(it => `${it.name} (x${it.quantity})`).join(", ")}
                          </span>
                        )
                      },
                      {
                        header: "Amount Paid",
                        accessor: (row) => (
                          <span className="font-bold text-[#1F4D3A]">Rs. {(row.totalPrice || 0).toLocaleString()}</span>
                        )
                      },
                      {
                        header: "Workflow Status",
                        accessor: (row) => (
                          <select
                            value={row.status}
                            onChange={(e) => updateOrderInDb(row.orderId, { status: e.target.value as any })}
                            className={`px-3 py-1 text-[9.5px] font-sans font-extrabold uppercase rounded-full border cursor-pointer outline-none ${
                              row.status === "Delivered" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              row.status === "Shipped" ? "bg-blue-50 text-blue-600 border-blue-100" :
                              row.status === "Cancelled" ? "bg-rose-50 text-rose-600 border-rose-100" :
                              "bg-yellow-50 text-amber-600 border-yellow-200/60"
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        )
                      },
                      {
                        header: "Actions",
                        accessor: (row) => (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedOrderDetail(row)}
                              className="px-2.5 py-1.5 bg-[#1F4D3A] hover:bg-[#153427] text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                              title="View Full Details"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Detail</span>
                            </button>
                            <button
                              onClick={() => setInvoiceOrder(row)}
                              className="p-2 border border-gray-150 hover:border-[#1F4D3A] text-[#757575] hover:text-[#1F4D3A] rounded-lg transition-colors cursor-pointer"
                              aria-label="View Invoice"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={generateAdminWhatsAppLink({
                                orderId: row.orderId,
                                totalPrice: row.totalPrice,
                                fullName: row.shippingName || row.fullName,
                                phone: row.confirmationPhone || row.shippingPhone || row.phone,
                                address: row.address,
                                city: row.city || "Pakistan",
                                items: row.items,
                                couponCode: row.couponCode,
                                discountPercentage: row.discountPercentage,
                                paymentMethod: row.paymentMethod,
                                paymentStatus: row.paymentStatus
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 border border-gray-150 hover:border-emerald-600 text-[#757575] hover:text-emerald-600 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                              title="Notify via WhatsApp"
                              aria-label="Notify via WhatsApp"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => deleteOrder(row.orderId)}
                              className="p-2 border border-rose-50 hover:bg-rose-55 rounded-lg text-rose-450 hover:text-rose-600 transition-colors cursor-pointer"
                              aria-label="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              )}

              {/* SECTION 4: CUSTOMERS REGIONAL REGISTRY */}
              {activeSection === "customers" && (
                <div className="space-y-6">
                  <div className="bg-white border border-[#E8E1D3] rounded-3xl p-6 shadow-xs">
                    <h4 className="font-playfair text-lg font-bold text-[#1F4D3A] uppercase tracking-wider mb-4">Customer Info</h4>
                    {customersLoading ? (
                      <div className="text-center py-6 text-xs text-[#757575] italic">Loading registered diagnostics...</div>
                    ) : customers.length === 0 ? (
                      <div className="text-center py-6 text-xs text-[#757575] italic">No registered customers found.</div>
                    ) : (
                      <div className="divide-y divide-gray-100 text-xs">
                        {customers.map((cust) => (
                          <div key={cust.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <span className="font-semibold text-[#2C2C2C] block text-sm">{cust.full_name || "Valued Patron"}</span>
                              <span className="text-[#757575]">{cust.email} {cust.phone ? `• ${cust.phone}` : ""}</span>
                            </div>
                            {/* ROLE BADGE - UPDATED LOGIC */}
    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
      cust.role?.toLowerCase() === 'admin' 
        ? 'bg-[#C9A227]/10 text-[#C9A227] border-[#C9A227]/30' 
        : 'bg-[#1F4D3A]/5 text-[#1F4D3A] border-[#1F4D3A]/20'
    }`}>
      {cust.role?.toLowerCase() === 'admin' ? 'Admin' : 'Customer'}
    </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 5: CATEGORIES CONFIG MANAGER */}
              {activeSection === "categories" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-playfair text-lg font-bold text-[#1F4D3A] uppercase tracking-wider">Secret formulation categories</h4>
                    <button
                      onClick={handleStartAddCategory}
                      className="px-4 py-2.5 bg-[#1F4D3A] hover:bg-[#153427] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      Add New Category
                    </button>
                  </div>

                  {isEditingCategory && editingCategory && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-[#E8E1D3] rounded-3xl p-6 space-y-4 text-xs text-left"
                    >
                      <h5 className="font-bold text-sm text-[#1F4D3A] uppercase tracking-wider">
                        {editingCategory.id ? "Edit Category Details" : "Add New Category"}
                      </h5>
                      <form onSubmit={handleSaveCategory} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5 flex flex-col">
                            <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Category Name</label>
                            <input
                              type="text"
                              value={editingCategory.name || ""}
                              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                              required
                              placeholder="e.g. Saffron Hair Oil"
                              className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-2.5 rounded-xl outline-none"
                            />
                          </div>
                          <div className="space-y-1.5 flex flex-col">
                            <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Slug (Optional)</label>
                            <input
                              type="text"
                              value={editingCategory.slug || ""}
                              onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                              placeholder="e.g. saffron-hair-oil"
                              className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-2.5 rounded-xl outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3.5 pt-2">
                          <button
                            type="button"
                            onClick={() => { setIsEditingCategory(false); setEditingCategory(null); }}
                            className="px-4 py-2 border border-[#e5e5e5] text-[#757575] rounded-lg hover:text-[#1a1a1a] hover:bg-[#f5f5f5] cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#1F4D3A] text-white rounded-lg hover:bg-[#153427] cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                          >
                            Save Category
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  <div className="bg-white border border-[#E8E1D3] rounded-3xl p-6 shadow-xs">
                    {categoriesLoading ? (
                      <div className="text-center py-6 text-xs text-[#757575] italic">Loading categories...</div>
                    ) : categories.length === 0 ? (
                      <div className="text-center py-6 text-xs text-[#757575] italic">No categories created yet.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-sm text-left">
                        {categories.map((cat) => (
                            <div key={cat.id} className="p-5 border border-[#E8E1D3] rounded-2xl bg-[#f5f5f5]/20 shadow-xs flex flex-col justify-between gap-4">
                              <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                  <span className="font-semibold text-xs text-[#1F4D3A] uppercase tracking-wider font-sans block">{cat.name}</span>
                                  <span className="text-[10px] text-[#757575] mt-1.5 block">
                                    Active formulations: {products.filter(p => p.category === cat.name).length}
                                  </span>
                                </div>
                                <span className="w-2.5 h-2.5 rounded-full bg-[#C9A227] flex-shrink-0" />
                              </div>
                            <div className="flex items-center justify-end gap-2 border-t border-[#e5e5e5]/50 pt-2.5 text-xs">
                              <button
                                onClick={() => handleStartEditCategory(cat)}
                                className="px-2.5 py-1 border border-[#e5e5e5] hover:border-[#1F4D3A] text-[#757575] hover:text-[#1F4D3A] rounded-lg transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="px-2.5 py-1 border border-rose-100 hover:bg-rose-50 text-rose-500 hover:text-rose-750 rounded-lg transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Target Hair & Skin Concerns Section */}
                  <div className="border-t border-[#E8E1D3] pt-10 mt-10 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[9px] font-mono tracking-[0.22em] text-[#C9A227] uppercase font-bold">Concern Taxonomy Control</span>
                        <h4 className="font-playfair text-lg font-bold text-[#1F4D3A] uppercase tracking-wider">Secret Skin &amp; Hair Concerns</h4>
                      </div>
                      <button
                        onClick={() => {
                          setEditingTarget({ name: "", type: "skin" });
                          setIsEditingTarget(true);
                        }}
                        className="px-4 py-2.5 bg-[#C9A227] hover:bg-[#1F4D3A] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Target Concern</span>
                      </button>
                    </div>

                    {isEditingTarget && editingTarget && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-[#E8E1D3] rounded-3xl p-6 space-y-4 text-xs text-left"
                      >
                        <h5 className="font-bold text-sm text-[#1F4D3A] uppercase tracking-wider">
                          {editingTarget.id ? "Edit Target Concern" : "Register New Target Concern"}
                        </h5>
                        <form onSubmit={handleSaveProductTarget} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5 flex flex-col">
                              <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Concern Name</label>
                              <input
                                type="text"
                                value={editingTarget.name || ""}
                                onChange={(e) => setEditingTarget({ ...editingTarget, name: e.target.value })}
                                required
                                placeholder="e.g. Fine Lines"
                                className="w-full border-2 border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none text-[#2C2C2C] bg-white font-sans text-xs"
                              />
                            </div>
                            <div className="space-y-1.5 flex flex-col">
                              <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Concern Type</label>
                              <select
                                value={editingTarget.type || "skin"}
                                onChange={(e) => setEditingTarget({ ...editingTarget, type: e.target.value as "skin" | "hair" })}
                                className="w-full border-2 border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none cursor-pointer text-[#2C2C2C] bg-white font-sans text-xs"
                              >
                                <option value="skin" className="text-[#2C2C2C]">Skin Care</option>
                                <option value="hair" className="text-[#2C2C2C]">Hair Care</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-3.5 pt-2">
                            <button
                              type="button"
                              onClick={() => { setIsEditingTarget(false); setEditingTarget(null); }}
                              className="px-4 py-2 border border-[#e5e5e5] text-[#757575] rounded-lg hover:text-[#1a1a1a] hover:bg-[#f5f5f5] cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-[#1F4D3A] text-white rounded-lg hover:bg-[#153427] cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                            >
                              Save Target Concern
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    <div className="bg-white border border-[#E8E1D3] rounded-3xl p-6 shadow-xs">
                      {productTargetsLoading ? (
                        <div className="text-center py-6 text-xs text-[#757575] italic">Loading target concerns...</div>
                      ) : productTargets.length === 0 ? (
                        <div className="text-center py-6 text-xs text-[#757575] italic">No target concerns registered yet.</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-sm text-left">
                          {productTargets.map((target) => (
                            <div key={target.id} className="p-5 border border-[#E8E1D3] rounded-2xl bg-[#f5f5f5]/20 shadow-xs flex flex-col justify-between gap-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-semibold text-xs text-[#1F4D3A] uppercase tracking-wider font-sans block">{target.name}</span>
                                  <span className={`inline-block mt-2 px-2.5 py-1 text-[9px] font-bold rounded-full uppercase tracking-widest ${
                                    target.type === "hair" ? "bg-amber-100 text-amber-800 border border-amber-250" : "bg-emerald-100 text-emerald-800 border border-emerald-250"
                                  }`}>
                                    {target.type === "hair" ? "Hair Care" : "Skin Care"}
                                  </span>
                                </div>
                                <span className={`w-2.5 h-2.5 rounded-full ${target.type === "hair" ? "bg-[#C9A227]" : "bg-[#1F4D3A]"}`} />
                              </div>
                              <div className="flex items-center justify-end gap-2 border-t border-[#e5e5e5]/50 pt-2.5 text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTarget(target);
                                    setIsEditingTarget(true);
                                  }}
                                  className="px-2.5 py-1 border border-[#e5e5e5] hover:border-[#1F4D3A] text-[#757575] hover:text-[#1F4D3A] rounded-lg transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProductTarget(target.id)}
                                  className="px-2.5 py-1 border border-rose-100 hover:bg-rose-50 text-rose-500 hover:text-rose-750 rounded-lg transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 6: INQUIRIES & MESSAGES LOGS */}
              {activeSection === "messages" && (
                <div className="space-y-6 text-left">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`p-6 border rounded-2xl transition-all shadow-xs flex flex-col md:flex-row justify-between items-start gap-4 ${
                          msg.isRead 
                            ? "bg-white border-[#e5e5e5]" 
                            : "bg-[#C9A227]/5 border-[#C9A227] shadow-md shadow-[#C9A227]/5"
                        }`}
                      >
                        <div className="space-y-3.5 flex-1 max-w-4xl text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-[#2C2C2C] text-sm">{msg.name}</span>
                            <span className="text-[10px] text-[#757575] font-mono">({msg.date})</span>
                            {!msg.isRead && (
                              <span className="bg-[#C9A227] text-[#0A0D0B] text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full select-none">
                                Unread Inquiry
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <p className="font-semibold text-gray-750">Subject: {msg.subject}</p>
                            <p className="text-[#757575] font-light leading-relaxed whitespace-pre-line text-xs">{msg.message}</p>
                          </div>

                          <p className="text-[10px] text-[#757575]">Respondent cell: <span className="font-mono text-[#2C2C2C]">{msg.phone}</span> • email: {msg.email}</p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2.5 self-end md:self-start">
                          <button
                            onClick={() => toggleMessageRead(msg.id)}
                            className="p-2 border border-gray-150 hover:border-[#1F4D3A] rounded-xl text-[#757575] hover:text-[#1F4D3A] transition-colors cursor-pointer"
                            title={msg.isRead ? "Mark Unread" : "Mark Read"}
                          >
                            <CheckCheck className={`w-4 h-4 ${msg.isRead ? "text-emerald-650" : ""}`} />
                          </button>
                          
                          <button
                            onClick={() => handleOpenReply(msg)}
                            className="px-4 py-2.5 bg-[#C9A227] hover:bg-[#A88720] text-[#1F4D3A] rounded-xl text-[10.5px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Email Reply</span>
                          </button>

                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-2 border border-rose-100 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl transition-colors cursor-pointer"
                            title="Delete Inquiry Message"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 7: SETTINGS DIALOGUE */}
              {activeSection === "settings" && (
                <div className="space-y-8">
                  {/* Part 1: Admin Personal Profile Details */}
                  <div className="bg-white border border-[#E8E1D3] rounded-3xl p-6 sm:p-8 space-y-6 text-xs text-left">
                    <h4 className="font-playfair text-lg font-bold text-[#1F4D3A] uppercase tracking-wider border-b border-[#e5e5e5] pb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#C9A227]" />
                      <span>Admin Profile Management</span>
                    </h4>
                    
                    <form onSubmit={handleUpdateAdminProfile} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5 flex flex-col">
                          <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Full Name</label>
                          <input 
                            type="text" 
                            required
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none" 
                          />
                        </div>

                        <div className="space-y-1.5 flex flex-col">
                          <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Email Address (Read-Only)</label>
                          <input 
                            type="email" 
                            disabled
                            value={profile?.email || user?.primaryEmailAddress?.emailAddress || "admin@wenhairskin.com"}
                            className="w-full bg-[#f5f5f5] border border-gray-150 text-[#757575] px-4 py-3 rounded-xl outline-none cursor-not-allowed" 
                          />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={profileSaving}
                        className="px-5 py-3.5 bg-[#1F4D3A] hover:bg-[#153427] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer hover:scale-101"
                      >
                        {profileSaving ? "Saving details..." : "Update Administrative Account"}
                      </button>
                    </form>
                  </div>

                  {/* Part 2: Apothecary Coupon Codes Configuration */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-playfair text-lg font-bold text-[#1F4D3A] uppercase tracking-wider flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-[#C9A227]" />
                        <span>Apothecary Coupon Codes</span>
                      </h4>
                      <button
                        onClick={handleStartAddCoupon}
                        className="px-4 py-2.5 bg-[#1F4D3A] hover:bg-[#153427] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        Add New Coupon
                      </button>
                    </div>

                    {isEditingCoupon && editingCoupon && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-[#E8E1D3] rounded-3xl p-6 space-y-4 text-xs text-left"
                      >
                        <h5 className="font-bold text-sm text-[#1F4D3A] uppercase tracking-wider">
                          {editingCoupon.id ? "Edit Coupon Details" : "Register New Coupon Code"}
                        </h5>
                        <form onSubmit={handleSaveCoupon} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5 flex flex-col">
                              <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Coupon Code</label>
                              <input
                                type="text"
                                value={editingCoupon.code || ""}
                                onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value })}
                                required
                                placeholder="e.g. WENSECRET25"
                                className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-2.5 rounded-xl outline-none uppercase font-mono tracking-wider"
                              />
                            </div>
                            <div className="space-y-1.5 flex flex-col">
                              <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Discount Percentage (%)</label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={editingCoupon.discount_percentage || ""}
                                onChange={(e) => setEditingCoupon({ ...editingCoupon, discount_percentage: Number(e.target.value) })}
                                required
                                placeholder="e.g. 25"
                                className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-2.5 rounded-xl outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5 flex flex-col">
                              <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Start Date</label>
                              <input
                                type="date"
                                value={editingCoupon.start_date || ""}
                                onChange={(e) => setEditingCoupon({ ...editingCoupon, start_date: e.target.value })}
                                className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-2.5 rounded-xl outline-none font-mono"
                              />
                            </div>
                            <div className="space-y-1.5 flex flex-col">
                              <label className="font-bold text-[#1F4D3A] uppercase tracking-wider">Expiry / End Date</label>
                              <input
                                type="date"
                                value={editingCoupon.end_date || ""}
                                onChange={(e) => setEditingCoupon({ ...editingCoupon, end_date: e.target.value })}
                                className="w-full border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-2.5 rounded-xl outline-none font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              id="coupon-active-chk"
                              checked={editingCoupon.is_active}
                              onChange={(e) => setEditingCoupon({ ...editingCoupon, is_active: e.target.checked })}
                              className="w-4 h-4 text-[#1F4D3A] border-[#e5e5e5] rounded focus:ring-[#C9A227] cursor-pointer"
                            />
                            <label htmlFor="coupon-active-chk" className="font-bold text-[#1F4D3A] uppercase tracking-wider select-none cursor-pointer">
                              Active & Redeemable on Checkout
                            </label>
                          </div>

                          <div className="flex justify-end gap-3.5 pt-2">
                            <button
                              type="button"
                              onClick={() => { setIsEditingCoupon(false); setEditingCoupon(null); }}
                              className="px-4 py-2 border border-[#e5e5e5] text-[#757575] rounded-lg hover:text-[#1a1a1a] hover:bg-[#f5f5f5] cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-[#1F4D3A] text-white rounded-lg hover:bg-[#153427] cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                            >
                              Save Coupon
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    <div className="bg-white border border-[#E8E1D3] rounded-3xl p-6 shadow-xs">
                      {couponsLoading ? (
                        <div className="text-center py-6 text-xs text-[#757575] italic">Loading coupon registry...</div>
                      ) : coupons.length === 0 ? (
                        <div className="text-center py-6 text-xs text-[#757575] italic">No coupons registered yet.</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-sm text-left">
                          {coupons.map((coupon) => {
                            const now = new Date();
                            const isExpired = coupon.end_date && new Date(coupon.end_date) < now;
                            const isActive = coupon.is_active && !isExpired;

                            return (
                              <div key={coupon.id} className="p-5 border border-[#E8E1D3] rounded-2xl bg-[#f5f5f5]/20 shadow-xs flex flex-col justify-between gap-4 font-sans">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="font-mono font-bold text-sm text-[#1F4D3A] tracking-wider uppercase block">{coupon.code}</span>
                                    <span className="text-xs text-[#C9A227] font-bold mt-1 block">
                                      {coupon.discount_percentage}% OFF
                                    </span>
                                    <p className="text-[10px] text-[#757575] mt-2 font-mono leading-relaxed">
                                      {coupon.start_date ? `From: ${new Date(coupon.start_date).toLocaleDateString()}` : "No Start Date"} <br />
                                      {coupon.end_date ? `Exp: ${new Date(coupon.end_date).toLocaleDateString()}` : "No Expiry"}
                                    </p>
                                  </div>
                                  <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-400"}`} title={isActive ? "Active" : isExpired ? "Expired" : "Disabled"} />
                                </div>
                                <div className="flex items-center justify-end gap-2 border-t border-[#e5e5e5]/50 pt-2.5 text-xs">
                                  <button
                                    onClick={() => handleStartEditCoupon(coupon)}
                                    className="px-2.5 py-1 border border-[#e5e5e5] hover:border-[#1F4D3A] text-[#757575] hover:text-[#1F4D3A] rounded-lg transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCoupon(coupon.id)}
                                    className="px-2.5 py-1 border border-rose-100 hover:bg-rose-50 text-rose-500 hover:text-[#c11c1c] rounded-lg transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* MODULAR PORTAL VIEW OVERLAY: PRECISE INVOICE SHEET */}
      <AnimatePresence>
        {invoiceOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setInvoiceOrder(null)}
              className="fixed inset-0 bg-black z-50 backdrop-blur-xs"
            />
            
            <motion.div 
              id="invoice-print-area"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 max-w-xl mx-auto top-[15%] bottom-[15%] bg-white rounded-3xl border border-[#E8E1D3] shadow-2xl z-50 p-8 flex flex-col text-left overflow-y-auto"
            >
              <div className="flex justify-between items-start pb-5 border-b border-[#e5e5e5] flex-shrink-0">
                <div className="text-left">
                  <span className="font-playfair text-2.5xl font-extrabold tracking-widest text-[#1F4D3A] block">W E N</span>
                  <span className="font-sans text-[8px] font-bold text-[#C9A227] tracking-[0.2em] uppercase block -mt-1">HAIR & SKIN SECRET</span>
                </div>
                
                <div className="flex items-center gap-2 invoice-no-print">
                  <button
                    disabled={isExporting}
                    onClick={() => handleDownloadInvoicePDF("invoice-print-area", invoiceOrder.orderId)}
                    className="px-3.5 py-1.5 bg-[#1F4D3A] hover:bg-[#C9A227] hover:text-[#1F4D3A] text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isExporting ? "Generating..." : "Download Invoice"}
                  </button>
                  <button
                    onClick={() => setInvoiceOrder(null)}
                    className="px-3.5 py-1.5 bg-[#f5f5f5] border border-gray-150 rounded-lg text-xs font-bold uppercase tracking-widest text-[#757575] hover:text-[#1a1a1a] transition-all cursor-pointer"
                  >
                    Dismiss Sheet
                  </button>
                </div>
              </div>

              <div className="space-y-6 py-6 text-xs text-left">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-mono text-[#757575] uppercase text-[9px] tracking-wider">Receipt No.</p>
                    <p className="font-mono font-bold text-[#1F4D3A]">{invoiceOrder.orderId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[#757575] uppercase text-[9px] tracking-wider">Lodgement Date</p>
                    <p className="font-semibold text-gray-750">{invoiceOrder.date}</p>
                  </div>
                </div>

                {/* Shipping target */}
                <div className="p-4 bg-[#f5f5f5]/50 border border-[#E8E1D3] rounded-xl space-y-1 text-left">
                  <p className="font-bold text-[#1F4D3A] uppercase tracking-wider text-[9px]">Target Consignee</p>
                  <p className="font-medium text-[#2C2C2C] text-xs">{invoiceOrder.fullName}</p>
                  <p className="text-[#757575]">{invoiceOrder.phone}</p>
                  <p className="text-[#757575] leading-relaxed text-[11px]">{invoiceOrder.address}</p>
                </div>

                {/* Items loop */}
                <div className="space-y-3">
                  <p className="font-bold text-[#1F4D3A] uppercase tracking-wider text-[9px] border-b border-gray-50 pb-1.5">Consolidated Articles</p>
                  {invoiceOrder.items.map((it: any, index: number) => (
                    <div key={index} className="flex justify-between items-center leading-none">
                      <div>
                        <p className="font-semibold text-[#2C2C2C]">{it.name}</p>
                        <p className="text-[10px] text-[#757575] mt-1 font-mono">{it.variant} x {it.quantity}</p>
                      </div>
                      <span className="font-bold text-[#2C2C2C]">Rs. {(it.price * it.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#e5e5e5] pt-5 flex justify-between items-center text-sm">
                  <span className="font-bold text-[#1F4D3A] uppercase tracking-wider">Grand Total (COD)</span>
                  <span className="text-lg font-bold text-[#1F4D3A]">Rs. {(invoiceOrder.totalPrice || 0).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="mt-auto border-t border-[#e5e5e5] pt-5 text-center text-[10px] text-[#757575] font-light flex-shrink-0">
                <p>Modern luxury clinical cosmetics crafted with pure Kashmiri saffron.</p>
                <p className="font-mono font-medium text-[#C9A227] mt-1 text-[9.5px]">THANK YOU FOR YOUR CONFIDENCE IN WEN</p>
              </div>
            </motion.div>
          </>
        )}

        {selectedOrderDetail && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderDetail(null)}
              className="fixed inset-0 bg-black z-50 backdrop-blur-xs"
            />
            
            <motion.div 
              id="order-detail-print-area"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 max-w-4xl mx-auto top-[8%] bottom-[8%] bg-white rounded-3xl border border-[#E8E1D3] shadow-2xl z-50 p-8 flex flex-col text-left overflow-y-auto font-sans"
            >
              <div className="flex justify-between items-start pb-5 border-b border-stone-150 flex-shrink-0">
                <div className="text-left">
                  <span className="text-[10px] font-mono tracking-[0.25em] text-[#C9A227] uppercase font-bold">Consignee Dispatch System</span>
                  <h3 className="font-playfair text-2.5xl font-extrabold text-[#1F4D3A] uppercase tracking-wide mt-1">Order Details #{selectedOrderDetail.orderId}</h3>
                  <p className="text-[11px] text-[#757575] font-mono mt-0.5">Placed on {selectedOrderDetail.date}</p>
                </div>
                
                <div className="flex items-center gap-2 invoice-no-print">
                  <button
                    disabled={isExporting}
                    onClick={() => handleDownloadInvoicePDF("order-detail-print-area", selectedOrderDetail.orderId)}
                    className="px-4 py-2 bg-[#1F4D3A] hover:bg-[#C9A227] hover:text-[#1F4D3A] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isExporting ? "Generating..." : "Download Invoice"}
                  </button>
                  <button
                    onClick={() => setSelectedOrderDetail(null)}
                    className="px-4 py-2 bg-stone-100 hover:bg-[#1F4D3A] hover:text-white border border-stone-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-stone-600 transition-all cursor-pointer"
                  >
                    Close View
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-6 text-xs">
                {/* COLUMN 1: CLIENT AND SHIPMENT DATA */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 space-y-4">
                    <h4 className="font-bold text-[#1F4D3A] uppercase tracking-wider text-[10px] border-b border-stone-200 pb-2">Customer Details</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Full Name</span>
                        <span className="font-semibold text-stone-850 text-sm block mt-0.5">{selectedOrderDetail.fullName}</span>
                      </div>
                      <div>
                        <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Email Address</span>
                        <span className="font-mono text-stone-700 block mt-0.5">{selectedOrderDetail.email || "no-email@customer.com"}</span>
                      </div>
                      <div>
                        <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Contact Number</span>
                        <span className="font-mono font-semibold text-stone-700 block mt-0.5">{selectedOrderDetail.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 space-y-4">
                    <h4 className="font-bold text-[#1F4D3A] uppercase tracking-wider text-[10px] border-b border-stone-200 pb-2">Order Communication Details</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Confirmation Email</span>
                        <span className="font-mono text-stone-700 block mt-0.5">{selectedOrderDetail.confirmationEmail || selectedOrderDetail.email || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Confirmation Phone (WhatsApp)</span>
                        <span className="font-mono font-semibold text-stone-700 block mt-0.5">{selectedOrderDetail.confirmationPhone || selectedOrderDetail.phone || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 space-y-4">
                    <h4 className="font-bold text-[#1F4D3A] uppercase tracking-wider text-[10px] border-b border-stone-200 pb-2">Shipping & Billing Registry</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Country</span>
                          <span className="font-bold text-[#1F4D3A] block mt-0.5 uppercase">Pakistan</span>
                        </div>
                        <div>
                          <span className="text-[#757575] block text-[9px] uppercase tracking-widest">City</span>
                          <span className="font-bold text-[#1F4D3A] block mt-0.5 uppercase">{selectedOrderDetail.city || "Lahore"}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Recipient Full Name</span>
                        <span className="font-semibold text-stone-850 text-sm block mt-0.5">{selectedOrderDetail.shippingName || selectedOrderDetail.fullName}</span>
                      </div>
                      <div>
                        <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Shipping Phone</span>
                        <span className="font-mono font-semibold text-stone-700 block mt-0.5">{selectedOrderDetail.shippingPhone || selectedOrderDetail.phone}</span>
                      </div>
                      <div>
                        <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Address details</span>
                        <p className="text-stone-700 leading-relaxed mt-1 font-medium">{selectedOrderDetail.address}</p>
                      </div>
                      <div>
                        <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Billing Address</span>
                        <span className="font-semibold text-stone-700 block mt-0.5 text-xs italic">Same as shipping address</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Postal Code</span>
                          <span className="font-mono font-bold text-stone-700 block mt-0.5">{selectedOrderDetail.postalCode || "N/A"}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Special Instructions</span>
                        <p className="text-stone-700 leading-relaxed mt-1 text-[11px] italic">{selectedOrderDetail.special_instructions || selectedOrderDetail.specialInstructions || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-5 space-y-4">
                    <h4 className="font-bold text-[#1F4D3A] uppercase tracking-wider text-[10px] border-b border-stone-200 pb-2">Status & Payment</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[#757575] block text-[9px] uppercase tracking-widest mb-1.5">Change Status</span>
                        <select
                          value={selectedOrderDetail.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as any;
                            updateOrderInDb(selectedOrderDetail.orderId, { status: newStatus });
                            setSelectedOrderDetail({ ...selectedOrderDetail, status: newStatus });
                          }}
                          className="w-full bg-white border border-stone-200 focus:border-[#C9A227] px-3.5 py-2.5 rounded-xl outline-none font-bold text-stone-800 font-sans"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="pt-2 border-t border-stone-200 grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[#757575] block text-[9px] uppercase tracking-widest">Payment Method</span>
                          <span className="font-bold text-stone-800 block mt-1 uppercase text-sm">{selectedOrderDetail.paymentMethod || "COD"}</span>
                        </div>
                        <div>
                          <span className="text-[#757575] block text-[9px] uppercase tracking-widest mb-1">Payment Status</span>
                          <select
                            value={(selectedOrderDetail.paymentStatus || 'unpaid').toLowerCase()}
                            onChange={(e) => {
                              const newPaymentStatus = e.target.value as any;
                              updateOrderInDb(selectedOrderDetail.orderId, { paymentStatus: newPaymentStatus });
                              setSelectedOrderDetail({ ...selectedOrderDetail, paymentStatus: newPaymentStatus });
                            }}
                            className={`w-full bg-white border border-stone-200 focus:border-[#C9A227] px-2 py-1.5 rounded outline-none font-bold text-xs font-sans ${selectedOrderDetail.paymentStatus?.toLowerCase() === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}
                          >
                            <option value="unpaid">UNPAID</option>
                            <option value="paid">PAID</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: PRODUCTS ORDERED (A to Z details with images, categories, skin target, discount) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-stone-200/80 rounded-2xl p-6 space-y-4">
                    <h4 className="font-bold text-[#1F4D3A] uppercase tracking-wider text-[10px] border-b border-stone-200 pb-2.5">Purchased Articles</h4>
                    
                    <div className="divide-y divide-stone-100">
                      {selectedOrderDetail.items.map((item: any, idx: number) => {
                        const displayImg = item.image || img_fm3yzs;
                        const displayCategory = item.category || "General formulation";
                        const displayTarget = item.concern || "All Skins";
                        const displaySize = item.variant || "100ml";

                        return (
                          <div key={idx} className="py-4 flex items-start gap-4 text-xs">
                            <img 
                              src={displayImg} 
                              alt={item.name} 
                              referrerPolicy="no-referrer"
                              className="w-16 h-16 object-cover rounded-xl border border-stone-200 shadow-2xs flex-shrink-0"
                            loading="lazy" />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-stone-850 text-sm block hover:text-[#1F4D3A] transition-colors">{item.name}</span>
                              
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="bg-emerald-50 border border-emerald-100 text-[#1F4D3A] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  {displayCategory}
                                </span>
                                {displayTarget && (
                                  <span className="bg-amber-50 border border-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    {displayTarget}
                                  </span>
                                )}
                                {displaySize && (
                                  <span className="bg-stone-50 border border-stone-150 text-stone-600 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    Size: {displaySize}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-bold text-stone-800 block text-sm">Rs. {(item.price || 0).toLocaleString()}</span>
                              <span className="text-[#757575] block text-[10px] mt-0.5">Quantity: {item.quantity}</span>
                              <span className="font-semibold text-[#1F4D3A] block text-[11px] mt-1 font-mono">Total: Rs. {(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* FINANCIAL BREAKDOWN & COUPONS */}
                  <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-6 space-y-4">
                    <h4 className="font-bold text-[#1F4D3A] uppercase tracking-wider text-[10px] border-b border-stone-200 pb-2">Financial Accounting</h4>
                    
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-[#757575]">
                        <span>Formulations Subtotal</span>
                        <span className="font-semibold font-mono">Rs. {selectedOrderDetail.items.reduce((acc: number, cur: any) => acc + ((Number(cur.price) || 0) * cur.quantity), 0).toLocaleString()}</span>
                      </div>

                      {/* Coupon validation block */}
                      <div className="flex justify-between text-[#757575] items-center">
                        <div className="flex items-center gap-1.5">
                          <span>Coupon Applied</span>
                          {selectedOrderDetail.couponCode ? (
                            <span className="bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/35 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                              {selectedOrderDetail.couponCode}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#757575] italic">None</span>
                          )}
                        </div>
                        <span className="font-semibold font-mono text-[#C9A227]">
                          {selectedOrderDetail.discount_amount > 0 ? `- Rs. ${selectedOrderDetail.discount_amount.toLocaleString()} (${selectedOrderDetail.discountPercentage || 0}%)` : "Rs. 0"}
                        </span>
                      </div>

                      <div className="flex justify-between text-[#757575]">
                        <span>Express Courier Delivery ({(selectedOrderDetail.paymentMethod || "COD").toUpperCase()})</span>
                        <span className="font-semibold font-mono">FREE SHIPPING</span>
                      </div>

                      <div className="border-t border-stone-200 pt-3.5 flex justify-between items-center">
                        <span className="font-bold text-[#1F4D3A] uppercase tracking-wider text-sm">Total Amount Received</span>
                        <span className="text-lg font-extrabold text-[#1F4D3A] font-mono">Rs. {(selectedOrderDetail.totalPrice || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto border-t border-stone-200 pt-5 text-center text-[10px] text-[#757575] font-light flex-shrink-0">
                <p>Pure Himalayan Botanicals and Premium Kashmir Saffron formulations by Wen.</p>
                <p className="font-mono font-medium text-[#C9A227] mt-1 text-[9.5px]">CONFIDENTIAL RECORDS DISPATCH LOG</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {replyingMessage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0A0D0B]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setReplyingMessage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-[#FBFBEE] w-full h-full md:h-auto md:max-h-[90vh] md:w-[600px] md:rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col font-sans"
            >
              <div className="p-6 md:p-8 bg-white border-b border-[#E8E1D3] flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-[#1F4D3A]" />
                  <h3 className="font-playfair text-xl font-bold text-[#1F4D3A] uppercase tracking-wider">
                    Compose Email Reply
                  </h3>
                </div>
                <button
                  onClick={() => setReplyingMessage(null)}
                  className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors text-[#757575] hover:text-[#2C2C2C]"
                >
                  <ArrowLeft className="w-5 h-5 md:hidden" />
                  <span className="hidden md:inline font-bold text-xs uppercase">Close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] space-y-2 text-xs text-left shadow-sm">
                  <p><strong className="text-[#1F4D3A]">To:</strong> {replyingMessage.name} &lt;{replyingMessage.email}&gt;</p>
                  <p><strong className="text-[#1F4D3A]">Subject:</strong> Re: {replyingMessage.subject}</p>
                </div>
                
                <div className="space-y-2 text-left">
                  <label className="block text-xs font-bold text-[#1F4D3A] uppercase tracking-wider">Message Content</label>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Hello ${replyingMessage.name},\n\nThank you for reaching out...`}
                    rows={8}
                    className="w-full bg-white border border-[#e5e5e5] focus:border-[#C9A227] px-4 py-3 rounded-xl outline-none text-sm resize-none shadow-sm"
                  />
                  <p className="text-[10px] text-[#757575] font-light mt-2">
                    This reply will be sent via Email to the user, formatted with the WEN confirmation template.
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-[#f5f5f5] border-t border-[#E8E1D3] flex justify-end gap-4 mt-auto">
                <button
                  onClick={() => setReplyingMessage(null)}
                  className="px-6 py-3 bg-transparent text-[#757575] hover:bg-gray-200 font-bold text-[10.5px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={isSendingReply || !replyContent.trim()}
                  className="px-6 py-3 bg-[#1F4D3A] hover:bg-[#153427] text-white disabled:opacity-50 font-bold text-[10.5px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md"
                >
                  <Mail className="w-4 h-4" />
                  <span>{isSendingReply ? "Dispatching..." : "Send Reply"}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminPage;
