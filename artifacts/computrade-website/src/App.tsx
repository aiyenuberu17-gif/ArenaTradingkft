import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  getGetAboutQueryKey,
  getListProductsQueryKey,
  useCreateAboutSegment,
  useCreateProduct,
  useDeleteAboutSegment,
  useDeleteProduct,
  useGetAbout,
  useListProducts,
  useUpdateAbout,
  useUpdateAboutSegment,
  type AboutPageInput,
  type AboutSegment,
  type AboutSegmentInput,
  type Product,
  type ProductInput,
} from '@workspace/api-client-react';
import heroGpu from '@assets/generated_images/hero-gpu.jpg';
import heroCooler from '@assets/generated_images/hero-cooler.jpg';
import heroCpu from '@assets/generated_images/hero-cpu.jpg';
import heroFiber from '@assets/generated_images/hero-fiber.jpg';
import heroLaptop from '@assets/generated_images/hero-laptop.jpg';
import heroMemory from '@assets/generated_images/hero-memory.jpg';
import heroMotherboard from '@assets/generated_images/hero-motherboard.jpg';
import heroNas from '@assets/generated_images/hero-nas.jpg';
import heroNetwork from '@assets/generated_images/hero-network.jpg';
import heroPower from '@assets/generated_images/hero-power.jpg';
import heroRouter from '@assets/generated_images/hero-router.jpg';
import heroServer from '@assets/generated_images/hero-server.jpg';
import heroSsd from '@assets/generated_images/hero-ssd.jpg';
import heroWorkstation from '@assets/generated_images/hero-workstation.jpg';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowRight, Building2, Check, ChevronDown, ChevronLeft, ChevronRight, Cloud, Database, Factory, Globe2, GraduationCap, Headphones, Menu, Network, Quote, Search, ShieldCheck, ShoppingBag, Sparkles, X, Zap } from 'lucide-react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { type SupportedLanguage, useTranslation, I18nProvider } from '@/lib/i18n';
import { OfficialDocumentsSection, CompanyDocumentsManagement } from '@/components/company-documents';

const queryClient = new QueryClient();

function rebrandCompanyCopy(value: string) {
  return value
    .replace(/CompuTrade Denmark ApS/gi, 'ARENA TRADING KFT')
    .replace(/CompuTrade Denmark/gi, 'ARENA TRADING KFT')
    .replace(/CompuTrade/gi, 'Arena Trading')
    .replace(/Danish-led/gi, 'Hungary-based')
    .replace(/Danish public organisation/gi, 'Hungarian public organisation')
    .replace(/Danish/gi, 'Hungarian')
    .replace(/Dansk-ledet/gi, 'Ungarn-baseret')
    .replace(/Dansk/gi, 'Ungarsk')
    .replace(/Denmark|Danmark|Dänemark|Danemark|Dinamarca|Denemarken|丹麦|덴마크/gi, 'Hungary');
}

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/\D/g, '');
}

function getWhatsAppHref(number: string, message: string) {
  const normalized = normalizeWhatsAppNumber(number);
  return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : undefined;
}

