"use client";

import {
  Bold,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Quote,
  Sigma,
  Subscript,
  Superscript,
  Table2,
  Underline,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { env } from "@/config/env";
import { apiClient } from "@/lib/api/client";

const symbols = [
  "α",
  "β",
  "γ",
  "Δ",
  "θ",
  "π",
  "Ω",
  "√",
  "∞",
  "±",
  "×",
  "÷",
  "≤",
  "≥",
  "≠",
  "≈",
  "∑",
  "∫",
  "∠",
  "°",
  "½",
  "¼",
  "→",
  "⇌",
];

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char] ?? char,
  );
}

interface RichContentEditorProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly minHeight?: string;
}

export function RichContentEditor({
  label,
  value,
  onChange,
  placeholder,
  minHeight = "min-h-32",
}: RichContentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [showSymbols, setShowSymbols] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [formula, setFormula] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const editor = editorRef.current;
    if (
      editor &&
      document.activeElement !== editor &&
      !editor.contains(document.activeElement) &&
      editor.innerHTML !== value
    ) {
      editor.innerHTML = value;
    }
  }, [value]);

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (
      selection?.rangeCount &&
      editorRef.current?.contains(selection.anchorNode)
    ) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (selection && selectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }
  };

  const syncValue = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    rememberSelection();
  };

  const command = (name: string, value?: string) => {
    restoreSelection();
    document.execCommand(name, false, value);
    syncValue();
  };

  const insertHtml = (html: string) => {
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    syncValue();
  };

  const buttonClass =
    "text-muted-foreground hover:bg-primary/10 hover:text-primary grid size-8 shrink-0 place-items-center rounded-lg transition";

  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      setUploadError("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Images must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read this image."));
        reader.onload = () =>
          typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("Could not read this image."));
        reader.readAsDataURL(file);
      });
      const asset = await apiClient<{ id: string; url?: string | null }>(
        "/api/v1/admin/question-bank/assets",
        {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            base64: dataUrl,
          }),
        },
      );
      const src =
        asset.url ?? `${env.apiUrl}/api/v1/question-bank/assets/${asset.id}`;
      const alt = escapeHtml(imageAlt.trim());
      insertHtml(
        `<figure><img src="${escapeHtml(src)}" alt="${alt}" /><figcaption>${alt || "Diagram"}</figcaption></figure>`,
      );
      setShowImage(false);
      setImageAlt("");
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setUploading(false);
      if (imageFileRef.current) imageFileRef.current.value = "";
    }
  };

  return (
    <section className="border-border bg-background overflow-hidden rounded-2xl border">
      <div className="border-border bg-surface-subtle/70 flex flex-wrap items-center gap-1 border-b p-2">
        <button
          aria-label="Bold"
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("bold")}
          type="button"
        >
          <Bold className="size-4" />
        </button>
        <button
          aria-label="Italic"
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("italic")}
          type="button"
        >
          <Italic className="size-4" />
        </button>
        <button
          aria-label="Underline"
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("underline")}
          type="button"
        >
          <Underline className="size-4" />
        </button>
        <span className="bg-border mx-1 h-5 w-px" />
        <button
          aria-label="Heading 1"
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("formatBlock", "h2")}
          title="Section heading"
          type="button"
        >
          <Heading1 className="size-4" />
        </button>
        <button
          aria-label="Heading 2"
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("formatBlock", "h3")}
          title="Subheading"
          type="button"
        >
          <Heading2 className="size-4" />
        </button>
        <button
          aria-label="Paragraph"
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("formatBlock", "p")}
          title="Paragraph"
          type="button"
        >
          <span className="text-[.7rem] font-black">P</span>
        </button>
        <span className="bg-border mx-1 h-5 w-px" />
        <button
          aria-label="Subscript"
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("subscript")}
          type="button"
        >
          <Subscript className="size-4" />
        </button>
        <button
          aria-label="Superscript"
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("superscript")}
          type="button"
        >
          <Superscript className="size-4" />
        </button>
        <button
          aria-label="Bulleted list"
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("insertUnorderedList")}
          type="button"
        >
          <List className="size-4" />
        </button>
        <button
          aria-label="Numbered list"
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("insertOrderedList")}
          type="button"
        >
          <ListOrdered className="size-4" />
        </button>
        <button
          aria-label="Quote"
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command("formatBlock", "blockquote")}
          type="button"
        >
          <Quote className="size-4" />
        </button>
        <button
          aria-label="Insert table"
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            insertHtml(
              "<table><thead><tr><th>Heading</th><th>Heading</th></tr></thead><tbody><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></tbody></table><p><br></p>",
            )
          }
          title="Insert a 2-column table"
          type="button"
        >
          <Table2 className="size-4" />
        </button>
        <span className="bg-border mx-1 h-5 w-px" />
        <button
          aria-expanded={showSymbols}
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            rememberSelection();
            setShowSymbols((open) => !open);
          }}
          title="Insert math or science symbol"
          type="button"
        >
          <span className="text-[.9rem] font-bold">Ω</span>
        </button>
        <button
          aria-expanded={showFormula}
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            rememberSelection();
            setShowFormula((open) => !open);
            setShowImage(false);
          }}
          title="Insert formula"
          type="button"
        >
          <Sigma className="size-4" />
        </button>
        <button
          aria-expanded={showImage}
          className={buttonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            rememberSelection();
            setShowImage((open) => !open);
            setShowFormula(false);
          }}
          title="Insert image or diagram"
          type="button"
        >
          <ImagePlus className="size-4" />
        </button>
      </div>

      {showSymbols ? (
        <div className="border-border bg-surface grid grid-cols-8 gap-1 border-b p-2 sm:grid-cols-12">
          {symbols.map((symbol) => (
            <button
              className="text-foreground hover:bg-primary/10 hover:text-primary h-8 rounded-lg text-[.8rem]"
              key={symbol}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertHtml(symbol)}
              type="button"
            >
              {symbol}
            </button>
          ))}
        </div>
      ) : null}

      {showFormula ? (
        <form
          className="border-border bg-surface grid gap-2 border-b p-2 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!formula.trim()) return;
            insertHtml(
              `<span class="rich-inline">${formula.trim().replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] ?? char)}</span>`,
            );
            setFormula("");
            setShowFormula(false);
          }}
        >
          <input
            aria-label="Formula"
            className="border-border bg-background h-8 rounded-lg border px-2.5 text-[.65rem] outline-none"
            onChange={(event) => setFormula(event.target.value)}
            placeholder="Enter formula or calculation (e.g. v = u + at, √(x² + y²))"
            value={formula}
          />
          <button
            className="bg-primary text-primary-foreground h-8 rounded-lg px-3 text-[.62rem] font-bold"
            type="submit"
          >
            Insert formula
          </button>
        </form>
      ) : null}

      {showImage ? (
        <div className="border-border bg-surface grid gap-2 border-b p-2 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              aria-label="Image URL"
              className="border-border bg-background h-8 rounded-lg border px-2.5 text-[.65rem] outline-none"
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="Image URL (https://…)"
              value={imageUrl}
            />
            <input
              aria-label="Image description"
              className="border-border bg-background h-8 rounded-lg border px-2.5 text-[.65rem] outline-none"
              onChange={(event) => setImageAlt(event.target.value)}
              placeholder="Image description"
              value={imageAlt}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="border-border text-foreground hover:bg-surface-subtle inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[.6rem] font-bold"
              disabled={uploading}
              onClick={() => imageFileRef.current?.click()}
              type="button"
            >
              <Upload className="size-3.5" />
              {uploading ? "Uploading…" : "Upload image"}
            </button>
            <button
              className="bg-primary text-primary-foreground h-8 rounded-lg px-3 text-[.62rem] font-bold disabled:opacity-50"
              disabled={!/^https:\/\//i.test(imageUrl.trim())}
              onClick={() => {
                const escaped = escapeHtml(imageUrl.trim());
                const alt = escapeHtml(imageAlt.trim());
                insertHtml(
                  `<figure><img src="${escaped}" alt="${alt}" /><figcaption>${alt || "Diagram"}</figcaption></figure>`,
                );
                setImageUrl("");
                setImageAlt("");
                setShowImage(false);
              }}
              type="button"
            >
              Insert URL
            </button>
          </div>
          <input
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => void uploadImage(event.target.files?.[0])}
            ref={imageFileRef}
            type="file"
          />
          {uploadError ? (
            <p className="text-danger text-[.59rem] sm:col-span-2">
              {uploadError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="relative">
        {!value ? (
          <span className="text-muted-foreground pointer-events-none absolute top-3 left-3 text-[.68rem]">
            {placeholder ?? `Write ${label.toLowerCase()}…`}
          </span>
        ) : null}
        <div
          aria-label={label}
          className={`rich-content-editor text-foreground ${minHeight} [&_blockquote]:border-primary [&_blockquote]:text-muted-foreground [&_figcaption]:text-muted-foreground [&_td]:border-border [&_th]:border-border [&_th]:bg-surface-subtle max-h-[38vh] overflow-y-auto px-3 py-2.5 text-[.7rem] leading-6 outline-none [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_figcaption]:mt-1 [&_figcaption]:text-[.6rem] [&_figure]:my-3 [&_figure]:text-center [&_img]:mx-auto [&_img]:max-h-72 [&_img]:max-w-full [&_img]:rounded-xl [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-1.5 [&_th]:border [&_th]:p-1.5 [&_ul]:list-disc [&_ul]:pl-5`}
          contentEditable
          onBlur={rememberSelection}
          onInput={syncValue}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          ref={editorRef}
          suppressContentEditableWarning
        />
      </div>
      <div className="border-border bg-surface-subtle/40 text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t px-3 py-1.5 text-[.55rem]">
        <span>Rich text · formulas · symbols · images and diagrams</span>
        <span>Upload a diagram or insert an https image URL</span>
      </div>
    </section>
  );
}

export function RichContent({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={`rich-content [&_blockquote]:border-primary [&_figcaption]:text-muted-foreground [&_td]:border-border [&_th]:border-border [&_th]:bg-surface-subtle [&_span.rich-inline]:bg-primary/10 [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_figcaption]:mt-1 [&_figcaption]:text-[.65rem] [&_figure]:my-3 [&_figure]:text-center [&_img]:mx-auto [&_img]:max-h-80 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:object-contain [&_ol]:list-decimal [&_ol]:pl-5 [&_span.rich-inline]:rounded-md [&_span.rich-inline]:px-1 [&_span.rich-inline]:font-mono [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-1.5 [&_th]:border [&_th]:p-1.5 [&_ul]:list-disc [&_ul]:pl-5 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
