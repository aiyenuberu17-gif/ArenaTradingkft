import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, FileText, Lock, ShieldCheck, Trash2, UploadCloud, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type PublicDocument = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  previewPath: string;
  displayOrder: number;
  isActive: boolean;
};

type AdminDocument = PublicDocument & {
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

type PreviewResponse = { signedUrl: string; mimeType: string };

function parseJsonResponse<T>(response: Response): Promise<T> {
  return response.text().then((text) => {
    if (!text) {
      return {} as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return {} as T;
    }
  });
}

export function OfficialDocumentsSection() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warningOpen, setWarningOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<PublicDocument | null>(null);
  const [signedUrl, setSignedUrl] = useState<string>('');
  const [viewerMessage, setViewerMessage] = useState('');
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await fetch('/api/documents', { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Unable to load documents');
        }
        const data = await response.json() as PublicDocument[];
        setDocuments(Array.isArray(data) ? data : []);
        setError('');
      } catch {
        setDocuments([]);
        setError(t('documents.errorLoading', 'The official documents section is unavailable right now.'));
      } finally {
        setLoading(false);
      }
    };

    void loadDocuments();
  }, [t]);

  useEffect(() => {
    if (!viewerOpen && !warningOpen) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewerOpen, warningOpen]);

  const openPreview = (documentItem: PublicDocument) => {
    setSelectedDocument(documentItem);
    setViewerMessage('');
    setWarningOpen(true);
  };

  const continueToPreview = async () => {
    if (!selectedDocument) {
      return;
    }

    setIsRequestingAccess(true);
    setViewerMessage('');

    try {
      const response = await fetch(`/api/documents/${selectedDocument.id}/access`, { credentials: 'include' });
      if (!response.ok) {
        const data = await parseJsonResponse<{ error?: string }>(response);
        throw new Error(data.error ?? 'Unable to open the requested document.');
      }
      const data = await response.json() as PreviewResponse;
      if (!data.signedUrl) {
        throw new Error('Unable to generate a preview link for this document.');
      }
      setSignedUrl(data.signedUrl);
      setWarningOpen(false);
      setViewerOpen(true);
    } catch (error) {
      setViewerMessage(error instanceof Error ? error.message : 'Unable to preview this document.');
      setWarningOpen(false);
    } finally {
      setIsRequestingAccess(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!documents.length && !error) {
    return null;
  }

  return (
    <section className="border-t border-[#e7edf1] bg-white py-20 sm:py-24">
      <div className="container-wide">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-[#00a676]">{t('documents.title', 'Official Company Documents')}</p>
            <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-.05em] text-[#0b1f3a]">
              {t('documents.subtitle', 'Verified materials for official review.')}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              {t('documents.description', 'Review protected documentation published by CompuTrade APS for verification purposes only.')}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dce6ec] bg-[#f8fafc] px-4 py-2 text-xs font-semibold uppercase tracking-[.2em] text-[#0b1f3a]">
            <ShieldCheck size={15} className="text-[#00a676]" />
            {t('documents.verifiedBadge', 'Verified document access')}
          </div>
        </div>

        {error ? (
          <div className="mt-8 rounded-2xl border border-[#e9cfcf] bg-[#fff5f5] px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {documents.map((documentItem) => (
              <article key={documentItem.id} className="overflow-hidden rounded-[22px] border border-[#dce6ec] bg-[#f8fafc] shadow-[0_10px_30px_rgba(11,31,58,.06)]">
                <div className="relative h-48 overflow-hidden border-b border-[#e2e8ee] bg-[#0b1f3a]">
                  {documentItem.previewPath ? (
                    <>
                      <img
                        src={documentItem.previewPath}
                        alt={documentItem.title}
                        loading="lazy"
                        className="h-full w-full object-cover blur-[14px] brightness-90"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(11,31,58,0.35),transparent)]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full border border-white/40 bg-white/20 px-4 py-2 text-[11px] font-bold uppercase tracking-[.2em] text-white shadow-lg backdrop-blur-md">
                          COMPU TRADE APS
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-300 text-sm font-semibold uppercase tracking-[.2em] text-slate-700">
                      {t('documents.noPreviewAvailable', 'No preview available')}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-[#d8e7df] bg-[#e9f8f1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[.16em] text-[#00865f]">
                      {documentItem.category}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0b1f3a]">
                      <Lock size={13} className="text-[#00a676]" />
                      {t('documents.officialBadge', 'Official document')}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold tracking-[-.035em] text-[#0b1f3a]">{documentItem.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{documentItem.description || t('documents.noDescription', 'Verified company information for official review.')}</p>
                  <div className="mt-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#0b1f3a]/70">
                    <Check size={13} className="text-[#00a676]" />
                    {t('documents.verifiedDocument', 'Verified document')}
                  </div>
                  <button
                    type="button"
                    onClick={() => openPreview(documentItem)}
                    className="mt-6 inline-flex items-center gap-2 rounded-[10px] bg-[#0b1f3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#12345c]"
                  >
                    <Eye size={16} />
                    {t('documents.previewDocument', 'Preview document')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {warningOpen && selectedDocument ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#07172a]/80 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="protected-document-title">
          <div className="w-full max-w-[560px] rounded-[24px] border border-white/10 bg-white p-6 shadow-2xl sm:p-8" onContextMenu={(event) => event.preventDefault()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.22em] text-[#00a676]">{t('documents.protectedPreview', 'Protected preview')}</p>
                <h3 id="protected-document-title" className="mt-3 font-display text-[clamp(1.65rem,3vw,2.2rem)] font-extrabold tracking-[-.04em] text-[#0b1f3a]">
                  {t('documents.warningTitle', 'Protected official document')}
                </h3>
              </div>
              <button type="button" onClick={() => { setWarningOpen(false); setSelectedDocument(null); }} className="rounded-full border border-[#dce6ec] p-2 text-slate-500 transition hover:border-[#00a676] hover:text-[#0b1f3a]" aria-label={t('common.close', 'Close')}>
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-[#dce6ec] bg-[#f8fafc] p-5 text-sm leading-7 text-slate-600">
              <p className="font-semibold text-[#0b1f3a]">{t('documents.warningBody', 'This official company document is provided for verification purposes only.')}</p>
              <p className="mt-3">{t('documents.warningBodyTwo', 'It is the property of CompuTrade APS and must not be copied, reproduced, downloaded, redistributed, or used for purposes unrelated to verification without authorization.')}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={continueToPreview} disabled={isRequestingAccess} className="rounded-[10px] bg-[#0b1f3a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#12345c] disabled:cursor-wait disabled:opacity-70">
                {isRequestingAccess ? t('documents.requestingAccess', 'Preparing preview…') : t('documents.continuePreview', 'Continue to preview')}
              </button>
              <button type="button" onClick={() => { setWarningOpen(false); setSelectedDocument(null); }} className="rounded-[10px] border border-[#dce6ec] px-5 py-3 text-sm font-semibold text-[#0b1f3a] transition hover:border-[#00a676] hover:text-[#00865f]">
                {t('documents.cancel', 'Cancel')}
              </button>
            </div>
            {viewerMessage ? <p className="mt-4 text-sm font-semibold text-red-700">{viewerMessage}</p> : null}
          </div>
        </div>
      ) : null}

      {viewerOpen && signedUrl ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#07172a]/90 px-3 py-4 sm:px-6" role="dialog" aria-modal="true" aria-labelledby="document-viewer-title">
          <div className="flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1f3a] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#78d8bc]">{t('documents.viewerTitle', 'Protected official document')}</p>
                <h3 id="document-viewer-title" className="mt-1 font-display text-lg font-bold tracking-[-.03em] text-white">
                  {selectedDocument?.title ?? t('documents.viewerTitle', 'Protected official document')}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[.16em] text-[#a8d6c3]">
                  COMPU TRADE APS
                </div>
                <button type="button" onClick={() => { setViewerOpen(false); setSignedUrl(''); setSelectedDocument(null); }} className="rounded-full border border-white/10 p-2 transition hover:bg-white/10" aria-label={t('common.close', 'Close')}>
                  <X size={17} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-white p-2 sm:p-4">
              <div className="relative h-full overflow-hidden rounded-[18px] border border-[#dce6ec] bg-[#f6f8fa]" onContextMenu={(event) => event.preventDefault()}>
                <iframe
                  src={signedUrl}
                  title={selectedDocument?.title ?? 'Protected document'}
                  className="h-full w-full"
                  loading="lazy"
                  onContextMenu={(event) => event.preventDefault()}
                />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,166,118,0.15),transparent_45%)]" />
              </div>
            </div>
            <div className="border-t border-white/10 px-4 py-3 text-center text-[12px] leading-6 text-[#d7e4ea] sm:px-6">
              <p>{t('documents.viewerFooter', 'For verification purposes only. Reproduction and distribution are prohibited.')}</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function CompanyDocumentsManagement() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Official Registration',
    previewPath: '',
    displayOrder: '0',
    isActive: true,
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const categoryOptions = useMemo(() => [
    'Company Registration',
    'Business Certificate',
    'VAT Registration',
    'Official Registration',
    'Legal Document',
    'Compliance Document',
    'Other',
  ], []);

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/admin/documents', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Unable to load documents');
      }
      const data = await response.json() as AdminDocument[];
      setDocuments(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setError(t('documents.errorLoadingAdmin', 'The document management list could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, [t]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ title: '', description: '', category: 'Official Registration', previewPath: '', displayOrder: '0', isActive: true });
    setDocumentFile(null);
    setPreviewFile(null);
  };

  const startEdit = (documentItem: AdminDocument) => {
    setEditingId(documentItem.id);
    setForm({
      title: documentItem.title,
      description: documentItem.description ?? '',
      category: documentItem.category,
      previewPath: documentItem.previewPath,
      displayOrder: String(documentItem.displayOrder),
      isActive: documentItem.isActive,
    });
    setDocumentFile(null);
    setPreviewFile(null);
    setNotice('');
    setError('');
  };

  const uploadPreview = async (file: File) => {
    const response = await fetch('/api/admin/documents/upload-preview', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    const data = await parseJsonResponse<{ previewPath?: string; previewToken?: string; error?: string }>(response);
    if (!response.ok || !data.previewPath) {
      throw new Error(data.error ?? 'The preview image could not be uploaded.');
    }
    return { previewPath: data.previewPath, previewToken: data.previewToken };
  };

  const uploadDocument = async (file: File) => {
    const response = await fetch('/api/admin/documents/upload', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'x-file-name': file.name,
      },
      body: file,
    });
    const data = await parseJsonResponse<{ storagePath?: string; storageToken?: string; fileName?: string; mimeType?: string; fileSize?: number; error?: string }>(response);
    if (!response.ok || !data.storagePath) {
      throw new Error(data.error ?? 'The document could not be uploaded.');
    }
    return data;
  };

  const cleanupUploaded = async (storageToken?: string, previewToken?: string) => {
    try {
      await fetch('/api/admin/documents/cleanup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageToken, previewToken }),
      });
    } catch (err) {
      // Best-effort cleanup; failures are logged server-side.
      console.warn('Cleanup request failed', err);
    }
  };

  const saveDocument = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

      try {
      let previewPath = form.previewPath;
      let previewToken: string | undefined = undefined;
      let storageToken: string | undefined = undefined;
      if (previewFile) {
        const p = await uploadPreview(previewFile);
        previewPath = p.previewPath;
        previewToken = p.previewToken;
      }

      if (editingId) {
        const response = await fetch(`/api/admin/documents/${editingId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category.trim(),
            previewPath,
            displayOrder: Number(form.displayOrder) || 0,
            isActive: form.isActive,
          }),
        });
        const data = await parseJsonResponse<{ error?: string }>(response);
        if (!response.ok) {
          throw new Error(data.error ?? 'The document could not be updated.');
        }
        setNotice('Document metadata updated.');
      } else {
        if (!documentFile) {
          throw new Error('Please choose a PDF document to upload.');
        }
        const uploadData = await uploadDocument(documentFile);
        storageToken = uploadData.storageToken;
        const response = await fetch('/api/admin/documents', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category.trim(),
            storagePath: uploadData.storagePath,
            storageToken,
            previewPath,
            previewToken,
            fileName: uploadData.fileName ?? documentFile.name,
            mimeType: uploadData.mimeType ?? 'application/pdf',
            fileSize: uploadData.fileSize ?? documentFile.size,
            displayOrder: Number(form.displayOrder) || 0,
            isActive: form.isActive,
          }),
        });
        const data = await parseJsonResponse<{ error?: string }>(response);
        if (!response.ok) {
          // Attempt cleanup of any uploaded files for this flow
          await cleanupUploaded(storageToken, previewToken);
          throw new Error(data.error ?? 'The document could not be created.');
        }
        setNotice('Document uploaded and published.');
      }

      await loadDocuments();
      resetForm();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The document could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const replaceDocument = async (documentId: number, file: File | null) => {
    if (!file) {
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch(`/api/admin/documents/${documentId}/replace`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-file-name': file.name,
        },
        body: file,
      });
      const data = await parseJsonResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error ?? 'The replacement document could not be uploaded.');
      }
      await loadDocuments();
      setNotice('Document replaced successfully.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The document could not be replaced.');
    } finally {
      setSaving(false);
    }
  };

  const publishState = async (documentId: number, nextState: boolean) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState }),
      });
      const data = await parseJsonResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error ?? 'The document status could not be changed.');
      }
      await loadDocuments();
      setNotice(nextState ? 'Document published.' : 'Document unpublished.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The document status could not be changed.');
    } finally {
      setSaving(false);
    }
  };

  const deleteDocument = async (documentId: number) => {
    if (!window.confirm('Remove this official document from the website?')) {
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, { method: 'DELETE', credentials: 'include' });
      const data = await parseJsonResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error ?? 'The document could not be removed.');
      }
      await loadDocuments();
      setNotice('Document removed.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The document could not be removed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-[#dce6ec] bg-white p-6 shadow-[0_5px_20px_rgba(11,31,58,.05)] sm:p-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-[#00a676]">{t('documents.adminEyebrow', 'Admin · Company documents')}</p>
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-[-.045em]">{t('documents.adminTitle', 'Manage official company documents')}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{t('documents.adminDescription', 'Upload, edit, replace, publish or remove official documents shown on the public About page.')}</p>
        </div>
        <span className="text-sm font-semibold text-slate-400">{loading ? t('common.loading', 'Loading…') : `${documents.length} ${t('documents.documentsLabel', 'documents')}`}</span>
      </div>

      <form onSubmit={saveDocument} className="mt-8 grid gap-4 border-t border-[#edf1f3] pt-7 md:grid-cols-2" data-testid="form-admin-documents">
        <label className="block text-sm font-semibold text-[#0b1f3a] md:col-span-2">
          {t('documents.titleField', 'Document title')}
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required className="mt-2 h-11 w-full rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 text-sm outline-none focus:border-[#00a676]" />
        </label>
        <label className="block text-sm font-semibold text-[#0b1f3a] md:col-span-2">
          {t('documents.descriptionField', 'Description')}
          <textarea rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 w-full resize-y rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 py-3 text-sm outline-none focus:border-[#00a676]" />
        </label>
        <label className="block text-sm font-semibold text-[#0b1f3a]">
          {t('documents.categoryField', 'Category')}
          <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-2 h-11 w-full rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 text-sm outline-none focus:border-[#00a676]">
            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-[#0b1f3a]">
          {t('documents.orderField', 'Display order')}
          <input type="number" min="0" value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: event.target.value }))} className="mt-2 h-11 w-full rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-3.5 text-sm outline-none focus:border-[#00a676]" />
        </label>
        <label className="flex items-center gap-3 rounded-[9px] border border-[#d6e0e8] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#0b1f3a]">
          <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-[#d6e0e8] text-[#00a676]" />
          {t('documents.publishField', 'Publish publicly')}
        </label>
        <label className="flex flex-col gap-2 rounded-[9px] border border-dashed border-[#b9cbd5] bg-[#f8fafc] p-4 text-sm font-semibold text-[#0b1f3a] md:col-span-2">
          <span>{editingId ? t('documents.replaceDocument', 'Replace document PDF') : t('documents.uploadDocument', 'Upload PDF document')}</span>
          <input type="file" accept="application/pdf" onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)} className="block text-sm font-normal text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-[#e5f9ed] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#00865f]" />
        </label>
        <label className="flex flex-col gap-2 rounded-[9px] border border-dashed border-[#b9cbd5] bg-[#f8fafc] p-4 text-sm font-semibold text-[#0b1f3a] md:col-span-2">
          <span>{t('documents.uploadPreview', 'Upload preview image')}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setPreviewFile(event.target.files?.[0] ?? null)} className="block text-sm font-normal text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-[#e5f9ed] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#00865f]" />
        </label>

        {error ? <p role="alert" className="md:col-span-2 text-sm font-semibold text-red-600">{error}</p> : null}
        {notice ? <p role="status" className="md:col-span-2 flex items-center gap-2 text-sm font-semibold text-[#00865f]"><Check size={15} />{notice}</p> : null}

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button type="submit" disabled={saving} className="rounded-[10px] bg-[#0b1f3a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#12345c] disabled:cursor-wait disabled:opacity-60">
            {saving ? t('common.loading', 'Loading…') : editingId ? t('documents.saveChanges', 'Save changes') : t('documents.createDocument', 'Create document')}
          </button>
          <button type="button" onClick={resetForm} className="rounded-[10px] border border-[#dce6ec] px-5 py-3 text-sm font-bold text-[#0b1f3a] transition hover:border-[#00a676] hover:text-[#00865f]">
            {t('documents.clearForm', 'Clear form')}
          </button>
        </div>
      </form>

      <div className="mt-8 border-t border-[#edf1f3] pt-6">
        <div className="space-y-4">
          {documents.map((documentItem) => (
            <div key={documentItem.id} className="rounded-[18px] border border-[#dce6ec] bg-[#f8fafc] p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e5f9ed] text-[#00a676]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-bold tracking-[-.03em] text-[#0b1f3a]">{documentItem.title}</p>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.16em] ${documentItem.isActive ? 'bg-[#e5f9ed] text-[#00865f]' : 'bg-[#f6ecec] text-[#8b5a5a]'}`}>
                        {documentItem.isActive ? t('documents.published', 'Published') : t('documents.unpublished', 'Unpublished')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{documentItem.category}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{documentItem.description || t('documents.noDescription', 'No description supplied.')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => startEdit(documentItem)} className="rounded-[9px] border border-[#dce6ec] px-3 py-2 text-xs font-bold uppercase tracking-[.16em] text-[#0b1f3a] transition hover:border-[#00a676] hover:text-[#00865f]">
                    {t('documents.edit', 'Edit')}
                  </button>
                  <button type="button" onClick={() => void publishState(documentItem.id, !documentItem.isActive)} className="rounded-[9px] border border-[#dce6ec] px-3 py-2 text-xs font-bold uppercase tracking-[.16em] text-[#0b1f3a] transition hover:border-[#00a676] hover:text-[#00865f]">
                    {documentItem.isActive ? t('documents.unpublish', 'Unpublish') : t('documents.publish', 'Publish')}
                  </button>
                  <label className="cursor-pointer rounded-[9px] border border-[#dce6ec] px-3 py-2 text-xs font-bold uppercase tracking-[.16em] text-[#0b1f3a] transition hover:border-[#00a676] hover:text-[#00865f]">
                    <input type="file" accept="application/pdf" className="sr-only" onChange={(event) => void replaceDocument(documentItem.id, event.target.files?.[0] ?? null)} />
                    {t('documents.replace', 'Replace')}
                  </label>
                  <button type="button" onClick={() => void deleteDocument(documentItem.id)} className="rounded-[9px] border border-[#f1d7d7] px-3 py-2 text-xs font-bold uppercase tracking-[.16em] text-red-700 transition hover:bg-red-50">
                    <span className="inline-flex items-center gap-2"><Trash2 size={13} /> {t('documents.delete', 'Delete')}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