function useWhatsAppNumber() {
  const [number, setNumber] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadPublicWhatsAppNumber() {
      try {
        const response = await fetch('/api/settings/public', {
          credentials: 'same-origin',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Public settings request failed: ${response.status}`);
        }

        const data = await response.json() as { whatsappNumber?: string; whatsapp?: string };
        const savedNumber = typeof data.whatsappNumber === 'string'
          ? data.whatsappNumber.trim()
          : typeof data.whatsapp === 'string'
            ? data.whatsapp.trim()
            : '';

        if (isMounted) {
          setNumber(savedNumber);
        }
      } catch {
        if (isMounted) {
          setNumber('');
        }
      }
    }

    loadPublicWhatsAppNumber();

    return () => {
      isMounted = false;
    };
  }, []);

  return number;
}

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.5 3.5A11.84 11.84 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.16 1.6 5.97L.06 24l6.27-1.65a11.87 11.87 0 0 0 5.73 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.16-3.47-8.4ZM12.07 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.72.98.99-3.63-.23-.37a9.87 9.87 0 0 1-1.51-5.29C2.2 6.47 6.63 2.04 12.07 2.04c2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 7c0 5.44-4.43 9.86-9.88 9.86Zm5.41-7.39c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.25-.25-.59-.5-.51-.68-.52h-.58c-.2 0-.52.07-.8.37-.28.3-1.06 1.04-1.06 2.54s1.08 2.95 1.23 3.15c.15.2 2.12 3.24 5.13 4.54.72.31 1.28.49 1.72.63.72.23 1.37.2 1.88.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

function WhatsAppFloating() {
  const number = useWhatsAppNumber();
  const { t } = useTranslation();
  if (!number) return null;
  const href = getWhatsAppHref(number, 'Hello Arena Trading, I would like to know more about your technology solutions.');

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={t('hero.whatsapp')}
      data-testid="link-floating-whatsapp"
      className="group fixed bottom-5 right-20 z-30 flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-3.5 text-white shadow-[0_8px_24px_rgba(37,211,102,.3)] transition hover:-translate-y-1 hover:bg-[#20bd5b] hover:shadow-[0_12px_28px_rgba(37,211,102,.38)] sm:right-20"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20">
        <WhatsAppIcon size={19} />
      </span>
      <span className="hidden pr-1 text-xs font-bold sm:inline">{t('hero.whatsapp')}</span>
    </a>
  );
}

type QuoteModalProps = { open: boolean; onClose: () => void; product?: string };

function Button({ children, onClick, href, variant = 'primary', testId }: { children: React.ReactNode; onClick?: () => void; href?: string; variant?: 'primary' | 'light' | 'outline' | 'outline-dark' | 'text'; testId: string }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-3 text-sm font-semibold transition-all duration-200 ${variant === 'primary' ? 'bg-[#00a676] text-white hover:bg-[#008c65] hover:-translate-y-0.5' : variant === 'light' ? 'bg-white text-[#0b1f3a] hover:bg-[#e7f8f2]' : variant === 'outline-dark' ? 'border border-white/45 text-white hover:border-[#78d8bc] hover:text-[#78d8bc]' : variant === 'outline' ? 'border border-[#b7c6d4] text-[#0b1f3a] hover:border-[#00a676] hover:text-[#00865f]' : 'px-0 text-[#00a676] hover:text-[#006d52]'}`;
  if (href) return <a href={href} className={cls} data-testid={testId}>{children}</a>;
  return <button type="button" onClick={onClick} className={cls} data-testid={testId}>{children}</button>;
}

function LanguageSelector() {
  const { availableLanguages, language, setLanguage, t } = useTranslation();

  return (
    <label className="flex items-center gap-2 rounded-full border border-[#dce6ec] bg-[#f8fafc] px-3 py-2 text-[12px] font-semibold text-[#0b1f3a]">
      <span className="sr-only">{t('common.language')}</span>
      <select
        aria-label={t('common.language')}
        value={language}
        onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
        className="bg-transparent pr-4 text-[12px] font-semibold outline-none"
      >
        {availableLanguages.map((option) => (
          <option key={option.code} value={option.code}>
            {option.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuoteModal({ open, onClose, product }: QuoteModalProps) {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', quantity: '1', message: '' });
  useEffect(() => { if (!open) { setSent(false); setError(''); setSubmitting(false); setForm({ name: '', email: '', company: '', phone: '', quantity: '1', message: '' }); } }, [open]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email,
          companyName: form.company,
          customerPhone: form.phone,
          quantity: Number(form.quantity) || 1,
          productService: product ?? 'General inquiry',
          message: form.message,
        }),
      });
      const data = await response.json() as { error?: string; id?: number };
      if (!response.ok) {
        setError(data.error ?? t('quote.error'));
        return;
      }

      setSent(true);

      try {
        const accessKeyResponse = await fetch('/api/web3forms/access-key', { credentials: 'include' });
        if (accessKeyResponse.ok) {
          const { accessKey } = await accessKeyResponse.json() as { accessKey?: string };
          if (accessKey) {
            await fetch('https://api.web3forms.com/submit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                access_key: accessKey,
                subject: `New Quote Request — ${product ?? 'General inquiry'}`,
                from_name: 'ARENA TRADING KFT Quote Requests',
                reply_to: form.email,
                name: form.name,
                email: form.email,
                message: [
                  'New quote request received.',
                  '',
                  `Customer name: ${form.name}`,
                  `Customer email: ${form.email}`,
                  `Customer phone: ${form.phone || 'Not provided'}`,
                  `Company: ${form.company || 'Not provided'}`,
                  `Product/service: ${product ?? 'General inquiry'}`,
                  `Quantity: ${Number(form.quantity) || 1}`,
                  '',
                  'Message/details:',
                  form.message,
                ].join('\n'),
                customerName: form.name,
                customerEmail: form.email,
                customerPhone: form.phone || '',
                companyName: form.company || '',
                productService: product ?? 'General inquiry',
                quantity: String(Number(form.quantity) || 1),
                submittedAt: new Date().toISOString(),
              }),
            });
          }
        }
      } catch (notificationError) {
        console.warn('Web3Forms notification failed after quote save', notificationError);
      }
    } catch {
      setError(t('quote.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#07172a]/70 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="quote-title">
      <div className="relative max-h-[92vh] w-full max-w-[560px] overflow-auto rounded-2xl bg-[#f8fafc] p-6 shadow-2xl sm:p-9">
        <button type="button" onClick={onClose} aria-label={t('quote.closeForm')} data-testid="button-close-quote" className="absolute right-5 top-5 rounded-full p-2 text-slate-500 hover:bg-white hover:text-[#0b1f3a]"><X size={19} /></button>
        {sent ? (
          <div className="py-12 text-center">
            <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#dff6ed] text-[#00865f]"><Check size={25} /></span>
            <h2 className="font-display text-2xl font-extrabold text-[#0b1f3a]">{t('quote.successTitle')}</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">{t('quote.successDescription')}</p>
            <Button onClick={onClose} variant="outline" testId="button-close-success">{t('quote.closeButton')}</Button>
          </div>
        ) : (
          <>
            <p className="eyebrow text-[#00a676]">{t('quote.eyebrow')}</p>
            <h2 id="quote-title" className="mt-3 font-display text-3xl font-extrabold tracking-[-.04em] text-[#0b1f3a]">{t('quote.title')}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">{product ? t('quote.descriptionWithProduct').replace('{product}', product) : t('quote.description')}</p>
            <form className="mt-7 space-y-4" onSubmit={submit} data-testid="form-quote">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-[#0b1f3a]">{t('quote.name')}<input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} data-testid="input-quote-name" className="mt-2 w-full rounded-[9px] border border-[#d6e0e8] bg-white px-3.5 py-3 font-normal outline-none focus:border-[#00a676]" placeholder={t('quote.placeholderName')} /></label>
                <label className="text-sm font-semibold text-[#0b1f3a]">{t('quote.workEmail')}<input type="email" required value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} data-testid="input-quote-email" className="mt-2 w-full rounded-[9px] border border-[#d6e0e8] bg-white px-3.5 py-3 font-normal outline-none focus:border-[#00a676]" placeholder={t('quote.placeholderEmail')} /></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#0b1f3a]">{t('quote.company')}<input value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} data-testid="input-quote-company" className="mt-2 w-full rounded-[9px] border border-[#d6e0e8] bg-white px-3.5 py-3 font-normal outline-none focus:border-[#00a676]" placeholder={t('quote.placeholderCompany')} /></label>
                <label className="block text-sm font-semibold text-[#0b1f3a]">{t('quote.phone')}<input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} data-testid="input-quote-phone" className="mt-2 w-full rounded-[9px] border border-[#d6e0e8] bg-white px-3.5 py-3 font-normal outline-none focus:border-[#00a676]" placeholder={t('quote.placeholderPhone')} /></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#0b1f3a]">{t('quote.productService')}<input value={product ?? ''} readOnly data-testid="input-quote-product" className="mt-2 w-full rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 py-3 font-normal text-slate-500 outline-none" /></label>
                <label className="block text-sm font-semibold text-[#0b1f3a]">{t('quote.quantity')}<input type="number" min="1" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} data-testid="input-quote-quantity" className="mt-2 w-full rounded-[9px] border border-[#d6e0e8] bg-white px-3.5 py-3 font-normal outline-none focus:border-[#00a676]" /></label>
              </div>
              <label className="block text-sm font-semibold text-[#0b1f3a]">{t('quote.messageLabel')}<textarea required value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} data-testid="input-quote-message" rows={4} className="mt-2 w-full resize-none rounded-[9px] border border-[#d6e0e8] bg-white px-3.5 py-3 font-normal outline-none focus:border-[#00a676]" placeholder={t('quote.messagePlaceholder')} /></label>
              {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
              <button type="submit" disabled={submitting} data-testid="button-submit-quote" className="w-full rounded-[10px] bg-[#0b1f3a] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#12345c] disabled:cursor-wait disabled:opacity-60">{submitting ? t('quote.sending') : t('quote.submit')} <ArrowRight className="ml-1 inline" size={16} /></button>
              <p className="text-center text-[11px] text-slate-400">{t('quote.consent')}</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Header({ onQuote, solid = false, galleryStyle = false }: { onQuote: () => void; solid?: boolean; galleryStyle?: boolean }) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 30); window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll); }, []);
  const nav = [[t('nav.about'), '/about'], [t('nav.solutions'), '/#solutions'], [t('nav.marketplace'), '/marketplace'], [t('nav.industries'), '/#industries'], [t('nav.insights'), '/#insights']];
  const solidHeader = galleryStyle ? scrolled || menuOpen : solid || scrolled || menuOpen;
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${solidHeader ? 'bg-white/95 shadow-[0_4px_25px_rgba(11,31,58,.08)] backdrop-blur-md' : 'bg-transparent'}`}>
      <div className={`container-wide ${galleryStyle ? 'relative' : ''} flex h-[74px] items-center justify-between`}>
        {galleryStyle ? (
          <>
            <div className="hidden items-center gap-2 rounded-xl bg-[#0b1f3a] px-3 py-2 shadow-[0_8px_28px_rgba(11,31,58,.2)] lg:flex">
              <a href="/" aria-label="ARENA TRADING KFT home" className="flex items-center">
                <img src="/brand/arena-trading-light.svg" alt="ARENA TRADING KFT" className="h-7 w-auto object-contain" />
              </a>
              <span className="h-6 w-px bg-white/20" />
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle navigation" data-testid="button-desktop-menu" className="grid h-8 w-8 place-items-center rounded-lg text-white transition hover:bg-white/10">
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
            <a href="/" aria-label="ARENA TRADING KFT home" className="flex items-center lg:hidden">
              <img src="/brand/arena-trading-dark.svg" alt="ARENA TRADING KFT" className="h-9 w-auto object-contain" />
            </a>
          </>
        ) : (
          <a href="/" aria-label="ARENA TRADING KFT home" className="flex items-center gap-3">
            <img src={solidHeader ? '/brand/arena-trading-dark.svg' : '/brand/arena-trading-light.svg'} alt="ARENA TRADING KFT" className="h-9 w-auto object-contain" />
          </a>
        )}
        <nav className={`hidden items-center lg:flex ${galleryStyle ? 'gap-3' : 'gap-7'}`} aria-label="Main navigation">
          {galleryStyle ? (
            <>
              <LanguageSelector />
              <button type="button" onClick={onQuote} data-testid="button-header-quote" className="rounded-[9px] bg-[#00a676] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#008c65]">{t('common.requestQuote')}</button>
            </>
          ) : (
            <>
              {nav.map(([label, href]) => <a key={href} href={href} data-testid={`link-nav-${label.toLowerCase()}`} className={`text-[13px] font-semibold transition ${solidHeader ? 'text-slate-600 hover:text-[#0b1f3a]' : 'text-white/85 hover:text-white'}`}>{label}</a>)}
              <LanguageSelector />
              <button type="button" onClick={onQuote} data-testid="button-header-quote" className="rounded-[9px] bg-[#00a676] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#008c65]">{t('common.requestQuote')}</button>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSelector />
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle navigation" data-testid="button-mobile-menu" className={`rounded-lg p-2 ${solidHeader || galleryStyle ? 'text-[#0b1f3a]' : 'text-white'}`}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {galleryStyle && menuOpen && <nav className="absolute left-0 top-[64px] hidden w-60 flex-col rounded-xl border border-slate-200 bg-white p-2 shadow-[0_16px_44px_rgba(11,31,58,.16)] lg:flex" aria-label="Main navigation menu">{nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} data-testid={`link-nav-${label.toLowerCase()}`} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#e5f9ed] hover:text-[#006d52]">{label}</a>)}</nav>}
      </div>
      {menuOpen && <div className="border-t border-slate-100 bg-white px-5 pb-5 pt-3 lg:hidden">{nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} data-testid={`link-mobile-${label.toLowerCase()}`} className="block border-b border-slate-100 py-3 text-sm font-semibold text-[#0b1f3a]">{label}</a>)}<button type="button" onClick={() => { setMenuOpen(false); onQuote(); }} data-testid="button-mobile-quote" className="mt-4 w-full rounded-[9px] bg-[#00a676] py-3 text-sm font-bold text-white">{t('common.requestQuote')}</button></div>}
    </header>
  );
}

function Hero({ onQuote }: { onQuote: () => void }) {
  const { t } = useTranslation();
  const number = useWhatsAppNumber();
  const whatsappHref = getWhatsAppHref(number, 'Hello Arena Trading, I would like to know more about your technology solutions.');
  const [activeSlide, setActiveSlide] = useState(6);
  const [isGalleryActive, setIsGalleryActive] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => typeof window === 'undefined' ? 1024 : window.innerWidth);
  const touchStartX = useRef<number | null>(null);
  const slides = [
    { name: 'Wi-Fi router', alt: 'Enterprise Wi-Fi router and access point', image: heroRouter },
    { name: 'Fiber networking', alt: 'Fiber optic networking cables and transceiver', image: heroFiber },
    { name: 'Power supply', alt: 'Modular computer power supply and cables', image: heroPower },
    { name: 'Network switch', alt: 'Enterprise ethernet network switch', image: heroNetwork },
    { name: 'Business laptop', alt: 'Professional laptop computer', image: heroLaptop },
    { name: 'Processor', alt: 'Desktop processor in a motherboard socket', image: heroCpu },
    { name: 'Graphics card', alt: 'Discrete graphics card for a workstation', image: heroGpu },
    { name: 'Motherboard', alt: 'Computer motherboard and processor socket', image: heroMotherboard },
    { name: 'Workstation', alt: 'Desktop computer workstation and monitor', image: heroWorkstation },
    { name: 'Liquid cooling', alt: 'Liquid CPU cooler with radiator and fans', image: heroCooler },
    { name: 'Solid-state storage', alt: 'Solid-state and NVMe drives', image: heroSsd },
    { name: 'Network storage', alt: 'Network-attached storage appliance', image: heroNas },
    { name: 'Enterprise server', alt: 'Rack-mounted enterprise server', image: heroServer },
    { name: 'Memory', alt: 'High-performance computer memory modules', image: heroMemory },
  ] as const;

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', updateViewportWidth, { passive: true });
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, isGalleryActive ? 2400 : 5200);
    return () => window.clearInterval(timer);
  }, [isGalleryActive, slides.length]);

  const changeSlide = (direction: number) => {
    setActiveSlide((current) => (current + direction + slides.length) % slides.length);
  };
  const sizeScale = Math.min(Math.max(viewportWidth / 1024, 0.75), 1.3);
  const panelWidths = [62, 68, 74, 82, 90, 100, 112, 124].map((width) => width * sizeScale);
  const panelHeights = [52, 62, 78, 100, 132, 176, 232, 300].map((height) => height * sizeScale);

  return (
    <section id="top" className="hero-gallery-grid relative min-h-[600px] overflow-hidden bg-[#f8fafc] pb-8 pt-[126px] text-[#0b1f3a] sm:pt-[124px]">
      <div className="relative">
        <div className="relative z-20 container-wide mx-auto text-center">
          <h1 className="reveal mx-auto max-w-[480px] font-serif text-[clamp(1.9rem,3.3vw,2.85rem)] font-medium leading-[1.05] tracking-[-.045em] text-balance">{t('hero.title')}</h1>
        </div>

        <div
          className="hero-ribbon relative z-10 mx-auto mt-4 flex h-[150px] w-screen max-w-none gap-2 overflow-x-auto px-4 pb-3 sm:left-1/2 sm:-mt-[64px] sm:block sm:h-[285px] sm:w-screen sm:max-w-[1440px] sm:-translate-x-1/2 sm:overflow-visible sm:px-0 sm:pb-0"
          role="region"
          aria-roledescription="carousel"
          aria-label="Computer components"
          tabIndex={0}
          onMouseEnter={() => setIsGalleryActive(true)}
          onMouseLeave={() => setIsGalleryActive(false)}
          onFocusCapture={() => setIsGalleryActive(true)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') changeSlide(-1);
            if (event.key === 'ArrowRight') changeSlide(1);
          }}
          onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
          onTouchEnd={(event) => {
            const startX = touchStartX.current;
            const endX = event.changedTouches[0]?.clientX;
            touchStartX.current = null;
            if (startX !== null && endX !== undefined && Math.abs(endX - startX) > 48) {
              changeSlide(endX < startX ? 1 : -1);
            }
          }}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsGalleryActive(false);
          }}
        >
          {slides.map((slide, index) => {
            const rawOffset = (index - activeSlide + slides.length) % slides.length;
            const offset = rawOffset > slides.length / 2 ? rawOffset - slides.length : rawOffset;
            const distance = Math.abs(offset);
            const angle = distance * 5;
            const depth = 36 - distance * 14;
            const horizontalOffset = panelWidths
              .slice(0, distance)
              .reduce((sum, width, position) => sum + (width + panelWidths[position + 1]) / 2 + 8, 0);
            return (
              <button
                key={slide.name}
                type="button"
                aria-label={slide.alt}
                aria-current={offset === 0 ? 'true' : undefined}
                onClick={() => setActiveSlide(index)}
                data-position={distance}
                className="hero-ribbon-panel absolute left-1/2 top-1/2 block overflow-hidden rounded-xl border border-white/60 bg-white p-0 shadow-[0_14px_45px_rgba(11,31,58,.2)]"
                style={{
                  width: `${panelWidths[distance]}px`,
                  height: `${panelHeights[distance]}px`,
                  transform: `translate(-50%, -50%) translateX(${offset < 0 ? -horizontalOffset : horizontalOffset}px) translateY(12px) translateZ(${depth}px) rotateY(${offset < 0 ? angle : offset > 0 ? -angle : 0}deg)`,
                  zIndex: 10 - distance,
                  animationDelay: `${0.55 + distance * 0.12}s`,
                }}
              >
                <img src={slide.image} alt={slide.alt} draggable={false} className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>

        <div className="relative z-20 mx-auto mt-2 max-w-[660px] px-4 text-center sm:-mt-12">
          <p className="hero-copy mx-auto max-w-[520px] text-[13px] leading-6 text-slate-600 sm:text-sm sm:leading-7">{t('hero.description')}</p>
        </div>
        <div className="hero-actions relative z-20 mt-3 flex flex-wrap justify-center gap-3">
          <Button href="#solutions" variant="primary" testId="button-hero-solutions">{t('common.exploreSolutions')} <ArrowDownRight size={17} /></Button>
          <Button onClick={onQuote} variant="outline" testId="button-hero-quote">{t('common.talkToTeam')} <ArrowRight size={17} /></Button>
          {whatsappHref ? <a href={whatsappHref} target="_blank" rel="noreferrer" data-testid="button-hero-whatsapp" className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#00a676]/30 bg-white px-5 py-3 text-sm font-semibold text-[#00865f] transition hover:bg-[#e5f9ed]">{t('hero.whatsapp')} <ArrowRight size={17} /></a> : null}
        </div>
        <div className="hero-features container-wide mx-auto mt-5 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-slate-500">
          <span className="flex items-center gap-2"><Check size={14} className="text-[#00a676]" /> {t('hero.featureOne')}</span>
          <span className="flex items-center gap-2"><Check size={14} className="text-[#00a676]" /> {t('hero.featureTwo')}</span>
          <span className="flex items-center gap-2"><Check size={14} className="text-[#00a676]" /> {t('hero.featureThree')}</span>
        </div>
      </div>
    </section>
  );
}

function LogoRail() {
  const { t } = useTranslation();
  const names = ['LENOVO', 'HPE', 'CISCO', 'DELL TECHNOLOGIES', 'FORTINET', 'MICROSOFT', 'VMWARE', 'LENOVO', 'HPE', 'CISCO'];
  return <section className="border-b border-slate-200 bg-[#f8fafc] py-7" aria-label="Technology partners"><div className="container-wide mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.17em] text-slate-400"><span className="h-px w-7 bg-[#00a676]" /> {t('hero.technologyWeWorkWith')}</div><div className="overflow-hidden"><div className="partner-track flex items-center gap-12 px-5 text-[13px] font-extrabold tracking-[.12em] text-[#8c9aa7]">{names.map((name, i) => <span key={`${name}-${i}`} className="whitespace-nowrap">{name}</span>)}</div></div></section>;
}

function About() {
  const { t } = useTranslation();
  return <section id="about" className="section-pad bg-[#f8fafc]"><div className="container-wide grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-end"><div><p className="eyebrow text-[#00a676]">{t('about.eyebrow')}</p><h2 className="mt-4 max-w-[600px] font-display text-[clamp(2.25rem,4vw,3.7rem)] font-extrabold leading-[1.08] tracking-[-.06em] text-[#0b1f3a]">{t('about.title')}</h2><p className="mt-6 max-w-[570px] text-[16px] leading-8 text-slate-600">{t('about.description')}</p><div className="mt-8 flex flex-wrap items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#dff6ed] text-[#00865f]"><Sparkles size={19} /></span><p className="max-w-sm text-sm leading-6 text-slate-600"><strong className="text-[#0b1f3a]">{t('about.highlight')}</strong> {t('about.highlightText')}</p><a href="/about" data-testid="link-home-about" className="inline-flex items-center gap-2 text-sm font-bold text-[#00a676] hover:text-[#006d52]">{t('about.readStory')} <ArrowRight size={15} /></a></div></div><div className="grid grid-cols-2 gap-x-8 gap-y-8 border-t border-[#dbe4eb] pt-8 sm:grid-cols-4 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">{[['12+', 'years of perspective'], ['27', 'markets supplied'], ['98.4%', 'on-time delivery'], ['1', 'accountable partner']].map(([num, label]) => <div key={label}><p className="font-display text-3xl font-extrabold tracking-[-.06em] text-[#0b1f3a]">{num}</p><p className="mt-2 max-w-[100px] text-xs leading-5 text-slate-500">{label}</p></div>)}</div></div></section>;
}

function AboutPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetAbout();
  const [quoteOpen, setQuoteOpen] = useState(false);

  return (
    <div className="site-shell min-h-screen bg-[#f8fafc]">
      <Header onQuote={() => setQuoteOpen(true)} solid />
      <main className="pt-[74px]">
        {isLoading ? (
          <div className="container-wide grid min-h-[70vh] place-items-center py-20 text-sm text-slate-500">{t('about.loadingStory')}</div>
        ) : isError || !data ? (
          <div className="container-wide grid min-h-[70vh] place-items-center py-20 text-center"><div><p className="font-display text-2xl font-bold text-[#0b1f3a]">{t('about.homeLabel')}</p><p className="mt-2 text-sm text-slate-500">{t('about.homeDescription')}</p></div></div>
        ) : (
          <>
            <section className="relative overflow-hidden bg-[#0b1f3a] py-24 text-white sm:py-32">
              <div className="absolute inset-0 navy-grid opacity-25" />
              <div className="container-wide relative grid gap-12 lg:grid-cols-[1.04fr_.96fr] lg:items-center">
                <div>
                  <p className="eyebrow text-[#78d8bc]">{rebrandCompanyCopy(data.eyebrow)}</p>
                  <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.8rem,6vw,5.5rem)] font-extrabold leading-[1.02] tracking-[-.07em]">{rebrandCompanyCopy(data.title)}</h1>
                  <p className="mt-7 max-w-2xl text-[17px] leading-8 text-[#c6d4e0]">{rebrandCompanyCopy(data.intro)}</p>
                </div>
                <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-white/15 bg-white/[.06]">
                  {data.imagePath ? <img src={data.imagePath} alt="" className="h-full min-h-[280px] w-full object-cover" /> : <div className="absolute inset-0 grid place-items-center"><div className="h-48 w-48 rounded-full border border-[#78d8bc]/25 bg-[#163b56]/60 shadow-[0_0_0_30px_rgba(120,216,188,.04),0_0_0_70px_rgba(120,216,188,.03)]" /><span className="absolute bottom-7 left-7 eyebrow text-[#78d8bc]">Hungary-based · Globally connected</span></div>}
                </div>
              </div>
            </section>
            <div className="bg-white">
              {data.segments.map((segment: AboutSegment, index: number) => (
                <section key={segment.id} className={`border-b border-[#e7edf1] py-20 sm:py-28 ${index % 2 ? 'bg-[#f8fafc]' : 'bg-white'}`}>
                  <div className={`container-wide grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20 ${segment.imagePosition === 'left' ? 'lg:[&>div:first-child]:order-2' : ''}`}>
                    <div>
                      <p className="eyebrow text-[#00a676]">{rebrandCompanyCopy(segment.eyebrow)}</p>
                      <h2 className="mt-4 max-w-xl font-display text-[clamp(2.2rem,4vw,4rem)] font-extrabold leading-[1.06] tracking-[-.065em] text-[#0b1f3a]">{rebrandCompanyCopy(segment.title)}</h2>
                      <p className="mt-6 max-w-xl whitespace-pre-line text-[16px] leading-8 text-slate-600">{rebrandCompanyCopy(segment.body)}</p>
                    </div>
                    <div className="min-h-[250px] overflow-hidden rounded-2xl border border-[#dce6ec] bg-[#e6f3f1]">
                      {segment.imagePath ? <img src={segment.imagePath} alt="" className="h-full min-h-[250px] w-full object-cover" /> : <div className="grid min-h-[250px] place-items-center p-8"><div className="w-full max-w-sm border-l-2 border-[#00a676] pl-6"><p className="eyebrow text-[#00865f]">ARENA TRADING KFT perspective</p><p className="mt-3 font-display text-2xl font-bold leading-tight text-[#0b1f3a]">Useful advice. Accountable delivery.</p></div></div>}
                    </div>
                  </div>
                </section>
              ))}
              <OfficialDocumentsSection />
            </div>
          </>
        )}
      </main>
      <Footer />
      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
      <WhatsAppFloating />
    </div>
  );
}

