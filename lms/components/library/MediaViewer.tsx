import { Download, ExternalLink } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import type { LibraryItemType } from "@/app/generated/prisma/enums";

type ViewerItem = {
  title: string;
  type: LibraryItemType;
  fileUrl: string;
  mimeType: string | null;
};

/** Extract a YouTube video id from watch / youtu.be / embed URLs, else null. */
function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (u.pathname.startsWith("/embed/")) return url;
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

const isLocal = (url: string) => url.startsWith("/api/files/");

export function MediaViewer({ item }: { item: ViewerItem }) {
  const { fileUrl, mimeType } = item;
  const mime = mimeType ?? "";
  const isVideo = mime.startsWith("video/") || item.type === "RECORDED_LECTURE";
  const isPdf = mime === "application/pdf" || (isLocal(fileUrl) && fileUrl.endsWith(".pdf"));
  const embed = youtubeEmbedUrl(fileUrl);

  const frame = "overflow-hidden rounded-2xl border border-hair bg-ink-900/[0.02]";

  // 1) YouTube (external link) → responsive iframe embed.
  if (embed) {
    return (
      <div className={`${frame} aspect-video`}>
        <iframe
          src={embed}
          title={item.title}
          className="size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // 2) Local/hosted video → native player with Range-backed seeking.
  if (isVideo && (isLocal(fileUrl) || mime.startsWith("video/"))) {
    return (
      <div className={`${frame} aspect-video`}>
        <video controls preload="metadata" className="size-full" src={fileUrl}>
          Your browser does not support embedded video.
        </video>
      </div>
    );
  }

  // 3) PDF → embedded iframe.
  if (isPdf) {
    return (
      <div className={`${frame} h-[75vh]`}>
        <iframe src={fileUrl} title={item.title} className="size-full" />
      </div>
    );
  }

  // 4) Anything else (external doc/drive link, Office file) → open / download.
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-hair-strong bg-sunken/40 px-6 py-12 text-center">
      <p className="text-sm text-ink-500">
        This resource opens in a new tab or can be downloaded.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("primary", "md")}
        >
          <ExternalLink className="size-4" />
          Open in new tab
        </a>
        {isLocal(fileUrl) && (
          <a href={fileUrl} download className={buttonClasses("outline", "md")}>
            <Download className="size-4" />
            Download
          </a>
        )}
      </div>
    </div>
  );
}
