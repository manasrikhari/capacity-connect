"use client";

import { FileText, Link2, Loader2, Type, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ProposedGraphPreview,
  type Proposal,
} from "@/components/knowledge/ProposedGraphPreview";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

type Mode = "pdf" | "link" | "text";

/**
 * Three ways in: a PDF, a link, or pasted text. The PDF path uses XHR rather
 * than fetch so the upload can report progress, matching LibraryUploadForm.
 * Pasting text is always available, so the flow never dead-ends when a key is
 * missing or a PDF turns out to be scanned images.
 */
export function KnowledgeIngestForm({ linkEnabled }: { linkEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>("pdf");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function fail(message: string) {
    setBusy(false);
    setProgress(0);
    setPhase("");
    toast.error(message);
  }

  function accept(data: Proposal) {
    setBusy(false);
    setProgress(0);
    setPhase("");
    if (data.nodes.length === 0) {
      toast.error("No concepts could be pulled out of that. Try a more focused extract.");
      return;
    }
    setProposal(data);
  }

  function sendPdf(file: File) {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported here. Paste the text for other formats.");
      return;
    }
    setFileName(file.name);
    setBusy(true);
    setPhase("Uploading");
    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/knowledge/ingest");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(pct);
        if (pct >= 100) setPhase("Reading the document");
      }
    };
    xhr.onload = () => {
      xhrRef.current = null;
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) accept(body as Proposal);
        else fail(body.error ?? "That document could not be read.");
      } catch {
        fail("That document could not be read.");
      }
    };
    xhr.onerror = () => {
      xhrRef.current = null;
      fail("The upload failed.");
    };
    xhr.send(form);
  }

  async function sendJson(payload: Record<string, string>) {
    setBusy(true);
    setPhase(payload.url ? "Fetching the page" : "Reading the text");
    try {
      const res = await fetch("/api/knowledge/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (res.ok) accept(body as Proposal);
      else fail(body.error ?? "That source could not be read.");
    } catch {
      fail("That source could not be read.");
    }
  }

  if (proposal) {
    return (
      <ProposedGraphPreview
        proposal={proposal}
        onDone={() => {
          setProposal(null);
          setFileName(null);
          setUrl("");
          setText("");
        }}
      />
    );
  }

  const tabs: { id: Mode; label: string; icon: typeof FileText }[] = [
    { id: "pdf", label: "Upload PDF", icon: FileText },
    { id: "link", label: "Paste link", icon: Link2 },
    { id: "text", label: "Paste text", icon: Type },
  ];

  return (
    <Card className="space-y-4">
      <div className="inline-flex rounded-[10px] border border-hair bg-sunken p-0.5 text-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={busy}
            onClick={() => setMode(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1 font-medium transition-colors",
              mode === t.id ? "bg-paper text-ink-900" : "text-ink-500",
            )}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {busy ? (
        <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-hair-strong bg-sunken/40 px-4 py-10 text-center">
          <Loader2 className="size-5 animate-spin text-plum-600" />
          {progress > 0 && progress < 100 && (
            <div className="h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-hair">
              <div
                className="h-full rounded-full bg-plum-600 transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            {phase}
            {phase === "Reading the document" ? " · this can take a minute" : ""}
          </span>
        </div>
      ) : (
        <>
          {mode === "pdf" && (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) sendPdf(f);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed px-4 py-10 text-center transition-colors",
                dragOver ? "border-plum-300 bg-plum-50" : "border-hair-strong bg-sunken/40",
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) sendPdf(f);
                }}
              />
              <Upload className="size-5 text-ink-300" />
              <span className="text-sm text-ink-700">
                Drop a PDF here, or click to choose one
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                Text-based PDF · 20 MB max
              </span>
              {fileName && (
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-ink-500">
                  {fileName}
                  <button
                    type="button"
                    aria-label="Clear file"
                    onClick={(e) => {
                      e.preventDefault();
                      setFileName(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
            </label>
          )}

          {mode === "link" && (
            <div className="space-y-2">
              <Label htmlFor="kb-url">Page address</Label>
              <Input
                id="kb-url"
                type="url"
                value={url}
                disabled={!linkEnabled}
                placeholder="https://mausam.imd.gov.in/..."
                onChange={(e) => setUrl(e.target.value)}
              />
              {linkEnabled ? (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={!url.trim()}
                    onClick={() => sendJson({ url: url.trim() })}
                  >
                    Read this page
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-ink-500">
                  Link reading is not configured on this server. Upload the PDF or paste the text
                  instead.
                </p>
              )}
            </div>
          )}

          {mode === "text" && (
            <div className="space-y-2">
              <Label htmlFor="kb-text">Paste the passage</Label>
              <Textarea
                id="kb-text"
                value={text}
                placeholder="Paste a syllabus, an SOP section, or lecture notes…"
                onChange={(e) => setText(e.target.value)}
                className="min-h-40"
              />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                  {text.length} characters
                </span>
                <Button
                  type="button"
                  disabled={text.trim().length < 200}
                  onClick={() => sendJson({ text })}
                >
                  Read this text
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
