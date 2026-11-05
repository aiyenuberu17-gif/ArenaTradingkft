import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetBusinessDocumentSettingsQueryKey,
  getListBusinessDocumentsQueryKey,
  useCreateBusinessDocument,
  useDeleteBusinessDocument,
  useGetBusinessDocumentSettings,
  useListBusinessDocuments,
  useUpdateBusinessDocument,
  useUpdateBusinessDocumentSettings,
  useUpdateBusinessDocumentStatus,
} from "@workspace/api-client-react";
import type {
  BusinessDocument,
  BusinessDocumentInput,
  BusinessDocumentItemInput,
  BusinessDocumentSettings,
  BusinessDocumentSettingsInput,
} from "@workspace/api-client-react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  FilePlus2,
  FileText,
  ImagePlus,
  LoaderCircle,
  PackageCheck,
  PackageOpen,
  Printer,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useEffect } from "react";

type DocType = "invoice" | "receipt" | "shipping";
type StatusFilter = "all" | BusinessDocument["status"];

const today = () => new Date().toISOString().slice(0, 10);
const emptyItem = (): BusinessDocumentItemInput => ({
  description: "",
  sku: "",
  quantity: 1,
  unitPrice: 0,
  taxRate: 27,
});
const blankDocument = (type: DocType, currency: string, includeStamp: boolean): BusinessDocumentInput => ({
  documentType: type,
  issueDate: today(),
  dueDate: type === "invoice" ? today() : null,
  customerName: "",
  customerCompany: "",
  customerEmail: "",
  customerPhone: "",
  customerTaxId: "",
  customerAddress: "",
  shipToName: "",
  shipToAddress: "",
  items: [emptyItem()],
  currency: currency || "HUF",
  shippingAmount: 0,
  notes: "",
  terms: "",
  carrier: "",
  service: "",
  trackingNumber: "",
  shippingDate: type === "shipping" ? today() : null,
  packageWeight: null,
  packageLength: null,
  packageWidth: null,
  packageHeight: null,
  paymentMethod: "",
  includeStamp,
});

const typeLabel = (type: DocType) => type === "shipping" ? "Packing slip" : type[0].toUpperCase() + type.slice(1);
const statusLabel = (status: BusinessDocument["status"]) => status[0].toUpperCase() + status.slice(1);
const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "HUF", maximumFractionDigits: 2 }).format(amount || 0);
  } catch {
    return `${(amount || 0).toFixed(2)} ${currency || "HUF"}`;
  }
};
const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const calculateTotals = (items: BusinessDocumentItemInput[], shippingAmount = 0) => {
  let subtotal = 0;
  let tax = 0;
  const lineTotals = items.map((item) => {
    const base = roundCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
    const lineTax = roundCurrency(base * (Number(item.taxRate) || 0) / 100);
    subtotal = roundCurrency(subtotal + base);
    tax = roundCurrency(tax + lineTax);
    return roundCurrency(base + lineTax);
  });
  const shipping = roundCurrency(Number(shippingAmount) || 0);
  return { subtotal, tax, total: roundCurrency(subtotal + tax + shipping), lineTotals };
};
const dateLabel = (date?: string | null) => date ? new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const getErrorText = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";
const toInput = (doc: BusinessDocument): BusinessDocumentInput => ({
  documentType: doc.documentType,
  issueDate: doc.issueDate?.slice(0, 10) || today(),
  dueDate: doc.dueDate?.slice(0, 10) || null,
  customerName: doc.customerName,
  customerCompany: doc.customerCompany || "",
  customerEmail: doc.customerEmail || "",
  customerPhone: doc.customerPhone || "",
  customerTaxId: doc.customerTaxId || "",
  customerAddress: doc.customerAddress,
  shipToName: doc.shipToName || "",
  shipToAddress: doc.shipToAddress || "",
  items: doc.items.map(({ description, sku, quantity, unitPrice, taxRate }) => ({ description, sku, quantity, unitPrice, taxRate })),
  currency: doc.currency,
  shippingAmount: doc.shippingAmount,
  notes: doc.notes,
  terms: doc.terms,
  carrier: doc.carrier,
  service: doc.service,
  trackingNumber: doc.trackingNumber,
  shippingDate: doc.shippingDate?.slice(0, 10) || null,
  packageWeight: doc.packageWeight,
  packageLength: doc.packageLength,
  packageWidth: doc.packageWidth,
  packageHeight: doc.packageHeight,
  paymentMethod: doc.paymentMethod,
  includeStamp: doc.includeStamp,
});

const inputClass = "w-full rounded-lg border border-[#d5e3dc] bg-[#fbfdfb] px-3 py-2.5 text-sm text-[#18362c] outline-none transition placeholder:text-[#93a69d] focus:border-[#14936d] focus:bg-white focus:ring-2 focus:ring-[#14936d]/10 disabled:opacity-55";
const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-[.11em] text-[#71857b]";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block min-w-0 ${className}`}><span className={labelClass}>{label}</span>{children}</label>;
}

function StatusPill({ status }: { status: BusinessDocument["status"] }) {
  return <span data-testid={`status-document-${status}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] status-${status}`}><i />{statusLabel(status)}</span>;
}