function Solutions() {
  const { t } = useTranslation();
  const translatedServices = [
    { icon: Network, title: t('solutions.infrastructureTitle'), text: t('solutions.infrastructureText') },
    { icon: Cloud, title: t('solutions.cloudTitle'), text: t('solutions.cloudText') },
    { icon: ShieldCheck, title: t('solutions.securityTitle'), text: t('solutions.securityText') },
    { icon: Database, title: t('solutions.dataTitle'), text: t('solutions.dataText') },
    { icon: Headphones, title: t('solutions.managedTitle'), text: t('solutions.managedText') },
    { icon: ShoppingBag, title: t('solutions.hardwareTitle'), text: t('solutions.hardwareText') },
  ];
  return <section id="solutions" className="section-pad bg-white"><div className="container-wide"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="eyebrow text-[#00a676]">{t('solutions.eyebrow')}</p><h2 className="mt-4 max-w-[650px] font-display text-[clamp(2.1rem,4vw,3.55rem)] font-extrabold leading-[1.08] tracking-[-.06em] text-[#0b1f3a]">{t('solutions.title')}</h2></div><a href="#contact" data-testid="link-solutions-contact" className="flex items-center gap-2 text-sm font-bold text-[#00a676] hover:text-[#006d52]">{t('solutions.discussSetup')} <ArrowRight size={16} /></a></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{translatedServices.map(({ icon: Icon, title, text }, i) => <article key={title} className="soft-card group rounded-2xl border border-[#e1e8ee] bg-white p-6"><div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf8f4] text-[#00a676] transition group-hover:bg-[#00a676] group-hover:text-white"><Icon size={20} /></span><span className="text-xs font-bold text-slate-300">0{i + 1}</span></div><h3 className="mt-7 font-display text-[19px] font-bold tracking-[-.035em] text-[#0b1f3a]">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{text}</p><a href="#contact" data-testid={`link-service-${i}`} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#00a676]">{t('common.learnMore')} <ArrowRight size={14} /></a></article>)}</div></div></section>;
}

function MarketplaceTeaser({ onQuote }: { onQuote: (product?: string) => void }) {
  const { t } = useTranslation();
  const { data: products = [], isLoading, isError } = useListProducts();
  const number = useWhatsAppNumber();

  return (
    <section id="marketplace" className="section-pad bg-[#0b1f3a] text-white">
      <div className="container-wide">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow text-[#78d8bc]">{t('marketplace.eyebrow')}</p>
            <h2 className="mt-4 max-w-2xl font-display text-[clamp(2.2rem,4vw,3.8rem)] font-extrabold leading-[1.06] tracking-[-.06em]">{t('marketplace.title')}</h2>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#c6d4e0]">{t('marketplace.description')}</p>
          </div>
          <Button href="/marketplace" variant="light" testId="button-marketplace-open">{t('marketplace.openMarketplace')} <ArrowRight size={16} /></Button>
        </div>

        {isLoading ? (
          <div className="mt-12 rounded-2xl border border-white/15 bg-white/[.06] px-6 py-16 text-center text-sm text-[#a9bfcc]">{t('marketplace.loadingProducts')}</div>
        ) : isError ? (
          <div className="mt-12 rounded-2xl border border-red-200/20 bg-red-400/10 px-6 py-16 text-center">
            <p className="font-display text-xl font-bold">{t('marketplace.unavailableTitle')}</p>
            <p className="mt-2 text-sm text-[#c6d4e0]">{t('marketplace.unavailableDescription')}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-white/15 bg-white/[.06] px-6 py-16 text-center">
            <p className="font-display text-xl font-bold">{t('marketplace.emptyTitle')}</p>
            <p className="mt-2 text-sm text-[#a9bfcc]">{t('marketplace.emptyDescription')}</p>
          </div>
        ) : (
          <Carousel
            opts={{ align: 'start', loop: products.length > 3 }}
            className="mt-12 px-1 sm:px-5"
            aria-label="Featured marketplace products"
          >
            <CarouselContent>
              {products.map((product: Product, index: number) => (
                <CarouselItem key={product.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                  <article className="group h-full overflow-hidden rounded-2xl border border-[#dce6ec] bg-white text-[#0b1f3a] shadow-[0_8px_28px_rgba(0,0,0,.14)]">
                    <ProductVisual product={product} index={index} />
                    <div className="flex h-[206px] flex-col p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[.12em] text-[#00a676]">{product.brand}</p>
                        <span className="text-[10px] font-semibold text-[#00865f]">{product.availability}</span>
                      </div>
                      <h3 className="mt-3 font-display text-lg font-bold leading-tight tracking-[-.04em]">{product.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{product.detail}</p>
                      <div className="mt-auto flex items-center justify-between border-t border-[#edf1f3] pt-4">
                        <span className="text-xs font-semibold text-slate-400">{product.category}</span>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => onQuote(product.name)} data-testid={`button-home-marketplace-quote-${index}`} className="flex items-center gap-1.5 text-xs font-bold text-[#0b1f3a] transition hover:text-[#00a676]">{t('marketplace.requestQuote')} <ArrowRight size={14} /></button>
                          {number ? <a href={getWhatsAppHref(number, `Hello Arena Trading, I’m interested in ${product.name}.`)} target="_blank" rel="noreferrer" data-testid={`button-home-marketplace-whatsapp-${index}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#25D366] transition hover:text-[#20bd5b]">WhatsApp</a> : null}
                        </div>
                      </div>
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious aria-label="Previous marketplace product" className="left-0 border-white/20 bg-[#123653] text-white hover:bg-[#1a496a] sm:-left-1" />
            <CarouselNext aria-label="Next marketplace product" className="right-0 border-white/20 bg-[#123653] text-white hover:bg-[#1a496a] sm:-right-1" />
          </Carousel>
        )}
      </div>
    </section>
  );
}

function ProductVisual({ product, index }: { product: Product; index: number }) {
  return <div className="relative flex h-[210px] items-center justify-center overflow-hidden" style={{ backgroundColor: product.color }}><div className="absolute left-5 top-5 z-10 rounded-full bg-white/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#536a78]">{product.type}</div>{product.imagePath ? <img src={product.imagePath} alt={product.name} className="h-full w-full object-contain p-6 transition duration-300 group-hover:scale-105" /> : <div className="relative h-[120px] w-[190px] rounded-[10px] border border-[#8da5b3]/40 bg-[#f8fafb] shadow-[8px_14px_18px_rgba(31,63,81,.16)] transition duration-300 group-hover:scale-105">{index % 3 === 0 ? <><div className="absolute inset-x-3 top-3 h-[76px] rounded-sm bg-[#bcd8ea]"><span className="absolute left-3 top-3 h-3 w-10 rounded-sm bg-[#0b1f3a]/15" /><span className="absolute bottom-3 right-3 h-2 w-8 rounded-sm bg-[#00a676]/50" /></div><div className="absolute bottom-2 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-[#597281]/40" /></> : <><span className="absolute inset-5 grid place-items-center rounded-lg border border-[#00a676]/30 font-display text-3xl font-extrabold tracking-[-.08em] text-[#0b1f3a]/60">{product.mark}</span><div className="absolute -bottom-4 left-1/2 h-4 w-24 -translate-x-1/2 rounded-b-lg bg-[#9eb5c1]/70" /></>}</div>}</div>;
}

function MarketplacePage({ onQuote }: { onQuote: (product?: string) => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const { data: products = [], isLoading, isError } = useListProducts();
  const number = useWhatsAppNumber();
  const allProductsLabel = t('marketplace.allProducts');
  const categories = [allProductsLabel, ...Array.from(new Set(products.map((product: Product) => product.category)))] as string[];
  const activeCategory = category ?? allProductsLabel;
  const filteredProducts = products.filter((product: Product) => (activeCategory === allProductsLabel || product.category === activeCategory) && `${product.brand} ${product.name} ${product.type}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="site-shell min-h-screen bg-[#f5f8fa]">
      <Header onQuote={() => onQuote()} solid />
      <main className="pt-[74px]">
        <section className="bg-[#0b1f3a] py-20 text-white sm:py-28">
          <div className="container-wide">
            <p className="eyebrow text-[#78d8bc]">{t('marketplace.homepageTitle')}</p>
            <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.7rem,6vw,5.2rem)] font-extrabold leading-[1.02] tracking-[-.07em]">
              {t('marketplace.homepageTitle').includes('CompuTrade') ? 'Technology, selected with perspective.' : t('marketplace.homepageTitle')}
            </h1>
            <p className="mt-6 max-w-2xl text-[16px] leading-8 text-[#c6d4e0]">{t('marketplace.homepageDescription')}</p>
          </div>
        </section>
        <section className="border-b border-[#dbe4eb] bg-white py-7">
          <div className="container-wide flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block w-full lg:max-w-[420px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('marketplace.searchPlaceholder')} data-testid="input-marketplace-search" className="h-12 w-full rounded-[10px] border border-[#d6e0e8] bg-[#f8fafc] pl-11 pr-4 text-sm text-[#0b1f3a] outline-none focus:border-[#00a676]" />
            </label>
            <div className="flex flex-wrap gap-2" aria-label="Product categories">
              {categories.map((item) => {
                const label = String(item);
                return (
                  <button key={label} type="button" onClick={() => setCategory(label)} data-testid={`button-category-${label.toLowerCase().replaceAll(' ', '-')}`} className={`rounded-full border px-4 py-2 text-xs font-bold transition ${category === label ? 'border-[#00a676] bg-[#e4f6ef] text-[#00865f]' : 'border-[#d6e0e8] text-slate-500 hover:border-[#00a676] hover:text-[#00865f]'}`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        <section className="section-pad">
          <div className="container-wide">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow text-[#00a676]">{t('marketplace.curatedTitle')}</p>
                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-.05em] text-[#0b1f3a]">Products for serious work</h2>
              </div>
              <p className="text-sm text-slate-500">{isLoading ? 'Loading…' : `${filteredProducts.length} products`}</p>
            </div>
            {isError ? (
              <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center">
                <p className="font-display text-xl font-bold text-red-900">The catalogue is temporarily unavailable.</p>
                <p className="mt-2 text-sm text-red-700">Please try again in a moment.</p>
              </div>
            ) : isLoading ? (
              <div className="mt-10 rounded-2xl border border-[#dce6ec] bg-white px-6 py-16 text-center text-sm text-slate-500">Loading marketplace products…</div>
            ) : filteredProducts.length ? (
              <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product: Product, index: number) => (
                  <article key={product.id} className="group overflow-hidden rounded-2xl border border-[#dce6ec] bg-white shadow-[0_5px_20px_rgba(11,31,58,.05)]">
                    <ProductVisual product={product} index={index} />
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[.12em] text-[#00a676]">{product.brand}</p>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#00865f]">
                          <i className={`h-1.5 w-1.5 rounded-full ${product.availability === 'Available to order' ? 'bg-[#00a676]' : 'bg-[#f59e0b]'}`} />
                          {product.availability}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-xl font-bold tracking-[-.04em] text-[#0b1f3a]">{product.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{product.detail}</p>
                      <div className="mt-5 flex items-center justify-between border-t border-[#edf1f3] pt-5">
                        <span className="text-xs font-semibold text-slate-400">{product.category}</span>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => onQuote(product.name)} data-testid={`button-marketplace-quote-${index}`} className="flex items-center gap-2 text-sm font-bold text-[#0b1f3a] transition group-hover:text-[#00a676]">Request a quote <ArrowRight size={15} /></button>
                          {number ? <a href={getWhatsAppHref(number, `Hello Arena Trading, I’m interested in ${product.name}.`)} target="_blank" rel="noreferrer" data-testid={`button-marketplace-whatsapp-${index}`} className="text-sm font-bold text-[#25D366] transition hover:text-[#20bd5b]">WhatsApp</a> : null}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-[#cbd8e0] bg-white px-6 py-16 text-center">
                <p className="font-display text-xl font-bold text-[#0b1f3a]">No products match that search.</p>
                <p className="mt-2 text-sm text-slate-500">Try a different term or browse all products.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <QuoteModal open={false} onClose={() => undefined} />
    </div>
  );

}

const emptyProduct: ProductInput = {
  brand: '',
  name: '',
  type: 'Business technology',
  category: 'Laptops',
  detail: '',
  color: '#dce9f2',
  mark: '',
  availability: 'Available to order',
  imagePath: undefined,
};

function ProductManagement() {
  const [form, setForm] = useState<ProductInput>(emptyProduct);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState('');
  const [formError, setFormError] = useState('');
  const { data: products = [], isLoading } = useListProducts();
  const createMutation = useCreateProduct();
  const deleteMutation = useDeleteProduct();

  const updateField = (field: keyof ProductInput, value: string) => {
    setForm((current: ProductInput) => ({ ...current, [field]: value }));
    setFormError('');
  };

  const submitProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    let imagePath = form.imagePath;
    if (imageFile) {
      try {
        const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
        if (imageFile.size > 5 * 1024 * 1024) {
          setFormError('Choose an image smaller than 5 MB.');
          return;
        }
        if (imageFile.type && !allowedImageTypes.has(imageFile.type)) {
          setFormError('Choose a JPG, PNG, WEBP, or GIF image.');
          return;
        }
        const response = await fetch('/api/uploads/product-image', {
          method: 'POST',
          headers: { 'Content-Type': imageFile.type || 'application/octet-stream' },
          credentials: 'include',
          body: imageFile,
        });
        const responseText = await response.text();
        let data: { imagePath?: string; error?: string } = {};
        try {
          data = JSON.parse(responseText) as { imagePath?: string; error?: string };
        } catch {
          // Express can return a plain-text/HTML parser error for an
          // oversized request; keep the message useful to the administrator.
        }
        if (!response.ok || !data.imagePath) {
          setFormError(data.error ?? `The image could not be uploaded (${response.status}).`);
          return;
        }
        imagePath = data.imagePath;
      } catch {
        setFormError('The image could not be uploaded. Please try again.');
        return;
      }
    }

    createMutation.mutate(
      { data: { ...form, imagePath } },
      {
        onSuccess: () => {
          setForm({ ...emptyProduct });
          setImageFile(undefined);
          setImagePreview('');
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        },
        onError: () => setFormError('The product could not be saved. Check the fields and try again.'),
      },
    );
  };

  const removeProduct = (product: Product) => {
    if (!window.confirm(`Remove ${product.name} from the marketplace?`)) return;
    deleteMutation.mutate(
      { id: product.id },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }),
        onError: () => setFormError('The product could not be removed. Please try again.'),
      },
    );
  };

  return (
    <section className="mt-8 rounded-2xl border border-[#dce6ec] bg-white p-6 shadow-[0_5px_20px_rgba(11,31,58,.05)] sm:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-[#00a676]">Admin · Marketplace</p>
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-[-.045em]">Manage products</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Add products here and they will appear on the public marketplace.</p>
        </div>
        <span className="text-sm font-semibold text-slate-400">{isLoading ? 'Loading…' : `${products.length} products live`}</span>
      </div>
      <form onSubmit={submitProduct} className="mt-8 grid gap-4 border-t border-[#edf1f3] pt-7 sm:grid-cols-2" data-testid="form-admin-product">
        {[
          ['brand', 'Brand', 'Lenovo'],
          ['name', 'Product name', 'ThinkPad X1 Carbon Gen 12'],
          ['type', 'Product type', 'Business notebook'],
          ['category', 'Category', 'Laptops'],
          ['mark', 'Short mark', 'X1'],
        ].map(([field, label, placeholder]) => (
          <label key={field} className="block text-sm font-semibold text-[#0b1f3a]">
            {label}
            <input
              required
              maxLength={field === 'mark' ? 4 : undefined}
              value={form[field as keyof ProductInput] ?? ''}
              onChange={(event) => updateField(field as keyof ProductInput, event.target.value)}
              placeholder={placeholder}
              data-testid={`input-admin-product-${field}`}
              className="mt-2 h-11 w-full rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 text-sm font-normal outline-none transition focus:border-[#00a676] focus:bg-white"
            />
          </label>
        ))}
        <label className="block text-sm font-semibold text-[#0b1f3a]">
          Availability
          <select value={form.availability} onChange={(event) => updateField('availability', event.target.value)} data-testid="select-admin-product-availability" className="mt-2 h-11 w-full rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 text-sm font-normal outline-none focus:border-[#00a676]">
            <option>Available to order</option>
            <option>Request availability</option>
            <option>Contact us</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-[#0b1f3a]">
          Card colour
          <span className="mt-2 flex h-11 items-center gap-3 rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-3">
            <input type="color" value={form.color} onChange={(event) => updateField('color', event.target.value)} data-testid="input-admin-product-color" className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0" />
            <span className="font-mono text-xs font-normal text-slate-500">{form.color}</span>
          </span>
        </label>
        <label className="block text-sm font-semibold text-[#0b1f3a] sm:col-span-2">
          Short description
          <textarea required rows={3} value={form.detail} onChange={(event) => updateField('detail', event.target.value)} placeholder="A clear sentence about the product and who it is for." data-testid="input-admin-product-detail" className="mt-2 w-full resize-none rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 py-3 text-sm font-normal outline-none transition focus:border-[#00a676] focus:bg-white" />
        </label>
        <label className="block text-sm font-semibold text-[#0b1f3a] sm:col-span-2">
          Product image
          <span className="mt-2 flex flex-col gap-3 rounded-[9px] border border-dashed border-[#b9cbd5] bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  setFormError('Choose an image smaller than 5 MB.');
                  event.target.value = '';
                  return;
                }
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
                setFormError('');
              }}
              data-testid="input-admin-product-image"
              className="block w-full text-sm font-normal text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-[#e5f9ed] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#00865f] hover:file:bg-[#d5f3e3]"
            />
            {imagePreview && <img src={imagePreview} alt="Selected product preview" className="h-16 w-20 rounded-md border border-[#d6e0e8] bg-white object-contain p-1" />}
          </span>
          <span className="mt-1 block text-xs font-normal text-slate-400">Optional. JPG, PNG, WEBP or GIF, up to 5 MB. Stored on this app only — no image service is used.</span>
        </label>
        {formError && <p role="alert" className="sm:col-span-2 text-sm font-semibold text-red-600">{formError}</p>}
        <div className="sm:col-span-2">
          <button type="submit" disabled={createMutation.isPending} data-testid="button-admin-product-save" className="rounded-[10px] bg-[#0b1f3a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#12345c] disabled:cursor-wait disabled:opacity-60">{createMutation.isPending ? 'Adding product…' : 'Add product to marketplace'}</button>
        </div>
      </form>
      <div className="mt-8 border-t border-[#edf1f3] pt-6">
        <h3 className="font-display text-lg font-bold">Live catalogue</h3>
        <div className="mt-4 divide-y divide-[#edf1f3]">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg font-display text-xs font-extrabold text-[#0b1f3a]" style={{ backgroundColor: product.color }}>{product.mark}</span>
                <div><p className="text-sm font-bold text-[#0b1f3a]">{product.name}</p><p className="mt-0.5 text-xs text-slate-500">{product.brand} · {product.category}</p></div>
              </div>
              <button type="button" onClick={() => removeProduct(product)} disabled={deleteMutation.isPending} data-testid={`button-admin-product-delete-${product.id}`} className="self-start text-xs font-bold text-red-600 hover:text-red-800 sm:self-auto">Remove</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Industries() {
  const { t } = useTranslation();
  const translatedIndustries = [
    { icon: Building2, name: t('industries.publicSector'), text: t('industries.publicSectorText') },
    { icon: GraduationCap, name: t('industries.education'), text: t('industries.educationText') },
    { icon: Factory, name: t('industries.manufacturing'), text: t('industries.manufacturingText') },
    { icon: Globe2, name: t('industries.finance'), text: t('industries.financeText') },
  ];
  return <section id="industries" className="section-pad bg-white"><div className="container-wide grid gap-12 lg:grid-cols-[.72fr_1.28fr]"><div><p className="eyebrow text-[#00a676]">{t('industries.eyebrow')}</p><h2 className="mt-4 font-display text-[clamp(2.1rem,4vw,3.5rem)] font-extrabold leading-[1.08] tracking-[-.06em] text-[#0b1f3a]">{t('industries.title')}</h2><p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">{t('industries.description')}</p><a href="#contact" data-testid="link-industries-contact" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#00a676]">{t('industries.findStartingPoint')} <ArrowRight size={16} /></a></div><div className="grid gap-3 sm:grid-cols-2">{translatedIndustries.map(({ icon: Icon, name, text }, i) => <a href="#contact" key={name} data-testid={`card-industry-${i}`} className="soft-card group rounded-2xl border border-[#e1e8ee] p-6"><div className="flex items-center justify-between"><Icon size={23} strokeWidth={1.6} className="text-[#00a676] transition group-hover:scale-110" /><ArrowUpRightIcon /></div><h3 className="mt-9 font-display text-lg font-bold text-[#0b1f3a]">{name}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></a>)}</div></div></section>;
}

function ArrowUpRightIcon() { return <ArrowDownRight size={16} className="rotate-[-90deg] text-slate-300 transition group-hover:text-[#00a676]" />; }

function Proof() {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const stories = [
    { tag: t('proof.publicSectorTag'), title: t('proof.publicSectorTitle'), text: t('proof.publicSectorText'), result: t('proof.publicSectorResult'), quote: t('proof.publicSectorQuote'), person: t('proof.publicSectorPerson'), role: t('proof.publicSectorRole') },
    { tag: t('proof.manufacturingTag'), title: t('proof.manufacturingTitle'), text: t('proof.manufacturingText'), result: t('proof.manufacturingResult'), quote: t('proof.manufacturingQuote'), person: t('proof.manufacturingPerson'), role: t('proof.manufacturingRole') },
  ];
  const story = stories[active];
  return <section id="proof" className="section-pad bg-[#064e3b] text-white"><div className="container-wide"><div className="flex items-end justify-between gap-8"><div><p className="eyebrow text-[#78d8bc]">{t('proof.eyebrow')}</p><h2 className="mt-4 max-w-xl font-display text-[clamp(2.1rem,4vw,3.5rem)] font-extrabold leading-[1.08] tracking-[-.06em]">{t('proof.title')}</h2></div><div className="hidden gap-2 sm:flex"><button type="button" onClick={() => setActive((active + stories.length - 1) % stories.length)} aria-label={t('proof.previousCase')} data-testid="button-case-previous" className="rounded-full border border-white/20 p-2.5 text-white hover:bg-white/10"><ChevronLeft size={18} /></button><button type="button" onClick={() => setActive((active + 1) % stories.length)} aria-label={t('proof.nextCase')} data-testid="button-case-next" className="rounded-full border border-white/20 p-2.5 text-white hover:bg-white/10"><ChevronRight size={18} /></button></div></div><div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end"><div className="border-l-2 border-[#00a676] pl-6 sm:pl-9"><p className="eyebrow text-[#78d8bc]">{story.tag}</p><h3 className="mt-4 max-w-2xl font-display text-[clamp(1.9rem,3.8vw,3.4rem)] font-bold leading-[1.08] tracking-[-.05em]">{story.title}</h3><p className="mt-5 max-w-xl text-[15px] leading-7 text-[#b9cbd8]">{story.text}</p><div className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white/[.08] px-4 py-3"><Zap size={17} className="text-[#78d8bc]" /><span className="text-sm font-semibold">{story.result}</span></div></div><div className="rounded-2xl border border-white/10 bg-white/[.06] p-6 sm:p-8"><Quote size={27} className="text-[#78d8bc]" /><p className="mt-5 text-[15px] leading-7 text-[#d4e1e9]">“{story.quote}”</p><div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#2f7d65] font-display text-sm font-bold"> {story.person.split(' ').map((x) => x[0]).join('')}</span><div><p className="text-sm font-bold">{story.person}</p><p className="mt-0.5 text-xs text-[#9db5c3]">{story.role}</p></div></div></div></div><div className="mt-8 flex gap-2 sm:hidden"><button type="button" onClick={() => setActive((active + stories.length - 1) % stories.length)} data-testid="button-case-previous-mobile" className="rounded-full border border-white/20 p-2.5"><ChevronLeft size={18} /></button><button type="button" onClick={() => setActive((active + 1) % stories.length)} data-testid="button-case-next-mobile" className="rounded-full border border-white/20 p-2.5"><ChevronRight size={18} /></button><span className="ml-2 self-center text-xs text-[#9db5c3]">{active + 1} / {stories.length}</span></div></div></section>;
}

function Insights() {
  const { t } = useTranslation();
  const articles = [
    { cat: t('insights.operationsTag'), title: t('insights.operationsTitle'), text: t('insights.operationsText'), read: t('insights.operationsRead') },
    { cat: t('insights.securityTag'), title: t('insights.securityTitle'), text: t('insights.securityText'), read: t('insights.securityRead') },
    { cat: t('insights.perspectiveTag'), title: t('insights.perspectiveTitle'), text: t('insights.perspectiveText'), read: t('insights.perspectiveRead') },
  ];
  return <section id="insights" className="section-pad bg-[#f8fafc]"><div className="container-wide"><div className="flex items-end justify-between gap-6"><div><p className="eyebrow text-[#00a676]">{t('insights.eyebrow')}</p><h2 className="mt-4 font-display text-[clamp(2.1rem,4vw,3.5rem)] font-extrabold leading-[1.08] tracking-[-.06em] text-[#0b1f3a]">{t('insights.title')}</h2></div><a href="#contact" data-testid="link-insights-all" className="hidden items-center gap-2 text-sm font-bold text-[#00a676] sm:flex">{t('insights.allInsights')} <ArrowRight size={16} /></a></div><div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_.85fr_.85fr]">{articles.map(({ cat, title, text, read }, i) => <article key={title} className={`soft-card rounded-2xl border border-[#e1e8ee] bg-white p-6 ${i === 0 ? 'lg:p-8' : ''}`}><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.14em] text-[#00a676]"><span>{cat}</span><span className="text-slate-400">{read}</span></div><h3 className={`mt-10 font-display font-bold leading-[1.15] tracking-[-.04em] text-[#0b1f3a] ${i === 0 ? 'text-2xl' : 'text-xl'}`}>{title}</h3><p className="mt-4 text-sm leading-6 text-slate-500">{text}</p><a href="#contact" data-testid={`link-insight-${i}`} className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-[#0b1f3a] hover:text-[#00a676]">{t('insights.readPerspective')} <ArrowRight size={14} /></a></article>)}</div></div></section>;
}

function Contact({ onQuote }: { onQuote: () => void }) {
  const { t } = useTranslation();
  return <section id="contact" className="section-pad bg-white"><div className="container-wide overflow-hidden rounded-[24px] bg-[#e6f3f1]"><div className="grid gap-10 p-7 sm:p-12 lg:grid-cols-[1.1fr_.9fr] lg:p-16"><div><p className="eyebrow text-[#00865f]">{t('contact.eyebrow')}</p><h2 className="mt-4 max-w-xl font-display text-[clamp(2.3rem,4vw,4rem)] font-extrabold leading-[1.04] tracking-[-.065em] text-[#0b1f3a]">{t('contact.title')}</h2><p className="mt-6 max-w-lg text-[15px] leading-7 text-slate-600">{t('contact.description')}</p><div className="mt-9 flex flex-wrap gap-3"><Button onClick={onQuote} testId="button-contact-quote">{t('common.talkToTeam')} <ArrowRight size={16} /></Button></div></div><div className="flex flex-col justify-between rounded-2xl bg-[#064e3b] p-6 text-white sm:p-8"><div><p className="eyebrow text-[#78d8bc]">{t('contact.companyTitle')}</p><p className="mt-5 text-sm leading-7 text-[#c6d4e0]">{t('contact.companyDescription')}</p></div><div className="mt-10 space-y-3 border-t border-white/10 pt-5 text-sm"><p className="flex items-center justify-between"><span className="text-[#9db5c3]">{t('contact.basedIn')}</span><span className="font-semibold">{t('contact.timezone')}</span></p><p className="flex items-center justify-between"><span className="text-[#9db5c3]">{t('contact.responseTime')}</span><span className="font-semibold">{t('contact.responseValue')}</span></p></div></div></div></div></section>;
}

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-[#043d30] py-12 text-white">
      <div className="container-wide">
        <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-[1.2fr_.8fr_.8fr_.8fr]">
          <div>
            <p className="font-display text-sm font-extrabold tracking-[.12em] text-white">ARENA TRADING KFT</p>
            <p className="mt-5 max-w-xs text-sm leading-6 text-[#9db5c3]">{t('footer.description')}</p>
          </div>
          <div>
            <p className="eyebrow text-[#78d8bc]">{t('footer.explore')}</p>
            <div className="mt-4 space-y-3 text-sm text-[#c6d4e0]">
              <a href="/about" data-testid="link-footer-about" className="block hover:text-white">{t('footer.aboutUs')}</a>
              <a href="#solutions" data-testid="link-footer-solutions" className="block hover:text-white">{t('footer.solutions')}</a>
              <a href="/marketplace" data-testid="link-footer-marketplace" className="block hover:text-white">{t('footer.marketplace')}</a>
            </div>
          </div>
          <div>
            <p className="eyebrow text-[#78d8bc]">{t('footer.forYou')}</p>
            <div className="mt-4 space-y-3 text-sm text-[#c6d4e0]">
              <a href="#industries" data-testid="link-footer-industries" className="block hover:text-white">{t('footer.industries')}</a>
              <a href="#proof" data-testid="link-footer-proof" className="block hover:text-white">{t('footer.caseStudies')}</a>
              <a href="#insights" data-testid="link-footer-insights" className="block hover:text-white">{t('footer.insights')}</a>
            </div>
          </div>
          <div>
            <p className="eyebrow text-[#78d8bc]">{t('footer.contact')}</p>
            <div className="mt-4 space-y-3 text-sm text-[#c6d4e0]">
              <a href="#contact" data-testid="link-footer-contact" className="block hover:text-white">{t('common.talkToTeam')}</a>
              <p>{t('footer.companyLine')}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 pt-6 text-xs text-[#7992a3] sm:flex-row">
          <p>© {new Date().getFullYear()} ARENA TRADING KFT. {t('common.allRightsReserved')}.</p>
          <div className="flex gap-5">
            <a href="#top" data-testid="link-footer-privacy" className="hover:text-white">{t('common.privacy')}</a>
            <a href="#top" data-testid="link-footer-terms" className="hover:text-white">{t('common.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

const emptyAboutSegment: AboutSegmentInput = {
  eyebrow: 'New section',
  title: 'Section title',
  body: 'Add your content here.',
  imagePath: undefined,
  imagePosition: 'right',
  sortOrder: 0,
};

async function uploadAboutImage(file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');
  const response = await fetch('/api/uploads/about-image', {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    credentials: 'include',
    body: file,
  });
  const responseText = await response.text();
  let data: { imagePath?: string; error?: string } = {};
  try {
    data = JSON.parse(responseText) as { imagePath?: string; error?: string };
  } catch {
    // Keep the server status as the useful error when the body is not JSON.
  }
  if (!response.ok || !data.imagePath) throw new Error(data.error ?? `The image could not be uploaded (${response.status}).`);
  return data.imagePath;
}

function AboutManagement() {
  const { data, isLoading, isError } = useGetAbout();
  const [pageForm, setPageForm] = useState<AboutPageInput>({ eyebrow: '', title: '', intro: '', imagePath: undefined });
  const [segments, setSegments] = useState<AboutSegment[]>([]);
  const [heroFile, setHeroFile] = useState<File>();
  const [segmentFiles, setSegmentFiles] = useState<Record<number, File>>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const updatePageMutation = useUpdateAbout();
  const createSegmentMutation = useCreateAboutSegment();
  const updateSegmentMutation = useUpdateAboutSegment();
  const deleteSegmentMutation = useDeleteAboutSegment();

  useEffect(() => {
    if (!data) return;
    setPageForm({ eyebrow: data.eyebrow, title: data.title, intro: data.intro, imagePath: data.imagePath ?? undefined });
    setSegments(data.segments);
  }, [data]);

  const invalidateAbout = () => queryClient.invalidateQueries({ queryKey: getGetAboutQueryKey() });

  const savePage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setNotice('');
    try {
      const imagePath = heroFile ? await uploadAboutImage(heroFile) : pageForm.imagePath;
      updatePageMutation.mutate(
        { data: { ...pageForm, imagePath } },
        {
          onSuccess: () => {
            setHeroFile(undefined);
            setNotice('About hero saved.');
            invalidateAbout();
          },
          onError: () => setFormError('The About hero could not be saved. Check the fields and try again.'),
        },
      );
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'The image could not be uploaded.');
    }
  };

  const updateSegmentField = (id: number, field: keyof AboutSegment, value: string | number) => {
    setSegments((current) => current.map((segment) => segment.id === id ? { ...segment, [field]: value } : segment));
    setFormError('');
    setNotice('');
  };

  const segmentInput = (segment: AboutSegment): AboutSegmentInput => ({
    eyebrow: segment.eyebrow,
    title: segment.title,
    body: segment.body,
    imagePath: segment.imagePath ?? undefined,
    imagePosition: segment.imagePosition,
    sortOrder: Number(segment.sortOrder),
  });

  const saveSegment = async (segment: AboutSegment) => {
    setFormError('');
    setNotice('');
    try {
      const imagePath = segmentFiles[segment.id] ? await uploadAboutImage(segmentFiles[segment.id]) : segment.imagePath ?? undefined;
      updateSegmentMutation.mutate(
        { id: segment.id, data: { ...segmentInput(segment), imagePath } },
        {
          onSuccess: () => {
            setSegmentFiles((current) => {
              const next = { ...current };
              delete next[segment.id];
              return next;
            });
            setNotice('About section saved.');
            invalidateAbout();
          },
          onError: () => setFormError('The About section could not be saved. Check the fields and try again.'),
        },
      );
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'The image could not be uploaded.');
    }
  };

  const addSegment = () => {
    setFormError('');
    setNotice('');
    createSegmentMutation.mutate(
      { data: { ...emptyAboutSegment, sortOrder: segments.length } },
      {
        onSuccess: () => {
          setNotice('About section added.');
          invalidateAbout();
        },
        onError: () => setFormError('The About section could not be added.'),
      },
    );
  };

  const removeSegment = (segment: AboutSegment) => {
    if (!window.confirm(`Remove the “${segment.title || 'untitled'}” About section?`)) return;
    setFormError('');
    setNotice('');
    deleteSegmentMutation.mutate(
      { id: segment.id },
      {
        onSuccess: () => {
          setNotice('About section removed.');
          invalidateAbout();
        },
        onError: () => setFormError('The About section could not be removed.'),
      },
    );
  };

  if (isLoading) return <section className="mt-8 rounded-2xl border border-[#dce6ec] bg-white p-8 text-sm text-slate-500">Loading About content…</section>;
  if (isError || !data) return <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">About content could not be loaded.</section>;

  return (
    <section className="mt-8 rounded-2xl border border-[#dce6ec] bg-white p-6 shadow-[0_5px_20px_rgba(11,31,58,.05)] sm:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-[#00a676]">Admin · About page</p>
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-[-.045em]">Tell the ARENA TRADING KFT story</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Edit the public About page hero and build as many story sections as you need.</p>
        </div>
        <span className="text-sm font-semibold text-slate-400">{segments.length} sections live</span>
      </div>

      <form onSubmit={savePage} className="mt-8 grid gap-4 border-t border-[#edf1f3] pt-7 sm:grid-cols-2" data-testid="form-admin-about">
        <label className="block text-sm font-semibold text-[#0b1f3a]">Eyebrow<input required value={pageForm.eyebrow} onChange={(event) => setPageForm((current: AboutPageInput) => ({ ...current, eyebrow: event.target.value }))} data-testid="input-admin-about-eyebrow" className="mt-2 h-11 w-full rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 text-sm font-normal outline-none focus:border-[#00a676] focus:bg-white" /></label>
        <label className="block text-sm font-semibold text-[#0b1f3a]">Hero title<input required value={pageForm.title} onChange={(event) => setPageForm((current: AboutPageInput) => ({ ...current, title: event.target.value }))} data-testid="input-admin-about-title" className="mt-2 h-11 w-full rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 text-sm font-normal outline-none focus:border-[#00a676] focus:bg-white" /></label>
        <label className="block text-sm font-semibold text-[#0b1f3a] sm:col-span-2">Hero introduction<textarea required rows={4} value={pageForm.intro} onChange={(event) => setPageForm((current: AboutPageInput) => ({ ...current, intro: event.target.value }))} data-testid="input-admin-about-intro" className="mt-2 w-full resize-y rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 py-3 text-sm font-normal outline-none focus:border-[#00a676] focus:bg-white" /></label>
        <label className="block text-sm font-semibold text-[#0b1f3a] sm:col-span-2">Hero image<span className="mt-2 flex flex-col gap-3 rounded-[9px] border border-dashed border-[#b9cbd5] bg-[#f8fafc] p-4 sm:flex-row sm:items-center"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) setHeroFile(file); }} data-testid="input-admin-about-image" className="block w-full text-sm font-normal text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-[#e5f9ed] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#00865f]" />{pageForm.imagePath && <img src={pageForm.imagePath} alt="Current About hero" className="h-16 w-24 rounded-md border border-[#d6e0e8] object-cover" />}</span><span className="mt-1 block text-xs font-normal text-slate-400">Optional. JPG, PNG, WEBP or GIF, up to 5 MB.</span></label>
        {formError && <p role="alert" className="sm:col-span-2 text-sm font-semibold text-red-600">{formError}</p>}
        {notice && <p role="status" className="flex items-center gap-2 sm:col-span-2 text-sm font-semibold text-[#00865f]"><Check size={16} />{notice}</p>}
        <div className="sm:col-span-2"><button type="submit" disabled={updatePageMutation.isPending} data-testid="button-admin-about-save" className="rounded-[10px] bg-[#0b1f3a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#12345c] disabled:cursor-wait disabled:opacity-60">{updatePageMutation.isPending ? 'Saving hero…' : 'Save About hero'}</button></div>
      </form>

      <div className="mt-10 border-t border-[#edf1f3] pt-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h3 className="font-display text-lg font-bold">Story sections</h3><p className="mt-1 text-sm text-slate-500">Sections appear in ascending order number on the public page.</p></div><button type="button" onClick={addSegment} disabled={createSegmentMutation.isPending} data-testid="button-admin-about-add-segment" className="rounded-[10px] border border-[#00a676] px-4 py-2.5 text-sm font-bold text-[#00865f] hover:bg-[#e5f9ed] disabled:opacity-60">{createSegmentMutation.isPending ? 'Adding…' : 'Add section'}</button></div>
        <div className="mt-6 space-y-5">
          {segments.map((segment, index) => (
            <article key={segment.id} className="rounded-xl border border-[#dce6ec] bg-[#f8fafc] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4"><p className="eyebrow text-[#00a676]">Section {index + 1}</p><button type="button" onClick={() => removeSegment(segment)} disabled={deleteSegmentMutation.isPending} data-testid={`button-admin-about-delete-segment-${segment.id}`} className="text-xs font-bold text-red-600 hover:text-red-800">Delete</button></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#0b1f3a]">Eyebrow<input value={segment.eyebrow} onChange={(event) => updateSegmentField(segment.id, 'eyebrow', event.target.value)} data-testid={`input-admin-about-segment-eyebrow-${segment.id}`} className="mt-2 h-11 w-full rounded-[9px] border border-[#d6e0e8] bg-white px-3.5 text-sm font-normal outline-none focus:border-[#00a676]" /></label>
                <label className="block text-sm font-semibold text-[#0b1f3a]">Title<input value={segment.title} onChange={(event) => updateSegmentField(segment.id, 'title', event.target.value)} data-testid={`input-admin-about-segment-title-${segment.id}`} className="mt-2 h-11 w-full rounded-[9px] border border-[#d6e0e8] bg-white px-3.5 text-sm font-normal outline-none focus:border-[#00a676]" /></label>
                <label className="block text-sm font-semibold text-[#0b1f3a] sm:col-span-2">Body<textarea rows={4} value={segment.body} onChange={(event) => updateSegmentField(segment.id, 'body', event.target.value)} data-testid={`input-admin-about-segment-body-${segment.id}`} className="mt-2 w-full resize-y rounded-[9px] border border-[#d6e0e8] bg-white px-3.5 py-3 text-sm font-normal outline-none focus:border-[#00a676]" /></label>
                <label className="block text-sm font-semibold text-[#0b1f3a]">Image position<select value={segment.imagePosition} onChange={(event) => updateSegmentField(segment.id, 'imagePosition', event.target.value)} data-testid={`select-admin-about-segment-position-${segment.id}`} className="mt-2 h-11 w-full rounded-[9px] border border-[#d6e0e8] bg-white px-3.5 text-sm font-normal outline-none focus:border-[#00a676]"><option value="right">Right</option><option value="left">Left</option></select></label>
                <label className="block text-sm font-semibold text-[#0b1f3a]">Order<input type="number" min="0" value={segment.sortOrder} onChange={(event) => updateSegmentField(segment.id, 'sortOrder', Number(event.target.value))} data-testid={`input-admin-about-segment-order-${segment.id}`} className="mt-2 h-11 w-full rounded-[9px] border border-[#d6e0e8] bg-white px-3.5 text-sm font-normal outline-none focus:border-[#00a676]" /></label>
                <label className="block text-sm font-semibold text-[#0b1f3a] sm:col-span-2">Section image<span className="mt-2 flex flex-col gap-3 rounded-[9px] border border-dashed border-[#b9cbd5] bg-white p-4 sm:flex-row sm:items-center"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) setSegmentFiles((current) => ({ ...current, [segment.id]: file })); }} data-testid={`input-admin-about-segment-image-${segment.id}`} className="block w-full text-sm font-normal text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-[#e5f9ed] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#00865f]" />{segment.imagePath && <img src={segment.imagePath} alt={`Current image for ${segment.title}`} className="h-16 w-24 rounded-md border border-[#d6e0e8] object-cover" />}</span></label>
              </div>
              <div className="mt-5"><button type="button" onClick={() => saveSegment(segment)} disabled={updateSegmentMutation.isPending} data-testid={`button-admin-about-save-segment-${segment.id}`} className="rounded-[10px] bg-[#0b1f3a] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#12345c] disabled:opacity-60">{updateSegmentMutation.isPending ? 'Saving…' : 'Save section'}</button></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminSettings() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [number, setNumber] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [quoteEmailStatus, setQuoteEmailStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [quoteEmailMessage, setQuoteEmailMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/session', { credentials: 'include' })
      .then((response) => response.json())
      .then((data: { authenticated?: boolean }) => setAuthenticated(Boolean(data.authenticated)))
      .catch(() => setLoginError('Unable to reach the admin service. Please try again.'))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetch('/api/admin/quote-request-email', { credentials: 'include' })
      .then((response) => response.json())
      .then((data: { email?: string }) => setQuoteEmail(data.email ?? ''))
      .catch(() => setQuoteEmailMessage('Unable to load the configured quote request email.'));

    // load persisted whatsapp number from server for admins
    fetch('/api/admin/whatsapp', { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { whatsapp?: string }) => {
        if (data?.whatsapp) {
          setNumber(data.whatsapp ?? '');
          setSaved(Boolean(data.whatsapp));
        }
      })
      .catch(() => {
        /* non-fatal */
      });
  }, [authenticated]);

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      const data = await response.json() as { error?: string; authenticated?: boolean };
      if (!response.ok) {
        setLoginError(data.error ?? 'Unable to sign in.');
        return;
      }
      setAuthenticated(Boolean(data.authenticated));
      setPassword('');
    } catch {
      setLoginError('Unable to reach the admin service. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    setAuthenticated(false);
  };

  const saveNumber = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeWhatsAppNumber(number);
    if (normalized.length < 8) {
      setError('Enter a valid WhatsApp number with country code, for example 45XXXXXXXX.');
      setSaved(false);
      return;
    }

    // persist to server (admin-protected)
    fetch('/api/admin/whatsapp', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp: normalized }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? 'Unable to save');
        const nextNumber = typeof data?.whatsapp === 'string' ? data.whatsapp : normalized;
        setNumber(nextNumber);
        setError('');
        setSaved(true);
      })
      .catch((err) => {
        setError(typeof err?.message === 'string' ? err.message : 'Unable to save WhatsApp number.');
        setSaved(false);
      });
  };

  const clearNumber = () => {
    // clear on server
    fetch('/api/admin/whatsapp', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ whatsapp: '' }) })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data?.error ?? 'Unable to clear');
        }
        setNumber('');
        setSaved(false);
        setError('');
      })
      .catch(() => {
        setError('Unable to clear WhatsApp number.');
      });
  };

  const saveQuoteEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuoteEmailStatus('saving');
    setQuoteEmailMessage('');

    try {
      const response = await fetch('/api/admin/quote-request-email', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: quoteEmail }),
      });
      const data = await response.json() as { error?: string; message?: string; email?: string };
      if (!response.ok) {
        setQuoteEmailStatus('error');
        setQuoteEmailMessage(data.error ?? 'Unable to save the quote request email.');
        return;
      }
      setQuoteEmail(data.email ?? quoteEmail);
      setQuoteEmailStatus('saved');
      setQuoteEmailMessage(data.message ?? 'Quote request email updated successfully.');
    } catch {
      setQuoteEmailStatus('error');
      setQuoteEmailMessage('Unable to save the quote request email.');
    }
  };

  if (!authChecked) {
    return <div className="grid min-h-screen place-items-center bg-[#f5f8fa] text-sm text-slate-500">Checking admin access…</div>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#f5f8fa] text-[#0b1f3a]">
        <header className="border-b border-[#dce6ec] bg-white">
          <div className="container-wide flex h-[74px] items-center justify-end">
            <a href="/" data-testid="link-admin-login-back" className="text-sm font-bold text-[#00a676] hover:text-[#006d52]">Back to website <ArrowRight className="ml-1 inline" size={15} /></a>
          </div>
        </header>
        <main className="container-wide flex min-h-[calc(100vh-74px)] items-center justify-center py-14">
          <section className="w-full max-w-md rounded-2xl border border-[#dce6ec] bg-white p-7 shadow-[0_5px_20px_rgba(11,31,58,.05)] sm:p-9">
            <p className="eyebrow text-[#00a676]">Admin access</p>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-.05em]">Sign in to continue.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">Enter the administrator password to manage website settings.</p>
            <form onSubmit={login} className="mt-7 space-y-4" data-testid="form-admin-login">
              <label className="block text-sm font-semibold">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setLoginError(''); }}
                  autoComplete="current-password"
                  required
                  autoFocus
                  data-testid="input-admin-password"
                  className="mt-2 h-12 w-full rounded-[10px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 text-sm font-normal outline-none transition focus:border-[#00a676] focus:bg-white"
                />
              </label>
              {loginError && <p role="alert" className="text-sm font-semibold text-red-600">{loginError}</p>}
              <button type="submit" disabled={loggingIn} data-testid="button-admin-login" className="w-full rounded-[10px] bg-[#0b1f3a] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#12345c] disabled:cursor-wait disabled:opacity-60">{loggingIn ? 'Signing in…' : 'Sign in'}</button>
            </form>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8fa] text-[#0b1f3a]">
      <header className="border-b border-[#dce6ec] bg-white">
        <div className="container-wide flex h-[74px] items-center justify-end">
          <div className="flex items-center gap-5">
            <button type="button" onClick={logout} data-testid="button-admin-logout" className="text-sm font-bold text-slate-500 hover:text-[#0b1f3a]">Log out</button>
            <a href="/" data-testid="link-admin-back" className="text-sm font-bold text-[#00a676] hover:text-[#006d52]">Back to website <ArrowRight className="ml-1 inline" size={15} /></a>
          </div>
        </div>
      </header>
      <main className="container-wide py-14 sm:py-20">
        <div className="max-w-3xl">
          <p className="eyebrow text-[#00a676]">Admin · Website settings</p>
          <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,4.5rem)] font-extrabold leading-[1.04] tracking-[-.065em]">Keep your contact channels current.</h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-8 text-slate-600">Configure the WhatsApp number shown in the floating contact button across the public website and marketplace.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_.72fr]">
          <section className="rounded-2xl border border-[#dce6ec] bg-white p-6 shadow-[0_5px_20px_rgba(11,31,58,.05)] sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e5f9ed] text-[#20bd5b]"><WhatsAppIcon size={23} /></span>
              <div><h2 className="font-display text-xl font-bold tracking-[-.035em]">WhatsApp contact</h2><p className="mt-1 text-sm leading-6 text-slate-500">Use an international number without the plus sign or spaces.</p></div>
            </div>
            <form onSubmit={saveNumber} className="mt-8" data-testid="form-admin-whatsapp">
              <label className="block text-sm font-semibold text-[#0b1f3a]">
                Business WhatsApp number
                <input
                  value={number}
                  onChange={(event) => { setNumber(event.target.value); setSaved(false); setError(''); }}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="45XXXXXXXX"
                  data-testid="input-admin-whatsapp"
                  className="mt-2 h-12 w-full rounded-[10px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 text-sm font-normal outline-none transition focus:border-[#00a676] focus:bg-white"
                />
              </label>
              {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
              {saved && <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#00865f]"><Check size={16} /> Saved and active on the public site.</p>}
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="submit" data-testid="button-save-admin-whatsapp" className="rounded-[10px] bg-[#0b1f3a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#12345c]">Save number</button>
                <button type="button" onClick={clearNumber} data-testid="button-clear-admin-whatsapp" className="rounded-[10px] border border-[#cbd8e0] px-5 py-3 text-sm font-bold text-[#0b1f3a] transition hover:border-[#00a676] hover:text-[#00865f]">Remove button</button>
              </div>
            </form>
          </section>
          <section className="rounded-2xl border border-[#dce6ec] bg-white p-6 shadow-[0_5px_20px_rgba(11,31,58,.05)] sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e5f9ed] text-[#20bd5b]"><Check size={23} /></span>
              <div><h2 className="font-display text-xl font-bold tracking-[-.035em]">Quote request email</h2><p className="mt-1 text-sm leading-6 text-slate-500">Quote requests submitted by customers will be sent to this address.</p></div>
            </div>
            <form onSubmit={saveQuoteEmail} className="mt-8" data-testid="form-admin-quote-email">
              <label className="block text-sm font-semibold text-[#0b1f3a]">
                Quote Request Email
                <input
                  type="email"
                  value={quoteEmail}
                  onChange={(event) => { setQuoteEmail(event.target.value); setQuoteEmailStatus('idle'); setQuoteEmailMessage(''); }}
                  placeholder="sales@yourdomain.com"
                  data-testid="input-admin-quote-email"
                  className="mt-2 h-12 w-full rounded-[10px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 text-sm font-normal outline-none transition focus:border-[#00a676] focus:bg-white"
                />
              </label>
              {quoteEmailStatus === 'error' && quoteEmailMessage ? <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{quoteEmailMessage}</p> : null}
              {quoteEmailStatus === 'saved' && quoteEmailMessage ? <p role="status" className="mt-3 text-sm font-semibold text-[#00865f]">{quoteEmailMessage}</p> : null}
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="submit" disabled={quoteEmailStatus === 'saving'} data-testid="button-save-admin-quote-email" className="rounded-[10px] bg-[#0b1f3a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#12345c] disabled:cursor-wait disabled:opacity-60">{quoteEmailStatus === 'saving' ? 'Saving…' : 'Save email'}</button>
              </div>
            </form>
          </section>
        </div>
        <ProductManagement />
         <AboutManagement />
         <CompanyDocumentsManagement />
      </main>
    </div>
  );
}

