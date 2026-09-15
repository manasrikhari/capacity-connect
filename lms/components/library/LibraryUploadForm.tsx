"use client";

import { CheckCircle2, FileUp, Loader2, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  createLibraryItemAction,
  updateLibraryItemAction,
} from "@/app/admin/library/actions";
import { TYPE_META, formatBytes } from "@/components/library/LibraryItemCard";
import type { LibraryItemView } from "@/components/library/LibraryItemCard";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import type { LibraryItemType } from "@/app/generated/prisma/enums";
import { initialActionState } from "@/lib/action-state";
import { LIBRARY_ITEM_TYPES } from "@/lib/validations/library";
import { cn } from "@/lib/utils";

type SourceState = {
  fileUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  label: string;
};

const ACCEPT =
  ".mp4,.webm,.pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg," +
  "video/mp4,video/webm,application/pdf,image/png,image/jpeg";

function isLocalUpload(fileUrl: string | null | undefined) {
  return !!fileUrl && fileUrl.startsWith("/api/files/");
}

export function LibraryUploadForm({
  open,
  onClose,
  item,
  batchId,
  skills,
}: {
  open: boolean;
  onClose: () => void;
  item?: LibraryItemView | null;
  batchId: string;
  skills: { id: string; name: string }[];
}) {
  const isEdit = !!item;
  const action = item ? updateLibraryItemAction.bind(null, item.id) : createLibraryItemAction;
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const editingLocal = isLocalUpload(item?.fileUrl);
  const [mode, setMode] = useState<"upload" | "external">(
    isEdit && !editingLocal ? "external" : "upload"
  );
  const [uploaded, setUploaded] = useState<SourceState | null>(
    editingLocal && item
      ? {
          fileUrl: item.fileUrl,
          mimeType: item.mimeType ?? "",
          fileSizeBytes: item.fileSizeBytes ?? 0,
          label: "Current file",
        }
      : null
  );
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Item updated" : "Item added to library");
      formRef.current?.reset();
      onClose();
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function startUpload(file: File) {
    setUploadError(null);
    setUploading(true);
    setProgress(0);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("batchId", batchId);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      xhrRef.current = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          setUploaded({
            fileUrl: res.fileUrl,
            mimeType: res.mimeType ?? file.type,
            fileSizeBytes: res.fileSizeBytes ?? file.size,
            label: file.name,
          });
        } catch {
          setUploadError("Upload succeeded but the response was unreadable");
        }
      } else {
        let msg = "Upload failed";
        try {
          msg = JSON.parse(xhr.responseText).error || msg;
        } catch {
          /* keep default */
        }
        setUploadError(msg);
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      xhrRef.current = null;
      setUploadError("Upload failed");
    };
    xhr.send(fd);
  }

  function onFilePicked(file: File | undefined) {
    if (!file) return;
    startUpload(file);
  }

  function clearUpload() {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setUploaded(null);
    setUploading(false);
    setProgress(0);
    setUploadError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const typeOptions = LIBRARY_ITEM_TYPES as readonly LibraryItemType[];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit library item" : "Add to library"}>
      <form ref={formRef} action={formAction} className="space-y-4">
        <FormField label="Title" htmlFor="title" error={state?.fieldErrors?.title?.[0]}>
          <Input id="title" name="title" defaultValue={item?.title} placeholder="e.g. Intro to Sales Calls" />
        </FormField>

        <FormField label="Type" htmlFor="type" error={state?.fieldErrors?.type?.[0]}>
          <Select id="type" name="type" defaultValue={item?.type ?? typeOptions[0]}>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {TYPE_META[t].label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Description (optional)"
          htmlFor="description"
          error={state?.fieldErrors?.description?.[0]}
        >
          <Textarea
            id="description"
            name="description"
            defaultValue={item?.description ?? ""}
            placeholder="What this resource covers…"
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Subject (optional)" htmlFor="subject" error={state?.fieldErrors?.subject?.[0]}>
            <Input id="subject" name="subject" defaultValue={item?.subject ?? ""} placeholder="e.g. Communication" />
          </FormField>
          <FormField
            label="Duration mins (optional)"
            htmlFor="durationMins"
            error={state?.fieldErrors?.durationMins?.[0]}
          >
            <Input
              id="durationMins"
              name="durationMins"
              type="number"
              min={0}
              defaultValue={item?.durationMins ?? ""}
              placeholder="e.g. 45"
            />
          </FormField>
        </div>

        <FormField label="Skill (optional)" htmlFor="skillId" error={state?.fieldErrors?.skillId?.[0]}>
          <Select id="skillId" name="skillId" defaultValue={item?.skillId ?? ""}>
            <option value="">— None —</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormField>

        {/* Source selector: uploaded file vs external URL. */}
        <div>
          <div className="mb-2 inline-flex rounded-[10px] border border-hair bg-sunken p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={cn(
                "rounded-[8px] px-3 py-1 font-medium transition-colors",
                mode === "upload" ? "bg-paper text-ink-900" : "text-ink-500"
              )}
            >
              Upload file
            </button>
            <button
              type="button"
              onClick={() => setMode("external")}
              className={cn(
                "rounded-[8px] px-3 py-1 font-medium transition-colors",
                mode === "external" ? "bg-paper text-ink-900" : "text-ink-500"
              )}
            >
              External URL
            </button>
          </div>

          {mode === "upload" ? (
            <div>
              {/* Hidden fields carry the uploaded result into the server action. */}
              <input type="hidden" name="fileUrl" value={uploaded?.fileUrl ?? ""} />
              <input type="hidden" name="mimeType" value={uploaded?.mimeType ?? ""} />
              <input type="hidden" name="fileSizeBytes" value={uploaded?.fileSizeBytes ?? ""} />

              {uploaded ? (
                <div className="flex items-center justify-between gap-3 rounded-[10px] border border-hair bg-paper px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2 text-sm text-ink-700">
                    <CheckCircle2 className="size-4 shrink-0 text-sage-700" />
                    <span className="truncate">{uploaded.label}</span>
                    {uploaded.fileSizeBytes > 0 && (
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                        {formatBytes(uploaded.fileSizeBytes)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearUpload}
                    className="rounded-full p-1 text-ink-300 transition-colors hover:bg-sunken hover:text-ink-700"
                    aria-label="Remove file"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    onFilePicked(e.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed px-4 py-6 text-center transition-colors",
                    dragOver ? "border-plum-300 bg-plum-50" : "border-hair-strong bg-sunken/40"
                  )}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT}
                    className="sr-only"
                    onChange={(e) => onFilePicked(e.target.files?.[0])}
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="size-5 animate-spin text-plum-600" />
                      <div className="h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-hair">
                        <div
                          className="h-full rounded-full bg-plum-600 transition-[width] duration-150"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                        Uploading {progress}%
                      </span>
                    </>
                  ) : (
                    <>
                      <FileUp className="size-5 text-ink-300" />
                      <span className="text-sm text-ink-700">Drop a file or click to browse</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                        Video · PDF · Slides · Docs · Images · 200 MB max
                      </span>
                    </>
                  )}
                </label>
              )}
              {uploadError && <p className="mt-1 text-xs text-status-unpaid">{uploadError}</p>}
              {state?.fieldErrors?.fileUrl?.[0] && (
                <p className="mt-1 text-xs text-status-unpaid">{state.fieldErrors.fileUrl[0]}</p>
              )}
            </div>
          ) : (
            <FormField
              label="External URL"
              htmlFor="externalUrl"
              error={state?.fieldErrors?.externalUrl?.[0]}
            >
              <Input
                id="externalUrl"
                name="externalUrl"
                type="url"
                defaultValue={isEdit && !editingLocal ? item?.fileUrl : ""}
                placeholder="https://youtube.com/…  or  https://drive.google.com/…"
              />
            </FormField>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending} disabled={uploading}>
            {isEdit ? "Save changes" : "Add item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