function DocumentPaper({ document, settings, number, status }: { document: BusinessDocumentInput; settings?: BusinessDocumentSettings | null; number: string; status: BusinessDocument["status"] }) {
  const totals = calculateTotals(document.items, Number(document.shippingAmount) || 0);
  const label = typeLabel(document.documentType);
  const totalLabel = document.documentType === "receipt" ? "Amount received" : document.documentType === "shipping" ? "Declared value" : "Total due";
  return (
    <article className="document-print-target relative mx-auto min-h-[790px] w-full max-w-[760px] overflow-hidden bg-white px-7 py-8 text-[#18362c] shadow-[0_14px_50px_rgba(19,62,44,.11)] sm:px-11 sm:py-12" data-testid="document-print-layout" style={{ "--doc-brand": settings?.brandColor || "#087b59" } as React.CSSProperties}>
      <div className="absolute inset-x-0 top-0 h-2 bg-[var(--doc-brand)]" />
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[#e7eee9] pb-7">
        <div className="flex items-start gap-4">
          <img src={settings?.logoUrl || "/brand/arena-trading-dark.svg"} alt={`${settings?.companyName || "Arena Trading"} logo`} className="h-14 max-w-[180px] object-contain object-left" data-testid="img-document-logo" />
          <div className="pt-1">
            <p className="text-base font-extrabold tracking-[-.04em]">{settings?.companyName || "Arena Trading"}</p>
            {settings?.legalName && <p className="mt-0.5 text-[11px] text-[#708078]">{settings.legalName}</p>}
            <p className="mt-2 max-w-[265px] whitespace-pre-line text-[11px] leading-[1.65] text-[#64766e]">{[settings?.address, [settings?.postalCode, settings?.city].filter(Boolean).join(" "), settings?.country].filter(Boolean).join("\n")}</p>
            <p className="mt-1 text-[10px] leading-5 text-[#718078]">{[settings?.email, settings?.phone, settings?.website].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <div className="min-w-[160px] text-left sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--doc-brand)]">Business document</p>
          <h2 className="mt-2 text-[28px] font-extrabold leading-none tracking-[-.06em]">{label}</h2>
          <p className="mt-2 font-mono text-xs text-[#6d7d75]">{number} · {statusLabel(status)}</p>
        </div>
      </header>
      <section className="grid gap-6 py-7 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#82928a]">Bill to</p>
          <p className="mt-2 text-sm font-bold">{document.customerName || "Customer name"}</p>
          {document.customerCompany && <p className="text-xs text-[#5d7067]">{document.customerCompany}</p>}
          <p className="mt-1 whitespace-pre-line text-xs leading-5 text-[#5d7067]">{document.customerAddress || "Customer address"}</p>
          <p className="mt-1 text-xs text-[#5d7067]">{[document.customerEmail, document.customerPhone].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-7 gap-y-3 sm:min-w-[220px]">
          <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#82928a]">Document no.</p><p className="mt-1 font-mono text-xs font-bold">{number}</p></div>
          <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#82928a]">Issue date</p><p className="mt-1 text-xs">{dateLabel(document.issueDate)}</p></div>
          {document.dueDate && <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#82928a]">Due date</p><p className="mt-1 text-xs">{dateLabel(document.dueDate)}</p></div>}
          {settings?.taxId && <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#82928a]">Tax ID</p><p className="mt-1 text-xs">{settings.taxId}</p></div>}
        </div>
      </section>
      {document.documentType === "shipping" && <section className="mb-6 grid gap-4 rounded-lg bg-[#f4f8f5] p-4 sm:grid-cols-2"><div><p className="text-[9px] font-bold uppercase tracking-[.13em] text-[#82928a]">Ship to</p><p className="mt-1 text-xs font-bold">{document.shipToName || document.customerName || "Recipient"}</p><p className="mt-1 whitespace-pre-line text-xs leading-5 text-[#5d7067]">{document.shipToAddress || document.customerAddress || "Delivery address"}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[.13em] text-[#82928a]">Fulfilment</p><p className="mt-1 text-xs text-[#5d7067]">{[document.carrier, document.service].filter(Boolean).join(" · ") || "Carrier / service"}</p>{document.trackingNumber && <p className="mt-1 font-mono text-[11px]">{document.trackingNumber}</p>}</div></section>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[490px] border-collapse text-left">
          <thead><tr className="border-y border-[#dfe9e2] text-[9px] font-bold uppercase tracking-[.1em] text-[#718078]"><th className="py-3 pr-2">Description</th><th className="py-3 px-2 text-right">Qty</th><th className="py-3 px-2 text-right">Unit price</th><th className="py-3 px-2 text-right">Tax</th><th className="py-3 pl-2 text-right">Amount</th></tr></thead>
          <tbody>{document.items.map((item, index) => <tr className="border-b border-[#edf2ee] text-xs" key={`${index}-${item.description}`}><td className="py-3 pr-2"><p className="font-semibold">{item.description || "Item description"}</p>{item.sku && <p className="mt-0.5 font-mono text-[9px] text-[#82928a]">SKU {item.sku}</p>}</td><td className="px-2 py-3 text-right tabular-nums">{item.quantity}</td><td className="px-2 py-3 text-right tabular-nums">{money(item.unitPrice, document.currency)}</td><td className="px-2 py-3 text-right tabular-nums">{item.taxRate}%</td><td className="pl-2 py-3 text-right font-semibold tabular-nums">{money(totals.lineTotals[index] || 0, document.currency)}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="ml-auto mt-5 w-full max-w-[260px] space-y-2 text-xs">
        <div className="flex justify-between text-[#66776f]"><span>Net subtotal</span><span>{money(totals.subtotal, document.currency)}</span></div>
        <div className="flex justify-between text-[#66776f]"><span>Tax</span><span>{money(totals.tax, document.currency)}</span></div>
        {Number(document.shippingAmount) > 0 && <div className="flex justify-between text-[#66776f]"><span>Shipping</span><span>{money(Number(document.shippingAmount), document.currency)}</span></div>}
        <div className="flex justify-between border-t border-[#dfe9e2] pt-3 text-sm font-extrabold"><span>{totalLabel}</span><span className="text-[var(--doc-brand)]">{money(totals.total, document.currency)}</span></div>
      </div>
      {(document.paymentMethod || document.notes || document.terms || settings?.paymentInstructions) && <section className="mt-8 grid gap-5 border-t border-[#e7eee9] pt-5 sm:grid-cols-2">{document.paymentMethod && <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#82928a]">Payment method</p><p className="mt-1 text-xs">{document.paymentMethod}</p></div>}{settings?.paymentInstructions && document.documentType === "invoice" && <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#82928a]">Payment instructions</p><p className="mt-1 whitespace-pre-line text-xs leading-5 text-[#5d7067]">{settings.paymentInstructions}</p></div>}{document.notes && <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#82928a]">Notes</p><p className="mt-1 whitespace-pre-line text-xs leading-5 text-[#5d7067]">{document.notes}</p></div>}{document.terms && <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#82928a]">Terms</p><p className="mt-1 whitespace-pre-line text-xs leading-5 text-[#5d7067]">{document.terms}</p></div>}</section>}
      <footer className="mt-10 flex items-end justify-between gap-4 border-t border-[#e7eee9] pt-4">
        <p className="max-w-[430px] text-[9px] leading-4 text-[#89978f]">{settings?.footerNote || "Thank you for your business."}<br />{[settings?.registrationNumber && `Reg. ${settings.registrationNumber}`, settings?.taxId && `Tax ID ${settings.taxId}`].filter(Boolean).join(" · ")}</p>
        {document.includeStamp && settings?.stampUrl && <img src={settings.stampUrl} alt="Company stamp" className="h-16 max-w-[100px] object-contain" data-testid="img-document-stamp" />}
      </footer>
    </article>
  );
}

function ShippingLabel({ document, settings, number }: { document: BusinessDocumentInput; settings?: BusinessDocumentSettings | null; number: string }) {
  return (
    <article className="shipping-label-print-target rounded-xl border border-[#dce8df] bg-white p-5 text-[#18362c] shadow-[0_12px_35px_rgba(19,62,44,.09)]" data-testid="shipping-label-preview">
      <div className="mx-auto flex min-h-[520px] max-w-[380px] flex-col border-2 border-[#18362c] p-4">
        <header className="flex items-start justify-between gap-3 border-b-2 border-[#18362c] pb-3">
          <img src={settings?.logoUrl || "/brand/arena-trading-dark.svg"} alt={`${settings?.companyName || "Arena Trading"} logo`} className="h-9 max-w-[150px] object-contain object-left" />
          <span className="rounded bg-[#0b684d] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.15em] text-white">Shipping label</span>
        </header>
        <div className="border-b border-dashed border-[#96a69b] py-3 text-[10px] leading-4 text-[#63766b]">
          <p className="font-bold uppercase tracking-[.13em] text-[#82928a]">From</p>
          <p className="mt-1 font-semibold text-[#18362c]">{settings?.companyName || "Arena Trading Kft"}</p>
          <p>{[settings?.address, [settings?.postalCode, settings?.city].filter(Boolean).join(" "), settings?.country].filter(Boolean).join(", ")}</p>
        </div>
        <div className="flex-1 py-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#0b684d]">Deliver to</p>
          <h2 className="mt-2 break-words text-[24px] font-extrabold leading-tight tracking-[-.04em]">{document.shipToName || document.customerName || "Recipient"}</h2>
          <p className="mt-3 whitespace-pre-line break-words text-[15px] font-medium leading-6">{document.shipToAddress || document.customerAddress || "Delivery address"}</p>
          {document.customerPhone && <p className="mt-3 text-xs text-[#63766b]">Phone · {document.customerPhone}</p>}
        </div>
        <div className="border-t-2 border-[#18362c] pt-3">
          <div className="flex justify-between gap-3 text-[10px]"><span className="font-bold uppercase tracking-[.1em] text-[#82928a]">Carrier / service</span><span className="text-right font-bold">{[document.carrier, document.service].filter(Boolean).join(" · ") || "To be confirmed"}</span></div>
          <div className="mt-2 flex justify-between gap-3 text-[10px]"><span className="font-bold uppercase tracking-[.1em] text-[#82928a]">Shipment</span><span className="text-right font-mono font-bold">{number}</span></div>
          {document.trackingNumber && <div className="mt-3 border-y border-[#e4ece6] py-2"><p className="text-[9px] font-bold uppercase tracking-[.13em] text-[#82928a]">Tracking reference</p><p className="mt-1 break-all font-mono text-sm font-extrabold tracking-[.08em]">{document.trackingNumber}</p></div>}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-[#63766b]"><span>Ship date · {dateLabel(document.shippingDate)}</span><span className="text-right">Weight · {document.packageWeight ? `${document.packageWeight} kg` : "—"}</span><span>Packages · 1</span><span className="text-right">Ref · {number}</span></div>
          <div className="mt-3 h-8 w-full border border-[#dce8df]" aria-hidden="true" style={{ background: "repeating-linear-gradient(90deg,#18362c 0 2px,transparent 2px 4px,#18362c 4px 5px,transparent 5px 8px)" }} />
          <p className="mt-1 text-center font-mono text-[9px] tracking-[.2em] text-[#63766b]">{document.trackingNumber || number}</p>
          <p className="mt-1 text-center text-[8px] text-[#89978f]">Reference graphic only · no carrier barcode generated</p>
        </div>
      </div>
      <p className="shipping-label-disclaimer mt-3 text-center text-[10px] text-[#83948a]">Printable template only. Carrier booking and postage are not included.</p>
    </article>
  );
}

export default function BusinessDocumentsStudio() {
  const queryClient = useQueryClient();
  const settingsQuery = useGetBusinessDocumentSettings();
  const documentsQuery = useListBusinessDocuments();
  const updateSettings = useUpdateBusinessDocumentSettings();
  const createDocument = useCreateBusinessDocument();
  const updateDocument = useUpdateBusinessDocument();
  const deleteDocument = useDeleteBusinessDocument();
  const updateStatus = useUpdateBusinessDocumentStatus();
  const settings = settingsQuery.data;
  const documents = documentsQuery.data || [];

  const [mode, setMode] = useState<"list" | "editor" | "settings">("list");
  const [active, setActive] = useState<BusinessDocument | null>(null);
  const [draft, setDraft] = useState<BusinessDocumentInput | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [settingsForm, setSettingsForm] = useState<BusinessDocumentSettingsInput | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [operationError, setOperationError] = useState("");
  const [uploading, setUploading] = useState<"logo" | "stamp" | "">("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (settings && !settingsForm) setSettingsForm({ ...settings });
  }, [settings, settingsForm]);

  const filtered = useMemo(() => documents.filter((doc) => {
    const term = search.trim().toLowerCase();
    const matchesTerm = !term || [doc.number, doc.customerName, doc.customerCompany || "", doc.customerEmail || ""].some((value) => value.toLowerCase().includes(term));
    return matchesTerm && (typeFilter === "all" || doc.documentType === typeFilter) && (statusFilter === "all" || doc.status === statusFilter);
  }), [documents, search, typeFilter, statusFilter]);
  const counts = useMemo(() => ({
    total: documents.length,
    drafts: documents.filter((doc) => doc.status === "draft").length,
    issued: documents.filter((doc) => !["draft", "void"].includes(doc.status)).length,
  }), [documents]);
  const totals = useMemo(() => {
    if (!draft) return { subtotal: 0, tax: 0, total: 0 };
    return calculateTotals(draft.items, Number(draft.shippingAmount) || 0);
  }, [draft]);

  const refreshDocuments = () => queryClient.invalidateQueries({ queryKey: getListBusinessDocumentsQueryKey() });
  const notifyError = (error: unknown) => { setOperationError(getErrorText(error)); setSaveMessage(""); };
  const startDocument = (type: DocType) => {
    setOperationError("");
    setSaveMessage("");
    createDocument.mutate({ data: blankDocument(type, settings?.currency || "HUF", settings?.includeStampByDefault || false) }, {
      onSuccess: (created) => {
        void refreshDocuments();
        setActive(created);
        setDraft(toInput(created));
        setMode("editor");
      },
      onError: notifyError,
    });
  };
  const openDocument = (doc: BusinessDocument) => {
    setOperationError("");
    setSaveMessage("");
    setConfirmDelete(false);
    setActive(doc);
    setDraft(toInput(doc));
    setMode("editor");
  };
  const saveDraft = () => {
    if (!active || active.status !== "draft" || !draft) return;
    if (!draft.customerName.trim()) { setOperationError("Add a customer name before saving."); return; }
    if (!draft.items.length || draft.items.some((item) => !item.description.trim())) { setOperationError("Every line item needs a description."); return; }
    setOperationError("");
    updateDocument.mutate({ id: active.id, data: draft }, {
      onSuccess: (updated) => {
        void refreshDocuments();
        setActive(updated);
        setDraft(toInput(updated));
        setSaveMessage("Draft saved");
      },
      onError: notifyError,
    });
  };
  const transition = (status: "issued" | "paid" | "shipped" | "delivered") => {
    if (!active) return;
    updateStatus.mutate({ id: active.id, data: { status } }, {
      onSuccess: (updated) => {
        void refreshDocuments();
        setActive(updated);
        setSaveMessage(`Marked ${statusLabel(updated.status).toLowerCase()}`);
      },
      onError: notifyError,
    });
  };
  const issueDraft = async () => {
    if (!active || !draft || active.status !== "draft") return;
    if (!draft.customerName.trim()) { setOperationError("Add a customer name before issuing."); return; }
    if (!draft.items.length || draft.items.some((item) => !item.description.trim())) { setOperationError("Every line item needs a description."); return; }
    setOperationError("");
    try {
      const saved = await updateDocument.mutateAsync({ id: active.id, data: draft });
      const issued = await updateStatus.mutateAsync({ id: saved.id, data: { status: "issued" } });
      void refreshDocuments();
      setActive(issued);
      setDraft(toInput(issued));
      setSaveMessage("Document issued");
    } catch (error) {
      notifyError(error);
    }
  };
  const removeDraft = () => {
    if (!active || active.status !== "draft") return;
    deleteDocument.mutate({ id: active.id }, {
      onSuccess: () => {
        void refreshDocuments();
        setActive(null);
        setDraft(null);
        setMode("list");
        setConfirmDelete(false);
      },
      onError: notifyError,
    });
  };
  const saveSettings = () => {
    if (!settingsForm) return;
    setOperationError("");
    updateSettings.mutate({ data: settingsForm }, {
      onSuccess: (saved) => {
        void queryClient.invalidateQueries({ queryKey: getGetBusinessDocumentSettingsQueryKey() });
        setSettingsForm({ ...saved });
        setSaveMessage("Brand settings saved");
      },
      onError: notifyError,
    });
  };
  const uploadImage = async (kind: "logo" | "stamp", file?: File) => {
    if (!file || !settingsForm) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setOperationError("Choose a PNG, JPG, WEBP, or GIF image under 5 MB.");
      return;
    }
    setUploading(kind);
    setOperationError("");
    try {
      const response = await fetch("/api/uploads/document-branding-image", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Image upload failed. Please try again.");
      const result = await response.json() as { imagePath: string };
      setSettingsForm((current) => current ? { ...current, [kind === "logo" ? "logoUrl" : "stampUrl"]: result.imagePath } : current);
    } catch (error) {
      notifyError(error);
    } finally {
      setUploading("");
    }
  };
  const changeDraft = <K extends keyof BusinessDocumentInput>(key: K, value: BusinessDocumentInput[K]) => setDraft((current) => current ? { ...current, [key]: value } : current);
  const changeItem = (index: number, key: keyof BusinessDocumentItemInput, value: string) => setDraft((current) => current ? ({
    ...current,
    items: current.items.map((item, itemIndex) => itemIndex !== index ? item : {
      ...item,
      [key]: key === "description" || key === "sku" ? value : Number(value) || 0,
    }),
  }) : current);
  const printDocument = (target: "document" | "label") => {
    const studio = document.querySelector<HTMLElement>('[data-testid="business-documents-studio"]');
    if (!studio) return;
    studio.classList.add(target === "label" ? "print-label" : "print-document");
    window.print();
    studio.classList.remove("print-label", "print-document");
  };

  const busy = createDocument.isPending || updateDocument.isPending || updateStatus.isPending || deleteDocument.isPending;
  const settingBusy = updateSettings.isPending;

  return (
    <section className="business-docs-studio mt-12 overflow-hidden rounded-[22px] border border-[#d7e5dc] bg-[#f6faf7] text-[#17372b] shadow-[0_18px_60px_rgba(16,62,43,.08)]" data-testid="business-documents-studio">
      <style>{`
        .business-docs-studio{--forest:#0b684d;--mint:#e8f3ec;--ink:#17372b}
        .business-docs-studio button{transition:transform .18s ease,background-color .18s ease,border-color .18s ease,color .18s ease}
        .business-docs-studio button:not(:disabled):active{transform:translateY(1px)}
        .business-docs-studio .status-draft{background:#f1eee4;color:#80662a}.status-draft i{background:#b18d3d}
        .business-docs-studio .status-issued{background:#e8f1eb;color:#26744f}.status-issued i{background:#3c9a6a}
        .business-docs-studio .status-paid{background:#e2f3e9;color:#137447}.status-paid i{background:#14945c}
        .business-docs-studio .status-shipped{background:#e8efed;color:#3f7563}.status-shipped i{background:#4a8e75}
        .business-docs-studio .status-delivered{background:#e2f4ee;color:#18745d}.status-delivered i{background:#1b9a76}
        .business-docs-studio .status-void{background:#f5e9e7;color:#9b5147}.status-void i{background:#bb665b}
        .business-docs-studio [class^="status-"] i{width:6px;height:6px;border-radius:50%}
        @media print{
          @page{size:A4;margin:10mm}
          @page shipping-label{size:100mm 150mm;margin:0}
          body *{visibility:hidden!important}
          .business-docs-studio.print-document,
          .business-docs-studio.print-label{overflow:visible!important;border:0!important;box-shadow:none!important;background:transparent!important}
          .business-docs-studio.print-document .document-print-target,
          .business-docs-studio.print-document .document-print-target *{visibility:visible!important}
          .business-docs-studio.print-document .document-print-target{position:absolute!important;inset:0!important;width:100%!important;max-width:none!important;min-height:0!important;padding:8mm!important;box-shadow:none!important}
          .business-docs-studio.print-document .shipping-label-print-target{display:none!important}
          .business-docs-studio.print-label .shipping-label-print-target{display:block!important;visibility:visible!important}
          .business-docs-studio.print-label .shipping-label-print-target *{visibility:visible!important}
          .business-docs-studio.print-label .shipping-label-print-target{position:absolute!important;inset:0!important;width:100mm!important;height:150mm!important;max-width:none!important;padding:0!important;border:0!important;box-shadow:none!important;page:shipping-label}
          .business-docs-studio.print-label .shipping-label-print-target>div{min-height:150mm!important;max-width:none!important;border:0!important}
          .business-docs-studio.print-label .shipping-label-disclaimer{display:none!important}
          .business-docs-studio.print-label .document-print-target{display:none!important}
          .business-docs-studio img{print-color-adjust:exact;-webkit-print-color-adjust:exact}
        }
      `}</style>
      <div className="relative overflow-hidden bg-[#0b684d] px-5 py-6 text-white sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-10 top-8 h-36 w-36 rounded-full border border-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#b6deca]"><span className="grid h-6 w-6 place-items-center rounded-md bg-white/10"><ClipboardList size={14} /></span> Arena Trading · Admin</div>
            <h2 className="mt-3 font-display text-[clamp(1.65rem,3vw,2.35rem)] font-extrabold leading-none tracking-[-.055em]">Document studio</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#d5eae0]">Build branded invoices, receipts and fulfilment documents from one clear workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setMode("list"); setActive(null); setDraft(null); setOperationError(""); }} className={`rounded-lg px-3.5 py-2.5 text-xs font-bold ${mode === "list" ? "bg-white text-[#0b684d]" : "border border-white/20 bg-white/5 text-white hover:bg-white/10"}`} data-testid="button-documents-list"><FileText size={14} className="mr-1.5 inline" />Documents</button>
            <button type="button" onClick={() => { setMode("settings"); setOperationError(""); setSaveMessage(""); }} className={`rounded-lg px-3.5 py-2.5 text-xs font-bold ${mode === "settings" ? "bg-white text-[#0b684d]" : "border border-white/20 bg-white/5 text-white hover:bg-white/10"}`} data-testid="button-document-settings"><Settings2 size={14} className="mr-1.5 inline" />Brand settings</button>
          </div>
        </div>
      </div>

      {operationError && <div role="alert" className="mx-5 mt-5 flex items-start gap-2 rounded-lg border border-[#f0d0c8] bg-[#fff6f3] px-3.5 py-3 text-sm text-[#9a4639] sm:mx-8" data-testid="alert-document-error"><AlertCircle size={17} className="mt-0.5 shrink-0" />{operationError}<button type="button" className="ml-auto" aria-label="Dismiss error" onClick={() => setOperationError("")} data-testid="button-dismiss-document-error"><X size={16} /></button></div>}

      {mode === "settings" ? (
        <div className="p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div><button type="button" onClick={() => setMode("list")} className="mb-3 flex items-center gap-1 text-xs font-bold text-[#50806a] hover:text-[#0b684d]" data-testid="button-settings-back"><ArrowLeft size={14} /> Back to documents</button><h3 className="text-xl font-extrabold tracking-[-.04em]">Company identity & defaults</h3><p className="mt-1 text-sm text-[#72847a]">These details are captured on each new document.</p></div>
            <button type="button" onClick={saveSettings} disabled={!settingsForm || settingBusy} className="rounded-lg bg-[#0b684d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#09583f] disabled:opacity-50" data-testid="button-save-document-settings">{settingBusy ? <LoaderCircle size={15} className="mr-2 inline animate-spin" /> : <Check size={15} className="mr-2 inline" />}{settingBusy ? "Saving…" : "Save settings"}</button>
          </div>
          {settingsQuery.isLoading ? <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-[#e8f0ea]" />)}</div> :
            settingsQuery.isError ? <div className="rounded-xl border border-[#ead8cc] bg-[#fffaf5] p-6 text-sm text-[#815c3d]"><p className="font-bold">Company settings could not be loaded.</p><button type="button" onClick={() => void settingsQuery.refetch()} className="mt-3 inline-flex items-center gap-2 font-bold text-[#0b684d]" data-testid="button-retry-document-settings"><RefreshCw size={14} /> Try again</button></div> :
              settingsForm && <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
                <div className="space-y-6">
                  <div className="rounded-xl border border-[#dce8df] bg-white p-5 sm:p-6">
                    <h4 className="mb-4 text-sm font-extrabold">Company details</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {([["companyName", "Display name"], ["legalName", "Legal entity"], ["address", "Street address"], ["city", "City"], ["postalCode", "Postal code"], ["country", "Country"], ["phone", "Phone"], ["email", "Email"], ["website", "Website"], ["taxId", "Tax ID"], ["registrationNumber", "Registration number"], ["currency", "Default currency"]] as const).map(([key, label]) => <Field key={key} label={label}><input className={inputClass} value={settingsForm[key]} onChange={(e) => setSettingsForm({ ...settingsForm, [key]: e.target.value })} data-testid={`input-doc-setting-${key}`} /></Field>)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#dce8df] bg-white p-5 sm:p-6">
                    <h4 className="mb-4 text-sm font-extrabold">Document defaults</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {([["invoicePrefix", "Invoice prefix"], ["receiptPrefix", "Receipt prefix"], ["shippingPrefix", "Packing slip prefix"]] as const).map(([key, label]) => <Field key={key} label={label}><input className={inputClass} maxLength={12} value={settingsForm[key]} onChange={(e) => setSettingsForm({ ...settingsForm, [key]: e.target.value })} data-testid={`input-doc-setting-${key}`} /></Field>)}
                      <Field label="Brand colour"><div className="flex gap-2"><input type="color" className="h-[42px] w-12 cursor-pointer rounded-lg border border-[#d5e3dc] bg-white p-1" value={settingsForm.brandColor || "#087b59"} onChange={(e) => setSettingsForm({ ...settingsForm, brandColor: e.target.value })} data-testid="input-doc-setting-brandColor" /><input className={inputClass} value={settingsForm.brandColor} onChange={(e) => setSettingsForm({ ...settingsForm, brandColor: e.target.value })} /></div></Field>
                      <Field label="Payment instructions" className="sm:col-span-2"><textarea rows={3} className={inputClass} value={settingsForm.paymentInstructions} onChange={(e) => setSettingsForm({ ...settingsForm, paymentInstructions: e.target.value })} data-testid="input-doc-setting-paymentInstructions" /></Field>
                      <Field label="Footer note" className="sm:col-span-2"><textarea rows={2} className={inputClass} value={settingsForm.footerNote} onChange={(e) => setSettingsForm({ ...settingsForm, footerNote: e.target.value })} data-testid="input-doc-setting-footerNote" /></Field>
                    </div>
                  </div>
                </div>
                <aside className="space-y-4">
                  {(["logo", "stamp"] as const).map((kind) => {
                    const key = kind === "logo" ? "logoUrl" : "stampUrl";
                    return <div key={kind} className="rounded-xl border border-[#dce8df] bg-white p-5">
                      <div className="flex items-start justify-between"><div><h4 className="text-sm font-extrabold">{kind === "logo" ? "Company logo" : "Company stamp"}</h4><p className="mt-1 text-xs leading-5 text-[#75877d]">{kind === "logo" ? "Displayed in the document header." : "Optional mark for documents that need it."}</p></div><ImagePlus size={18} className="text-[#268463]" /></div>
                      <div className="mt-4 grid h-24 place-items-center overflow-hidden rounded-lg border border-dashed border-[#cdded2] bg-[#f7faf7]">{settingsForm[key] || kind === "logo" ? <img src={settingsForm[key] || "/brand/arena-trading-dark.svg"} alt={`${kind} preview`} className="max-h-20 max-w-[85%] object-contain" data-testid={`img-document-setting-${kind}`} /> : <span className="text-xs text-[#93a49b]">No stamp uploaded</span>}</div>
                      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#d3e2d8] px-3 py-2.5 text-xs font-bold text-[#376d56] hover:bg-[#f2f8f3]" data-testid={`label-upload-document-${kind}`}>
                        {uploading === kind ? <LoaderCircle size={14} className="animate-spin" /> : <ImagePlus size={14} />}{uploading === kind ? "Uploading…" : `Upload ${kind}`}
                        <input type="file" accept=".png,.jpg,.jpeg,.webp,.gif" className="sr-only" disabled={!!uploading} onChange={(e) => { void uploadImage(kind, e.target.files?.[0]); e.currentTarget.value = ""; }} data-testid={`input-upload-document-${kind}`} />
                      </label>
                      {settingsForm[key] && <button type="button" onClick={() => setSettingsForm({ ...settingsForm, [key]: "" })} className="mt-2 w-full text-xs font-semibold text-[#9b6258] hover:text-[#873b32]" data-testid={`button-remove-document-${kind}`}>{kind === "logo" ? "Use Arena Trading logo" : "Remove stamp"}</button>}
                    </div>;
                  })}
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#dce8df] bg-white p-4" data-testid="label-default-stamp">
                    <input type="checkbox" checked={settingsForm.includeStampByDefault} onChange={(e) => setSettingsForm({ ...settingsForm, includeStampByDefault: e.target.checked })} className="h-4 w-4 accent-[#0b684d]" data-testid="input-default-document-stamp" />
                    <span><span className="block text-sm font-bold">Include stamp by default</span><span className="mt-0.5 block text-xs text-[#75877d]">Can be changed per document.</span></span>
                  </label>
                </aside>
              </div>}
          {saveMessage && <p role="status" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#168154]" data-testid="status-document-settings-saved"><Check size={16} />{saveMessage}</p>}
        </div>
      ) : mode === "editor" && draft && active ? (
        <div className="p-4 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3"><button type="button" onClick={() => { setMode("list"); setActive(null); setDraft(null); }} className="grid h-9 w-9 place-items-center rounded-lg border border-[#d7e5dc] bg-white text-[#456e5b] hover:bg-[#edf5ef]" aria-label="Back to list" data-testid="button-editor-back"><ArrowLeft size={17} /></button><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold tracking-[-.04em]">{active.status === "draft" ? "Draft editor" : "Document preview"}</h3><StatusPill status={active.status} /></div><p className="mt-0.5 text-xs text-[#7c8d83]">{typeLabel(active.documentType)} <span className="mx-1.5">·</span><span className="font-mono">{active.number}</span></p></div></div>
            <div className="flex flex-wrap gap-2">
              {active.status === "draft" && <button type="button" onClick={saveDraft} disabled={busy} className="rounded-lg bg-[#0b684d] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#09583f] disabled:opacity-50" data-testid="button-save-document-draft">{updateDocument.isPending ? <LoaderCircle size={14} className="mr-1.5 inline animate-spin" /> : <Check size={14} className="mr-1.5 inline" />}{updateDocument.isPending ? "Saving…" : "Save draft"}</button>}
              {active.documentType === "shipping" ? <>
                <button type="button" onClick={() => printDocument("document")} className="rounded-lg border border-[#d5e3dc] bg-white px-3.5 py-2.5 text-xs font-bold text-[#376d56] hover:bg-[#f0f7f2]" data-testid="button-print-document"><Printer size={14} className="mr-1.5 inline" />Print packing slip</button>
                <button type="button" onClick={() => printDocument("label")} className="rounded-lg bg-[#0b684d] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#09583f]" data-testid="button-print-shipping-label"><Truck size={14} className="mr-1.5 inline" />Print shipping label</button>
              </> : <button type="button" onClick={() => printDocument("document")} className="rounded-lg border border-[#d5e3dc] bg-white px-3.5 py-2.5 text-xs font-bold text-[#376d56] hover:bg-[#f0f7f2]" data-testid="button-print-document"><Printer size={14} className="mr-1.5 inline" />Print / PDF</button>}
              {active.status === "draft" ? <button type="button" onClick={() => setConfirmDelete(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#f0d9d4] bg-white text-[#a2574c] hover:bg-[#fff7f5]" title="Delete draft" data-testid="button-delete-document-draft"><Trash2 size={15} /></button> : null}
            </div>
          </div>
          {saveMessage && <p role="status" className="mb-4 flex items-center gap-2 text-xs font-bold text-[#168154]" data-testid="status-document-save"><Check size={14} />{saveMessage}</p>}
          {confirmDelete && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#efd2cc] bg-[#fff7f5] px-4 py-3 text-sm text-[#8d4f45]" data-testid="dialog-delete-document"><span>Delete this draft? This cannot be undone.</span><span className="flex gap-2"><button type="button" onClick={() => setConfirmDelete(false)} className="rounded-md border border-[#e5c5bf] px-3 py-1.5 text-xs font-bold" data-testid="button-cancel-delete-document">Cancel</button><button type="button" onClick={removeDraft} disabled={deleteDocument.isPending} className="rounded-md bg-[#a54d40] px-3 py-1.5 text-xs font-bold text-white" data-testid="button-confirm-delete-document">{deleteDocument.isPending ? "Deleting…" : "Delete draft"}</button></span></div>}
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(390px,.95fr)]">
            <div className="space-y-4">
              {active.status === "draft" ? <>
                <section className="rounded-xl border border-[#dce8df] bg-white p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between"><h4 className="text-sm font-extrabold">Document & customer</h4><span className="rounded-md bg-[#edf5ef] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#4b7961]">Editable draft</span></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Document type"><select className={inputClass} value={draft.documentType} disabled title="Document type is fixed when the draft is created." data-testid="select-document-type">{(["invoice", "receipt", "shipping"] as const).map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}</select></Field>
                    <Field label="Currency"><input className={inputClass} maxLength={3} value={draft.currency} onChange={(e) => changeDraft("currency", e.target.value.toUpperCase())} data-testid="input-document-currency" /></Field>
                    <Field label="Issue date"><input type="date" className={inputClass} value={draft.issueDate} onChange={(e) => changeDraft("issueDate", e.target.value)} data-testid="input-document-issue-date" /></Field>
                    {draft.documentType === "invoice" && <Field label="Due date"><input type="date" className={inputClass} value={draft.dueDate || ""} onChange={(e) => changeDraft("dueDate", e.target.value || null)} data-testid="input-document-due-date" /></Field>}
                    <Field label="Customer name"><input className={inputClass} value={draft.customerName} onChange={(e) => changeDraft("customerName", e.target.value)} placeholder="Full name" data-testid="input-document-customer-name" /></Field>
                    <Field label="Company"><input className={inputClass} value={draft.customerCompany || ""} onChange={(e) => changeDraft("customerCompany", e.target.value)} data-testid="input-document-customer-company" /></Field>
                    <Field label="Customer email"><input type="email" className={inputClass} value={draft.customerEmail || ""} onChange={(e) => changeDraft("customerEmail", e.target.value)} data-testid="input-document-customer-email" /></Field>
                    <Field label="Phone"><input className={inputClass} value={draft.customerPhone || ""} onChange={(e) => changeDraft("customerPhone", e.target.value)} data-testid="input-document-customer-phone" /></Field>
                    <Field label="Tax ID"><input className={inputClass} value={draft.customerTaxId || ""} onChange={(e) => changeDraft("customerTaxId", e.target.value)} data-testid="input-document-customer-taxid" /></Field>
                    <Field label="Billing address" className="sm:col-span-2"><textarea rows={2} className={inputClass} value={draft.customerAddress} onChange={(e) => changeDraft("customerAddress", e.target.value)} data-testid="input-document-customer-address" /></Field>
                  </div>
                </section>
                <section className="rounded-xl border border-[#dce8df] bg-white p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between"><div><h4 className="text-sm font-extrabold">Line items</h4><p className="mt-0.5 text-xs text-[#809087]">Totals recalculate as you edit.</p></div><button type="button" onClick={() => changeDraft("items", [...draft.items, emptyItem()])} className="rounded-lg border border-[#cfe0d5] px-3 py-2 text-xs font-bold text-[#287454] hover:bg-[#eff7f1]" data-testid="button-add-document-item"><FilePlus2 size={14} className="mr-1 inline" />Add item</button></div>
                  <div className="space-y-3">
                    {draft.items.map((item, index) => <div key={index} className="grid gap-2 rounded-lg bg-[#f7faf7] p-3 sm:grid-cols-[1.5fr_.65fr_.55fr_.75fr_.55fr_30px] sm:items-end" data-testid={`row-document-item-${index}`}>
                      <Field label="Description"><input className={inputClass} value={item.description} onChange={(e) => changeItem(index, "description", e.target.value)} placeholder="Product or service" data-testid={`input-document-item-description-${index}`} /></Field>
                      <Field label="SKU"><input className={inputClass} value={item.sku || ""} onChange={(e) => changeItem(index, "sku", e.target.value)} data-testid={`input-document-item-sku-${index}`} /></Field>
                      <Field label="Qty"><input type="number" min="0.01" step="any" className={inputClass} value={item.quantity} onChange={(e) => changeItem(index, "quantity", e.target.value)} data-testid={`input-document-item-quantity-${index}`} /></Field>
                      <Field label="Price"><input type="number" min="0" step="any" className={inputClass} value={item.unitPrice} onChange={(e) => changeItem(index, "unitPrice", e.target.value)} data-testid={`input-document-item-price-${index}`} /></Field>
                      <Field label="Tax %"><input type="number" min="0" max="100" step="any" className={inputClass} value={item.taxRate} onChange={(e) => changeItem(index, "taxRate", e.target.value)} data-testid={`input-document-item-tax-${index}`} /></Field>
                      <button type="button" disabled={draft.items.length <= 1} onClick={() => changeDraft("items", draft.items.filter((_, itemIndex) => itemIndex !== index))} className="grid h-10 w-8 place-items-center text-[#a15e52] disabled:opacity-30" aria-label={`Remove line item ${index + 1}`} data-testid={`button-remove-document-item-${index}`}><X size={16} /></button>
                    </div>)}
                  </div>
                  <div className="mt-4 ml-auto max-w-[280px] space-y-1.5 border-t border-[#e4ece6] pt-3 text-xs">
                    <div className="flex justify-between text-[#718078]"><span>Subtotal</span><span data-testid="text-document-subtotal">{money(totals.subtotal, draft.currency)}</span></div>
                    <div className="flex justify-between text-[#718078]"><span>Tax</span><span data-testid="text-document-tax">{money(totals.tax, draft.currency)}</span></div>
                    {draft.documentType !== "receipt" && <Field label="Shipping amount"><input type="number" min="0" step="any" className={`${inputClass} mt-1`} value={draft.shippingAmount} onChange={(e) => changeDraft("shippingAmount", Number(e.target.value) || 0)} data-testid="input-document-shipping-amount" /></Field>}
                    <div className="flex justify-between border-t border-[#dfe9e2] pt-2 text-sm font-extrabold"><span>Total</span><span className="text-[#087b59]" data-testid="text-document-total">{money(totals.total, draft.currency)}</span></div>
                  </div>
                </section>
                {draft.documentType === "shipping" && <section className="rounded-xl border border-[#dce8df] bg-white p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><Truck size={17} className="text-[#39805f]" /><h4 className="text-sm font-extrabold">Fulfilment details</h4></div><div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Recipient"><input className={inputClass} value={draft.shipToName || ""} onChange={(e) => changeDraft("shipToName", e.target.value)} data-testid="input-document-shipto-name" /></Field><Field label="Carrier"><input className={inputClass} value={draft.carrier} onChange={(e) => changeDraft("carrier", e.target.value)} data-testid="input-document-carrier" /></Field>
                  <Field label="Delivery address" className="sm:col-span-2"><textarea rows={2} className={inputClass} value={draft.shipToAddress || ""} onChange={(e) => changeDraft("shipToAddress", e.target.value)} data-testid="input-document-shipto-address" /></Field>
                  <Field label="Service"><input className={inputClass} value={draft.service} onChange={(e) => changeDraft("service", e.target.value)} data-testid="input-document-service" /></Field><Field label="Tracking number"><input className={inputClass} value={draft.trackingNumber} onChange={(e) => changeDraft("trackingNumber", e.target.value)} data-testid="input-document-tracking" /></Field>
                  <Field label="Ship date"><input type="date" className={inputClass} value={draft.shippingDate || ""} onChange={(e) => changeDraft("shippingDate", e.target.value || null)} data-testid="input-document-shipping-date" /></Field>
                  {([["packageWeight", "Weight"], ["packageLength", "Length"], ["packageWidth", "Width"], ["packageHeight", "Height"]] as const).map(([key, label]) => <Field key={key} label={`${label} · ${key === "packageWeight" ? "kg" : "cm"}`}><input type="number" min="0" step="any" className={inputClass} value={draft[key] ?? ""} onChange={(e) => changeDraft(key, e.target.value ? Number(e.target.value) : null)} data-testid={`input-document-${key}`} /></Field>)}
                </div></section>}
                {draft.documentType === "receipt" && <section className="rounded-xl border border-[#dce8df] bg-white p-4 sm:p-5"><h4 className="mb-3 text-sm font-extrabold">Payment record</h4><Field label="Payment method"><input className={inputClass} value={draft.paymentMethod} onChange={(e) => changeDraft("paymentMethod", e.target.value)} placeholder="Bank transfer, cash…" data-testid="input-document-payment-method" /></Field></section>}
                <section className="rounded-xl border border-[#dce8df] bg-white p-4 sm:p-5"><h4 className="mb-4 text-sm font-extrabold">Notes & terms</h4><div className="grid gap-3"><Field label="Notes"><textarea rows={2} className={inputClass} value={draft.notes} onChange={(e) => changeDraft("notes", e.target.value)} data-testid="input-document-notes" /></Field>{draft.documentType !== "shipping" && <Field label="Terms"><textarea rows={2} className={inputClass} value={draft.terms} onChange={(e) => changeDraft("terms", e.target.value)} data-testid="input-document-terms" /></Field>}<label className="flex items-center gap-2 text-xs font-semibold text-[#456e5b]"><input type="checkbox" checked={draft.includeStamp} onChange={(e) => changeDraft("includeStamp", e.target.checked)} className="accent-[#0b684d]" data-testid="input-document-include-stamp" />Include company stamp</label></div></section>
              </> : <div className="rounded-xl border border-[#dce8df] bg-white p-5"><div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck size={17} className="text-[#22805c]" />Issued documents are locked against edits.</div><p className="mt-2 text-xs leading-5 text-[#788a80]">Status actions below are processed by the document workflow.</p></div>}
              <div className="rounded-xl border border-[#d7e6dc] bg-[#edf5ef] p-4" data-testid="document-status-actions">
                <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[.1em] text-[#537965]">Workflow</p><ChevronDown size={15} className="text-[#759481]" /></div>
                <div className="flex flex-wrap gap-2">
                  {active.status === "draft" && <button type="button" onClick={() => void issueDraft()} disabled={busy} className="rounded-lg bg-[#0b684d] px-3 py-2 text-xs font-bold text-white hover:bg-[#09583f] disabled:opacity-50" data-testid="button-issue-document"><FileCheck2 size={14} className="mr-1.5 inline" />Issue document</button>}
                  {active.status === "issued" && active.documentType !== "shipping" && <button type="button" onClick={() => transition("paid")} disabled={busy} className="rounded-lg bg-[#208257] px-3 py-2 text-xs font-bold text-white hover:bg-[#176b47] disabled:opacity-50" data-testid="button-mark-document-paid"><CircleDollarSign size={14} className="mr-1.5 inline" />Mark paid</button>}
                  {active.documentType === "shipping" && active.status === "issued" && <button type="button" onClick={() => transition("shipped")} disabled={busy} className="rounded-lg bg-[#208257] px-3 py-2 text-xs font-bold text-white hover:bg-[#176b47] disabled:opacity-50" data-testid="button-mark-document-shipped"><Truck size={14} className="mr-1.5 inline" />Mark shipped</button>}
                  {active.status === "shipped" && <button type="button" onClick={() => transition("delivered")} disabled={busy} className="rounded-lg bg-[#208257] px-3 py-2 text-xs font-bold text-white hover:bg-[#176b47] disabled:opacity-50" data-testid="button-mark-document-delivered"><PackageCheck size={14} className="mr-1.5 inline" />Mark delivered</button>}
                  {busy && <span className="inline-flex items-center gap-1.5 px-2 text-xs text-[#65816e]"><LoaderCircle size={14} className="animate-spin" />Updating status…</span>}
                  {!busy && active.status !== "draft" && <span className="self-center text-[11px] text-[#71877a]">Current state: {statusLabel(active.status)}</span>}
                </div>
              </div>
            </div>
            <div className="min-w-0 xl:sticky xl:top-4">
              <div className="mb-2 flex items-center justify-between px-1"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#74877c]">Live document preview</span><span className="text-[10px] text-[#95a39b]">A4 · Print-ready</span></div>
              <DocumentPaper document={draft} settings={active.companySnapshot || settings} number={active.number} status={active.status} />
              {draft.documentType === "shipping" && <div className="mt-5"><div className="mb-2 flex items-center justify-between px-1"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#74877c]">Shipping label preview</span><span className="text-[10px] text-[#95a39b]">100 × 150 mm</span></div><ShippingLabel document={draft} settings={active.companySnapshot || settings} number={active.number} /></div>}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {[{ title: "Documents", value: counts.total, icon: FileText, note: "All records" }, { title: "Drafts", value: counts.drafts, icon: FilePlus2, note: "Ready to finish" }, { title: "In workflow", value: counts.issued, icon: PackageOpen, note: "Issued or fulfilled" }].map(({ title, value, icon: Icon, note }) => <div key={title} className="flex items-center justify-between rounded-xl border border-[#dce8df] bg-white px-4 py-3.5"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#82928a]">{title}</p><p className="mt-1 text-2xl font-extrabold tracking-[-.05em] tabular-nums" data-testid={`text-document-count-${title.toLowerCase().replace(" ", "-")}`}>{value}</p></div><div className="text-right"><span className="ml-auto grid h-9 w-9 place-items-center rounded-lg bg-[#edf5ef] text-[#287454]"><Icon size={17} /></span><p className="mt-2 text-[10px] text-[#82928a]">{note}</p></div></div>)}
          </div>
          <div className="mb-4 mt-7 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6b8a78]">Your records</p><h3 className="mt-1 text-xl font-extrabold tracking-[-.04em]">Business documents</h3></div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => startDocument("invoice")} disabled={createDocument.isPending} className="rounded-lg bg-[#0b684d] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#09583f] disabled:opacity-50" data-testid="button-new-invoice"><FilePlus2 size={14} className="mr-1.5 inline" />New invoice</button>
              <button type="button" onClick={() => startDocument("receipt")} disabled={createDocument.isPending} className="rounded-lg border border-[#cfe0d5] bg-white px-3.5 py-2.5 text-xs font-bold text-[#376d56] hover:bg-[#eff7f1]" data-testid="button-new-receipt"><CircleDollarSign size={14} className="mr-1.5 inline" />Receipt</button>
              <button type="button" onClick={() => startDocument("shipping")} disabled={createDocument.isPending} className="rounded-lg border border-[#cfe0d5] bg-white px-3.5 py-2.5 text-xs font-bold text-[#376d56] hover:bg-[#eff7f1]" data-testid="button-new-packing-slip"><Truck size={14} className="mr-1.5 inline" />Packing slip</button>
            </div>
          </div>
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_180px_180px]">
            <label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#84968b]" /><input className={`${inputClass} pl-9`} placeholder="Search number, customer or email" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-business-documents" /></label>
            <select className={inputClass} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by document type" data-testid="select-filter-document-type"><option value="all">All document types</option><option value="invoice">Invoices</option><option value="receipt">Receipts</option><option value="shipping">Packing slips</option></select>
            <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} aria-label="Filter by status" data-testid="select-filter-document-status"><option value="all">All statuses</option>{(["draft", "issued", "paid", "shipped", "delivered", "void"] as const).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
          </div>
          {documentsQuery.isLoading ? <div className="overflow-hidden rounded-xl border border-[#dce8df] bg-white">{Array.from({ length: 5 }, (_, i) => <div key={i} className="flex animate-pulse items-center gap-4 border-b border-[#edf2ee] px-4 py-4"><div className="h-9 w-9 rounded-lg bg-[#edf3ee]" /><div className="flex-1"><div className="h-3 w-40 rounded bg-[#edf3ee]" /><div className="mt-2 h-2.5 w-28 rounded bg-[#f1f5f1]" /></div><div className="h-5 w-20 rounded-full bg-[#edf3ee]" /></div>)}</div> :
            documentsQuery.isError ? <div className="rounded-xl border border-[#ead8cc] bg-[#fffaf5] px-6 py-10 text-center" data-testid="state-documents-error"><AlertCircle size={25} className="mx-auto text-[#a7684e]" /><h4 className="mt-3 font-bold text-[#754d3b]">Documents could not be loaded</h4><p className="mt-1 text-sm text-[#987966]">Your records are safe. Try refreshing the list.</p><button type="button" onClick={() => void documentsQuery.refetch()} className="mt-4 rounded-lg bg-[#0b684d] px-4 py-2 text-xs font-bold text-white" data-testid="button-retry-documents"><RefreshCw size={13} className="mr-1.5 inline" />Retry</button></div> :
              filtered.length === 0 ? <div className="rounded-xl border border-dashed border-[#cbded0] bg-white px-5 py-12 text-center" data-testid="state-documents-empty"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#edf5ef] text-[#458366]"><ClipboardList size={22} /></div><h4 className="mt-4 text-sm font-extrabold">{documents.length ? "No documents match these filters" : "A clear desk. Start with a document."}</h4><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#7c8e83]">{documents.length ? "Try another search or clear one of the filters." : "Create an invoice, receipt or packing slip; your first draft begins here."}</p>{documents.length > 0 ? <button type="button" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }} className="mt-3 text-xs font-bold text-[#0b684d]" data-testid="button-clear-document-filters">Clear filters</button> : <button type="button" onClick={() => startDocument("invoice")} className="mt-4 rounded-lg bg-[#0b684d] px-4 py-2.5 text-xs font-bold text-white" data-testid="button-empty-create-invoice"><FilePlus2 size={14} className="mr-1.5 inline" />Create invoice</button>}</div> :
                <div className="overflow-hidden rounded-xl border border-[#dce8df] bg-white">
                  <div className="hidden grid-cols-[1.1fr_1.4fr_.85fr_.7fr_.9fr_30px] gap-3 border-b border-[#e4ece6] bg-[#f7faf7] px-4 py-3 text-[9px] font-bold uppercase tracking-[.13em] text-[#84948a] md:grid"><span>Document</span><span>Customer</span><span>Issued</span><span>Status</span><span className="text-right">Total</span><span /></div>
                  {filtered.map((doc) => <button type="button" key={doc.id} onClick={() => openDocument(doc)} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 border-b border-[#edf2ee] px-4 py-3.5 text-left last:border-0 hover:bg-[#f8fbf8] md:grid-cols-[1.1fr_1.4fr_.85fr_.7fr_.9fr_30px] md:gap-3" data-testid={`row-business-document-${doc.id}`}>
                    <span className="min-w-0"><span className="block truncate font-mono text-xs font-bold text-[#28543e]" data-testid={`text-document-number-${doc.id}`}>{doc.number}</span><span className="mt-1 block text-[10px] text-[#82928a]">{typeLabel(doc.documentType)}</span></span>
                    <span className="min-w-0"><span className="block truncate text-xs font-semibold">{doc.customerName}</span><span className="mt-1 block truncate text-[10px] text-[#82928a]">{doc.customerCompany || doc.customerEmail || "Individual customer"}</span></span>
                    <span className="hidden text-xs text-[#63766b] md:block">{dateLabel(doc.issueDate)}</span>
                    <span className="col-start-2 row-start-1 justify-self-end md:col-auto md:row-auto md:justify-self-start"><StatusPill status={doc.status} /></span>
                    <span className="col-span-2 flex items-center justify-between md:col-auto md:justify-end"><span className="text-[10px] text-[#82928a] md:hidden">{dateLabel(doc.issueDate)}</span><span className="text-xs font-bold tabular-nums">{money(doc.total, doc.currency)}</span></span>
                    <span className="hidden justify-self-end text-[#89a093] md:block"><ArrowRight size={15} /></span>
                  </button>)}
                </div>}
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-[#dce8df] bg-[#edf5ef] px-3.5 py-3 text-[11px] leading-5 text-[#587464]" data-testid="notice-tax-compliance"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#368260]" /><span>Generated templates are operational documents. Confirm local tax, invoicing and record-keeping compliance before use.</span></div>
        </div>
      )}
    </section>
  );
}