function Home() {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteProduct, setQuoteProduct] = useState<string | undefined>();
  const openQuote = (product?: string) => { setQuoteProduct(product); setQuoteOpen(true); };
  return <div className="site-shell"><Header onQuote={() => openQuote()} galleryStyle /><main><Hero onQuote={() => openQuote()} /><LogoRail /><About /><Solutions /><MarketplaceTeaser onQuote={openQuote} /><Industries /><Proof /><Insights /><Contact onQuote={() => openQuote()} /></main><Footer /><QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} product={quoteProduct} /><WhatsAppFloating /><a href="#top" data-testid="link-back-to-top" aria-label="Back to top" className="fixed bottom-5 right-5 z-30 grid h-10 w-10 place-items-center rounded-full border border-[#dce6ec] bg-white text-[#0b1f3a] shadow-lg transition hover:-translate-y-1"><ChevronDown size={17} className="rotate-180" /></a></div>;
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/about" component={AboutPage} /><Route path="/marketplace"><MarketplaceRoute /></Route><Route path="/admin" component={AdminSettings} /><Route component={() => <Home />} /></Switch>;
}

function MarketplaceRoute() {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteProduct, setQuoteProduct] = useState<string | undefined>();
  const openQuote = (product?: string) => { setQuoteProduct(product); setQuoteOpen(true); };
  return <><MarketplacePage onQuote={openQuote} /><QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} product={quoteProduct} /><WhatsAppFloating /></>;
}

function App() {
  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}

export default App;