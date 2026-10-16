"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Eye,
  Flag,
  ImageIcon,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  WandSparkles,
  LoaderCircle,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { Pagination } from "@/components/admin-ui";
import {
  RichContent,
  RichContentEditor,
} from "@/components/rich-content-editor";
import { AdminShell } from "@/components/layout";
import { AdminIcon, Select } from "@/components/ui";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type WorkspaceTab = "overview" | "posts" | "editor" | "discussions" | "media";
type PostStatus =
  "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
type DiscussionStatus = "PENDING" | "APPROVED" | "FLAGGED" | "HIDDEN";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: string;
  authorName: string;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  tags: string[];
  readTimeMinutes: number;
  status: PostStatus;
  featured: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BlogComment {
  id: string;
  postId: string;
  articleTitle: string;
  authorName: string;
  avatarUrl: string | null;
  body: string;
  status: DiscussionStatus;
  createdAt: string;
  updatedAt: string;
}

interface BlogMedia {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  usageCount: number;
  createdAt: string;
}

interface BlogResponse {
  generatedAt: string;
  metrics: {
    totalArticles: number;
    published: number;
    drafts: number;
    scheduled: number;
    editorialQueue: number;
    totalViews: number;
    discussions: number;
    pendingDiscussions: number;
    flaggedDiscussions: number;
    approvedDiscussions: number;
    hiddenDiscussions: number;
  };
  featured: BlogPost | null;
  queue: BlogPost[];
  topStories: BlogPost[];
  posts: BlogPost[];
  comments: BlogComment[];
  media: BlogMedia[];
}

interface SavePostInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string[];
  category: string;
  authorName: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  tags: string[];
  readTimeMinutes: number;
  status: PostStatus;
  featured: boolean;
  scheduledAt?: string;
}

interface MagicBlogDraft {
  title: string;
  excerpt: string;
  contentHtml: string;
  category: string;
  tags: string[];
  readTimeMinutes: number;
  status: "DRAFT";
}

interface BlogPreviewValue {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  authorName: string;
  coverImageUrl: string;
  coverImageAlt: string;
  tags: string[];
  readTimeMinutes: number;
}

const TABS: ReadonlyArray<{ label: string; value: WorkspaceTab }> = [
  { label: "Overview", value: "overview" },
  { label: "Articles", value: "posts" },
  { label: "Editor", value: "editor" },
  { label: "Discussions", value: "discussions" },
  { label: "Media", value: "media" },
];
const STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};
const DISCUSSION_LABELS: Record<DiscussionStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  FLAGGED: "Flagged",
  HIDDEN: "Hidden",
};
const dateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
        hour12: true,
        timeZone: "Africa/Lagos",
      }).format(new Date(value))
    : "Not published";
const compactNumber = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const isPreviewableImageUrl = (value: string) => {
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" ||
      (url.protocol === "http:" && url.hostname === "localhost")
    );
  } catch {
    return false;
  }
};

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );

const contentToEditorHtml = (blocks: string[]) =>
  blocks
    .map((block) => {
      const value = block.trim();
      if (!value) return "";
      return /<\/?[a-z][\s\S]*>/i.test(value)
        ? value
        : `<p>${escapeHtml(value).replace(/\n/g, "<br />")}</p>`;
    })
    .filter(Boolean)
    .join("");

function StatusPill({
  status,
}: {
  readonly status: PostStatus | DiscussionStatus;
}) {
  const label =
    status in STATUS_LABELS
      ? STATUS_LABELS[status as PostStatus]
      : DISCUSSION_LABELS[status as DiscussionStatus];
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2.5 py-1 text-[.6rem] font-bold",
        status === "PUBLISHED" || status === "APPROVED"
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : status === "FLAGGED"
            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
            : status === "SCHEDULED"
              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      )}
    >
      {label}
    </span>
  );
}

function Cover({
  post,
  className,
}: {
  readonly post: BlogPost;
  readonly className?: string;
}) {
  return post.coverImageUrl ? (
    <span
      className={cn("relative block overflow-hidden bg-violet-100", className)}
    >
      <Image
        alt={post.coverImageAlt ?? ""}
        className="object-cover"
        fill
        loading="lazy"
        sizes="320px"
        src={post.coverImageUrl}
      />
    </span>
  ) : (
    <span
      className={cn(
        "from-primary/30 via-primary/15 to-surface-subtle grid place-items-center bg-gradient-to-br",
        className,
      )}
    >
      <AdminIcon className="text-primary size-7" name="blog" />
    </span>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  readonly icon: "analytics" | "blog" | "content";
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}) {
  return (
    <article className="surface-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="bg-primary/10 text-primary grid size-10 place-items-center rounded-xl">
          <AdminIcon className="size-[18px]" name={icon} />
        </span>
        <p className="text-foreground text-2xl font-bold tracking-[-0.04em]">
          {value}
        </p>
      </div>
      <p className="text-foreground mt-4 text-xs font-bold">{label}</p>
      <p className="text-muted-foreground mt-1 text-[.64rem]">{detail}</p>
    </article>
  );
}

function OverviewPanel({
  data,
  openEditor,
  openTab,
}: {
  readonly data: BlogResponse;
  readonly openEditor: (post?: BlogPost) => void;
  readonly openTab: (tab: WorkspaceTab) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          detail={`${data.metrics.published} published · ${data.metrics.drafts} drafts · ${data.metrics.scheduled} scheduled`}
          icon="blog"
          label="Total articles"
          value={data.metrics.totalArticles.toLocaleString()}
        />
        <Metric
          detail="Across all persisted articles"
          icon="analytics"
          label="Total article views"
          value={compactNumber(data.metrics.totalViews)}
        />
        <Metric
          detail={`${data.metrics.pendingDiscussions} pending · ${data.metrics.flaggedDiscussions} flagged`}
          icon="content"
          label="Discussions"
          value={data.metrics.discussions.toLocaleString()}
        />
        <Metric
          detail="Drafts, reviews, and scheduled posts"
          icon="content"
          label="Editorial queue"
          value={data.metrics.editorialQueue.toLocaleString()}
        />
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <article className="surface-card overflow-hidden rounded-[1.5rem]">
          <div className="border-border flex items-center justify-between gap-4 border-b p-5 sm:p-6">
            <div>
              <p className="text-foreground text-base font-bold">
                Featured story
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                The story highlighted on the public blog
              </p>
            </div>
            {data.featured ? (
              <button
                className="text-primary inline-flex items-center gap-1.5 text-xs font-bold"
                onClick={() => openEditor(data.featured!)}
                type="button"
              >
                Edit <Pencil className="size-3.5" />
              </button>
            ) : null}
          </div>
          {data.featured ? (
            <div className="grid lg:grid-cols-[.82fr_1.18fr]">
              <Cover className="min-h-64" post={data.featured} />
              <div className="flex flex-col justify-center p-6 sm:p-7">
                <div className="flex flex-wrap gap-2">
                  <StatusPill status={data.featured.status} />
                  <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[.6rem] font-bold">
                    Featured
                  </span>
                </div>
                <h2 className="text-foreground mt-4 text-xl font-bold tracking-[-0.035em]">
                  {data.featured.title}
                </h2>
                <p className="text-muted-foreground mt-3 text-[.76rem] leading-5">
                  {data.featured.excerpt}
                </p>
                <p className="text-muted-foreground mt-5 text-[.66rem]">
                  {data.featured.authorName} · {data.featured.readTimeMinutes}{" "}
                  min read · {data.featured.viewCount.toLocaleString()} views
                </p>
              </div>
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div>
                <ImageIcon className="text-muted-foreground mx-auto size-8" />
                <p className="text-foreground mt-3 text-sm font-bold">
                  No featured story
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Mark an article as featured from the editor.
                </p>
              </div>
            </div>
          )}
        </article>
        <article className="surface-card rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-foreground text-base font-bold">
                Publishing queue
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Upcoming and unfinished work
              </p>
            </div>
            <span className="grid size-8 place-items-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-700 dark:text-amber-400">
              {data.metrics.editorialQueue}
            </span>
          </div>
          <div className="mt-5 divide-y">
            {data.queue.map((post) => (
              <button
                className="flex w-full items-center gap-3 py-3.5 text-left first:pt-0"
                key={post.id}
                onClick={() => openEditor(post)}
                type="button"
              >
                <Cover className="size-10 shrink-0 rounded-xl" post={post} />
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block truncate text-[.7rem] font-bold">
                    {post.title}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-[.62rem]">
                    Updated {dateTime(post.updatedAt)}
                  </span>
                </span>
                <StatusPill status={post.status} />
              </button>
            ))}
            {!data.queue.length ? (
              <p className="text-muted-foreground py-10 text-center text-xs">
                The publishing queue is clear.
              </p>
            ) : null}
          </div>
          <button
            className="text-primary mt-5 inline-flex items-center gap-1.5 text-xs font-bold"
            onClick={() => openTab("posts")}
            type="button"
          >
            Open article library <ArrowRight className="size-3.5" />
          </button>
        </article>
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <article className="surface-card rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-foreground text-base font-bold">Top stories</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Published articles ranked by recorded views
              </p>
            </div>
            <button
              className="text-primary text-xs font-bold"
              onClick={() => openTab("posts")}
              type="button"
            >
              View all
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {data.topStories.map((post, index) => (
              <div className="flex items-center gap-3" key={post.id}>
                <span className="text-muted-foreground w-5 text-center text-xs font-bold">
                  {index + 1}
                </span>
                <Cover className="size-11 shrink-0 rounded-xl" post={post} />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-[.72rem] font-bold">
                    {post.title}
                  </p>
                  <p className="text-muted-foreground mt-1 text-[.62rem]">
                    {post.category} · {post.readTimeMinutes} min
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-foreground text-xs font-bold">
                    {post.viewCount.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground text-[.6rem]">views</p>
                </div>
              </div>
            ))}
            {!data.topStories.length ? (
              <p className="text-muted-foreground py-10 text-center text-xs">
                No published stories yet.
              </p>
            ) : null}
          </div>
        </article>
        <article className="surface-card rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-foreground text-base font-bold">
                Discussion health
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Real moderation status across all comments
              </p>
            </div>
            <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-xl">
              <MessageCircle className="size-[18px]" />
            </span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              [data.metrics.discussions, "Total"],
              [data.metrics.pendingDiscussions, "Pending"],
              [data.metrics.flaggedDiscussions, "Flagged"],
            ].map(([value, label]) => (
              <div className="bg-surface-subtle rounded-2xl p-3" key={label}>
                <p className="text-foreground text-lg font-bold">{value}</p>
                <p className="text-muted-foreground mt-1 text-[.62rem]">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <button
            className="text-primary mt-5 inline-flex items-center gap-1.5 text-xs font-bold"
            onClick={() => openTab("discussions")}
            type="button"
          >
            Moderate discussions <ArrowRight className="size-3.5" />
          </button>
        </article>
      </section>
    </div>
  );
}

function PostsPanel({
  posts,
  editPost,
}: {
  readonly posts: BlogPost[];
  readonly editPost: (post: BlogPost) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | PostStatus>("ALL");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return posts.filter(
      (post) =>
        (filter === "ALL" || post.status === filter) &&
        (!term ||
          `${post.title} ${post.authorName} ${post.category}`
            .toLowerCase()
            .includes(term)),
    );
  }, [filter, posts, query]);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  return (
    <section className="surface-card overflow-hidden rounded-[1.5rem]">
      <div className="border-border flex flex-col gap-4 border-b p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-foreground text-base font-bold">Article library</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Search and manage every persisted article
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="border-border bg-background flex h-10 items-center gap-2 rounded-xl border px-3 sm:w-64">
            <Search className="text-muted-foreground size-4" />
            <input
              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search articles"
              type="search"
              value={query}
            />
          </label>
          <Select
            className="border-border bg-background h-10 rounded-xl border px-3 text-xs font-semibold"
            onChange={(event) => {
              setFilter(event.target.value as "ALL" | PostStatus);
              setPage(1);
            }}
            value={filter}
          >
            <option value="ALL">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="divide-y">
        {visible.map((post) => (
          <article
            className="grid gap-4 p-5 lg:grid-cols-[minmax(260px,1.5fr)_120px_145px_150px_44px] lg:items-center lg:px-6"
            key={post.id}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Cover className="size-14 shrink-0 rounded-xl" post={post} />
              <div className="min-w-0">
                <p className="text-foreground truncate text-xs font-bold">
                  {post.title}
                </p>
                <p className="text-muted-foreground mt-1 truncate text-[.64rem]">
                  {post.category} · {post.authorName}
                </p>
              </div>
            </div>
            <StatusPill status={post.status} />
            <p className="text-muted-foreground text-[.66rem]">
              <span className="text-foreground font-bold">
                {post.viewCount.toLocaleString()}
              </span>{" "}
              views · {post.commentCount} comments
            </p>
            <p className="text-muted-foreground text-[.66rem]">
              {dateTime(post.updatedAt)}
            </p>
            <button
              aria-label={`Edit ${post.title}`}
              className="text-muted-foreground hover:bg-primary/10 hover:text-primary grid size-9 place-items-center rounded-lg"
              onClick={() => editPost(post)}
              type="button"
            >
              <Pencil className="size-4" />
            </button>
          </article>
        ))}
        {!visible.length ? (
          <p className="text-muted-foreground py-14 text-center text-xs">
            No articles match these filters.
          </p>
        ) : null}
      </div>
      <div className="px-5 pb-4 sm:px-6">
        <Pagination
          currentPage={currentPage}
          itemLabel="articles"
          onPageChange={setPage}
          pageSize={pageSize}
          totalItems={filtered.length}
          totalPages={totalPages}
        />
      </div>
    </section>
  );
}

function EditorPanel({
  editingPost,
  onSaved,
}: {
  readonly editingPost: BlogPost | null;
  readonly onSaved: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(editingPost?.title ?? "");
  const [slug, setSlug] = useState(editingPost?.slug ?? "");
  const [excerpt, setExcerpt] = useState(editingPost?.excerpt ?? "");
  const [content, setContent] = useState(() =>
    contentToEditorHtml(editingPost?.content ?? []),
  );
  const [category, setCategory] = useState(
    editingPost?.category ?? "Study Skills",
  );
  const [authorName, setAuthorName] = useState(
    editingPost?.authorName ?? "Preppal Learning Team",
  );
  const [tags, setTags] = useState(editingPost?.tags.join(", ") ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    editingPost?.coverImageUrl ?? "",
  );
  const [coverImageAlt, setCoverImageAlt] = useState(
    editingPost?.coverImageAlt ?? "",
  );
  const [readTimeMinutes, setReadTimeMinutes] = useState(
    editingPost?.readTimeMinutes ?? 5,
  );
  const [featured, setFeatured] = useState(editingPost?.featured ?? false);
  const [status, setStatus] = useState<PostStatus>(
    editingPost?.status ?? "DRAFT",
  );
  const [scheduledAt, setScheduledAt] = useState(
    editingPost?.scheduledAt?.slice(0, 16) ?? "",
  );
  const [showMagicWriter, setShowMagicWriter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [magicBrief, setMagicBrief] = useState("");
  const [magicAudience, setMagicAudience] = useState(
    "Secondary-school learners and their parents",
  );
  const [magicTone, setMagicTone] = useState("practical");
  const [magicLength, setMagicLength] = useState("standard");
  const [magicCategory, setMagicCategory] = useState(category);
  const [magicKeywords, setMagicKeywords] = useState("");
  const generateDraft = useMutation({
    mutationFn: () =>
      apiClient<MagicBlogDraft>("/api/v1/admin/blog/ai-draft", {
        method: "POST",
        body: JSON.stringify({
          context: magicBrief.trim(),
          audience: magicAudience.trim() || undefined,
          tone: magicTone,
          length: magicLength,
          category: magicCategory.trim() || undefined,
          keywords: magicKeywords.trim() || undefined,
        }),
      }),
    onSuccess: (draft) => {
      setTitle(draft.title);
      setSlug(
        draft.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      );
      setExcerpt(draft.excerpt);
      setContent(draft.contentHtml);
      setCategory(draft.category);
      setTags(draft.tags.join(", "));
      setReadTimeMinutes(draft.readTimeMinutes);
      setStatus("DRAFT");
      setShowMagicWriter(false);
      onSaved("AI draft created. Review and edit it before publishing.");
    },
  });
  const save = useMutation({
    mutationFn: ({ nextStatus }: { nextStatus: PostStatus }) => {
      const input: SavePostInput = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        content: content.trim() ? [content.trim()] : [],
        category: category.trim(),
        authorName: authorName.trim(),
        coverImageUrl: coverImageUrl.trim() || undefined,
        coverImageAlt: coverImageAlt.trim() || undefined,
        tags: tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        readTimeMinutes,
        status: nextStatus,
        featured,
        scheduledAt:
          nextStatus === "SCHEDULED" && scheduledAt
            ? new Date(scheduledAt).toISOString()
            : undefined,
      };
      return apiClient(
        `/api/v1/admin/blog/posts${editingPost ? `/${editingPost.id}` : ""}`,
        { method: editingPost ? "PATCH" : "POST", body: JSON.stringify(input) },
      );
    },
    onSuccess: async (_, variables) => {
      setStatus(variables.nextStatus);
      await queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      onSaved(
        variables.nextStatus === "PUBLISHED"
          ? "Article has been published."
          : "Article saved successfully.",
      );
    },
  });
  const disabled =
    !title.trim() ||
    !slug.trim() ||
    excerpt.trim().length < 10 ||
    !content.trim() ||
    !category.trim() ||
    !authorName.trim() ||
    save.isPending;
  return (
    <form
      className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate({ nextStatus: status });
      }}
    >
      <section className="surface-card rounded-[1.5rem] p-5 sm:p-6">
        <div className="border-border mb-5 flex items-center justify-between gap-4 border-b pb-5">
          <div>
            <p className="text-foreground text-base font-bold">
              {editingPost ? "Edit article" : "Create article"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Content is saved directly to the blog database.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!editingPost ? (
              <button
                className="border-primary/25 bg-primary/5 text-primary inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[.68rem] font-bold"
                onClick={() => setShowMagicWriter((visible) => !visible)}
                type="button"
              >
                <WandSparkles className="size-4" /> Magic blog creator
              </button>
            ) : null}
            <StatusPill status={status} />
          </div>
        </div>
        {showMagicWriter ? (
          <section className="border-primary/20 from-primary/10 via-primary/5 to-background mb-5 rounded-2xl border bg-gradient-to-br p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-foreground flex items-center gap-2 text-sm font-bold">
                  <WandSparkles className="text-primary size-4" /> Magic blog
                  creator
                </p>
                <p className="text-muted-foreground mt-1 text-[.68rem] leading-5">
                  Give Preppal AI the substance. It will prepare a polished
                  draft inside the editor—never publish it automatically.
                </p>
              </div>
              <button
                aria-label="Close magic blog creator"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowMagicWriter(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
            <label className="mt-4 block">
              <span className="text-foreground mb-1.5 block text-[.68rem] font-bold">
                What should the article communicate?
              </span>
              <textarea
                className="border-border bg-background focus:border-primary min-h-28 w-full rounded-xl border p-3 text-xs leading-5 outline-none"
                maxLength={4000}
                onChange={(event) => setMagicBrief(event.target.value)}
                placeholder="Include the central idea, facts that must be covered, desired takeaway, and any links or references the writer may use."
                value={magicBrief}
              />
              <span className="text-muted-foreground mt-1 block text-[.6rem]">
                {magicBrief.length.toLocaleString()} / 4,000 characters · at
                least 20 required
              </span>
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Audience">
                <input
                  className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                  maxLength={120}
                  onChange={(event) => setMagicAudience(event.target.value)}
                  value={magicAudience}
                />
              </Field>
              <Field label="Tone">
                <Select
                  className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                  onChange={(event) => setMagicTone(event.target.value)}
                  value={magicTone}
                >
                  <option value="practical">Practical</option>
                  <option value="authoritative">Authoritative</option>
                  <option value="friendly">Friendly</option>
                  <option value="inspiring">Inspiring</option>
                  <option value="conversational">Conversational</option>
                </Select>
              </Field>
              <Field label="Length">
                <Select
                  className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                  onChange={(event) => setMagicLength(event.target.value)}
                  value={magicLength}
                >
                  <option value="short">Short · 450–600 words</option>
                  <option value="standard">Standard · 700–900 words</option>
                  <option value="long">Long · 1,000–1,200 words</option>
                </Select>
              </Field>
              <Field label="Category">
                <input
                  className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                  maxLength={80}
                  onChange={(event) => setMagicCategory(event.target.value)}
                  value={magicCategory}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Keywords (optional)">
                  <input
                    className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                    maxLength={300}
                    onChange={(event) => setMagicKeywords(event.target.value)}
                    placeholder="JAMB preparation, study habits, exam confidence"
                    value={magicKeywords}
                  />
                </Field>
              </div>
            </div>
            {generateDraft.isError ? (
              <p className="mt-3 rounded-xl bg-rose-500/10 p-3 text-xs font-semibold text-rose-700">
                {generateDraft.error.message}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-[.62rem]">
                AI output is a draft. Verify facts, links, and claims before
                publishing.
              </p>
              <button
                className="bg-primary text-primary-foreground inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold disabled:opacity-50"
                disabled={
                  magicBrief.trim().length < 20 || generateDraft.isPending
                }
                onClick={() => generateDraft.mutate()}
                type="button"
              >
                {generateDraft.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <WandSparkles className="size-4" />
                )}
                {generateDraft.isPending
                  ? "Writing draft…"
                  : "Create editable draft"}
              </button>
            </div>
          </section>
        ) : null}
        <div className="space-y-4">
          <label className="block">
            <span className="text-muted-foreground mb-1.5 block text-[.66rem] font-bold">
              Article title
            </span>
            <input
              className="border-border bg-background focus:border-primary h-11 w-full rounded-xl border px-3 text-sm outline-none"
              onChange={(event) => {
                setTitle(event.target.value);
                if (!editingPost)
                  setSlug(
                    event.target.value
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, ""),
                  );
              }}
              required
              value={title}
            />
          </label>
          <label className="block">
            <span className="text-muted-foreground mb-1.5 block text-[.66rem] font-bold">
              Description
            </span>
            <textarea
              className="border-border bg-background focus:border-primary min-h-24 w-full rounded-xl border p-3 text-xs leading-5 outline-none"
              maxLength={500}
              onChange={(event) => setExcerpt(event.target.value)}
              required
              value={excerpt}
            />
          </label>
          <RichContentEditor
            label="Article content"
            minHeight="min-h-[24rem]"
            onChange={setContent}
            placeholder="Write the article using headings, paragraphs, lists, quotes, tables, formulas, images, and diagrams."
            value={content}
          />
        </div>
      </section>
      <aside className="space-y-5">
        <section className="surface-card rounded-2xl p-5">
          <p className="text-foreground text-sm font-bold">Publishing</p>
          <div className="mt-4 space-y-3">
            <Field label="Status">
              <Select
                className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                onChange={(event) =>
                  setStatus(event.target.value as PostStatus)
                }
                value={status}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            {status === "SCHEDULED" ? (
              <Field label="Publish date and time">
                <input
                  className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                  onChange={(event) => setScheduledAt(event.target.value)}
                  required
                  type="datetime-local"
                  value={scheduledAt}
                />
              </Field>
            ) : null}
            <Field label="Category">
              <input
                className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                onChange={(event) => setCategory(event.target.value)}
                required
                value={category}
              />
            </Field>
            <Field label="Author">
              <input
                className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                onChange={(event) => setAuthorName(event.target.value)}
                required
                value={authorName}
              />
            </Field>
            <Field label="URL slug">
              <input
                className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                onChange={(event) => setSlug(event.target.value)}
                required
                value={slug}
              />
            </Field>
            <Field label="Tags">
              <input
                className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                onChange={(event) => setTags(event.target.value)}
                placeholder="Study, Exams, Learning"
                value={tags}
              />
            </Field>
            <Field label="Read time in minutes">
              <input
                className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                min={1}
                onChange={(event) =>
                  setReadTimeMinutes(Number(event.target.value))
                }
                type="number"
                value={readTimeMinutes}
              />
            </Field>
            <label className="border-border flex items-center justify-between gap-3 rounded-xl border p-3">
              <span className="text-foreground text-xs font-bold">
                Featured story
              </span>
              <input
                checked={featured}
                className="accent-primary size-4"
                onChange={(event) => setFeatured(event.target.checked)}
                type="checkbox"
              />
            </label>
          </div>
        </section>
        <section className="surface-card rounded-2xl p-5">
          <p className="text-foreground text-sm font-bold">Cover image</p>
          <div className="mt-4 space-y-3">
            <Field label="Image URL">
              <input
                className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                onChange={(event) => setCoverImageUrl(event.target.value)}
                placeholder="https://…"
                type="url"
                value={coverImageUrl}
              />
            </Field>
            <Field label="Alt text">
              <input
                className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs"
                onChange={(event) => setCoverImageAlt(event.target.value)}
                value={coverImageAlt}
              />
            </Field>
          </div>
        </section>
        {save.isError ? (
          <p className="rounded-xl bg-rose-500/10 p-3 text-xs font-semibold text-rose-700">
            {save.error.message}
          </p>
        ) : null}
        <button
          className="border-primary/25 bg-primary/5 text-primary inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-xs font-bold disabled:opacity-50"
          disabled={!title.trim() && !content.trim()}
          onClick={() => setShowPreview(true)}
          type="button"
        >
          <Eye className="size-4" /> Preview article
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="border-border h-11 rounded-xl border text-xs font-bold disabled:opacity-50"
            disabled={disabled}
            onClick={() => save.mutate({ nextStatus: "DRAFT" })}
            type="button"
          >
            Save draft
          </button>
          <button
            className="bg-primary text-primary-foreground h-11 rounded-xl text-xs font-bold disabled:opacity-50"
            disabled={disabled}
            type="submit"
          >
            {save.isPending
              ? "Saving…"
              : status === "PUBLISHED"
                ? "Publish"
                : "Save article"}
          </button>
        </div>
      </aside>
      {showPreview ? (
        <BlogPreview
          onClose={() => setShowPreview(false)}
          value={{
            title,
            excerpt,
            content,
            category,
            authorName,
            coverImageUrl,
            coverImageAlt,
            tags: tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            readTimeMinutes,
          }}
        />
      ) : null}
    </form>
  );
}

function BlogPreview({
  onClose,
  value,
}: {
  readonly onClose: () => void;
  readonly value: BlogPreviewValue;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
      <button
        aria-label="Close article preview"
        className="fixed inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby="blog-preview-title"
        aria-modal="true"
        className="bg-background border-border relative z-10 mx-auto min-h-[calc(100vh-1.5rem)] w-full max-w-5xl overflow-hidden rounded-[1.75rem] border shadow-2xl sm:min-h-0"
        role="dialog"
      >
        <header className="border-border bg-background/95 sticky top-0 z-20 flex items-center justify-between gap-4 border-b px-4 py-3 backdrop-blur sm:px-6">
          <div>
            <p
              className="text-foreground text-sm font-bold"
              id="blog-preview-title"
            >
              Article preview
            </p>
            <p className="text-muted-foreground mt-0.5 text-[.62rem]">
              Previewing the current unsaved editor content
            </p>
          </div>
          <button
            className="border-border text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-xl border"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </header>

        <article className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
          <div className="flex flex-wrap items-center gap-2 text-[.66rem] font-semibold">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1">
              {value.category.trim() || "Uncategorised"}
            </span>
            <span className="text-muted-foreground">
              {Math.max(1, value.readTimeMinutes || 1)} min read
            </span>
          </div>
          <h1 className="text-foreground mt-5 text-2xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            {value.title.trim() || "Untitled article"}
          </h1>
          {value.excerpt.trim() ? (
            <p className="text-muted-foreground mt-4 text-sm leading-7 sm:text-base">
              {value.excerpt}
            </p>
          ) : null}
          <div className="border-border text-muted-foreground mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-b pb-6 text-[.68rem]">
            <span className="text-foreground font-bold">
              {value.authorName.trim() || "Preppal Learning Team"}
            </span>
            <span aria-hidden="true">·</span>
            <span>Preview</span>
          </div>

          {isPreviewableImageUrl(value.coverImageUrl.trim()) ? (
            <div className="bg-surface-subtle relative mt-7 aspect-[16/8] overflow-hidden rounded-2xl">
              <Image
                alt={value.coverImageAlt.trim() || value.title.trim()}
                className="object-cover"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                src={value.coverImageUrl.trim()}
              />
            </div>
          ) : null}

          {value.content.trim() ? (
            <RichContent
              className="text-foreground mt-8 space-y-4 text-sm leading-7 sm:text-[.94rem] [&_h2]:mt-9 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-7 [&_h3]:text-base [&_h3]:font-bold [&_p]:leading-7"
              html={value.content}
            />
          ) : (
            <p className="text-muted-foreground border-border mt-8 rounded-2xl border border-dashed px-4 py-12 text-center text-sm">
              Article content will appear here.
            </p>
          )}

          {value.tags.length ? (
            <div className="border-border mt-10 flex flex-wrap gap-2 border-t pt-6">
              {value.tags.map((tag) => (
                <span
                  className="bg-surface-subtle text-muted-foreground rounded-full px-3 py-1.5 text-[.64rem] font-semibold"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      </section>
    </div>,
    document.body,
  );
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-muted-foreground mb-1.5 block text-[.64rem] font-bold">
        {label}
      </span>
      {children}
    </label>
  );
}

function DiscussionsPanel({
  comments,
  metrics,
}: {
  readonly comments: BlogComment[];
  readonly metrics: BlogResponse["metrics"];
}) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | DiscussionStatus>("ALL");
  const [page, setPage] = useState(1);
  const filtered = comments.filter(
    (comment) => filter === "ALL" || comment.status === filter,
  );
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
  const moderate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DiscussionStatus }) =>
      apiClient(`/api/v1/admin/blog/comments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/admin/blog/comments/${id}`, { method: "DELETE" }),
    onSuccess: refresh,
  });
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="surface-card overflow-hidden rounded-[1.5rem]">
        <div className="border-border flex items-center justify-between gap-4 border-b p-5 sm:p-6">
          <div>
            <p className="text-foreground text-base font-bold">
              Discussion management
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Discussions are visible immediately. You can flag, hide, or remove
              them when needed.
            </p>
          </div>
          <Select
            className="border-border bg-background h-10 rounded-xl border px-3 text-xs"
            onChange={(event) => {
              setFilter(event.target.value as "ALL" | DiscussionStatus);
              setPage(1);
            }}
            value={filter}
          >
            <option value="ALL">All statuses</option>
            {Object.entries(DISCUSSION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="divide-y">
          {visible.map((comment) => (
            <article className="p-5 sm:p-6" key={comment.id}>
              <div className="flex gap-3">
                <span className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-full text-[.68rem] font-bold">
                  {initials(comment.authorName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground text-xs font-bold">
                      {comment.authorName}
                    </p>
                    <span className="text-muted-foreground text-[.62rem]">
                      {dateTime(comment.createdAt)}
                    </span>
                    <StatusPill status={comment.status} />
                  </div>
                  <p className="text-muted-foreground mt-2 truncate text-[.66rem]">
                    On: {comment.articleTitle}
                  </p>
                  <p className="text-foreground mt-3 text-[.76rem] leading-6">
                    {comment.body}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ModerateButton
                      onClick={() =>
                        moderate.mutate({ id: comment.id, status: "FLAGGED" })
                      }
                    >
                      <Flag className="size-3.5" /> Flag
                    </ModerateButton>
                    <ModerateButton
                      onClick={() =>
                        moderate.mutate({ id: comment.id, status: "HIDDEN" })
                      }
                    >
                      <Eye className="size-3.5" /> Hide
                    </ModerateButton>
                    <button
                      aria-label="Delete comment"
                      className="text-danger hover:bg-danger/10 grid size-8 place-items-center rounded-lg"
                      onClick={() => remove.mutate(comment.id)}
                      type="button"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {!visible.length ? (
            <p className="text-muted-foreground py-14 text-center text-xs">
              No discussions match this filter.
            </p>
          ) : null}
        </div>
        <div className="px-5 pb-4 sm:px-6">
          <Pagination
            currentPage={currentPage}
            itemLabel="discussions"
            onPageChange={setPage}
            pageSize={pageSize}
            totalItems={filtered.length}
            totalPages={totalPages}
          />
        </div>
      </section>
      <aside className="surface-card h-fit rounded-2xl p-5">
        <p className="text-foreground text-sm font-bold">Moderation summary</p>
        <div className="mt-4 space-y-3">
          {[
            ["Awaiting review", metrics.pendingDiscussions, "bg-amber-500"],
            ["Approved", metrics.approvedDiscussions, "bg-emerald-500"],
            ["Flagged", metrics.flaggedDiscussions, "bg-rose-500"],
            ["Hidden", metrics.hiddenDiscussions, "bg-slate-400"],
          ].map(([label, value, tone]) => (
            <div className="flex items-center gap-3" key={String(label)}>
              <span className={cn("size-2 rounded-full", tone)} />
              <span className="text-muted-foreground flex-1 text-[.68rem]">
                {label}
              </span>
              <span className="text-foreground text-xs font-bold">{value}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function ModerateButton({
  children,
  onClick,
}: {
  readonly children: React.ReactNode;
  readonly onClick: () => void;
}) {
  return (
    <button
      className="border-border flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[.64rem] font-bold"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function MediaPanel({ media }: { readonly media: BlogMedia[] }) {
  const [query, setQuery] = useState("");
  const filtered = media.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const usedBytes = media.reduce((sum, item) => sum + item.sizeBytes, 0);
  return (
    <div className="space-y-5">
      <section className="surface-card rounded-[1.5rem] p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-foreground text-base font-bold">Media library</p>
            <p className="text-muted-foreground mt-2 text-xs leading-5">
              Persisted cover images and inline article media.
            </p>
            <p className="text-muted-foreground mt-4 text-[.66rem]">
              <strong className="text-foreground">{media.length}</strong> assets
              ·{" "}
              <strong className="text-foreground">
                {(usedBytes / 1_048_576).toFixed(1)} MB
              </strong>{" "}
              stored
            </p>
          </div>
          <div className="border-border bg-surface-subtle flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center">
            <Upload className="text-primary size-5" />
            <p className="text-foreground mt-2 text-xs font-bold">
              Upload provider not connected
            </p>
            <p className="text-muted-foreground mt-1 text-[.62rem]">
              Use a saved image URL in the editor until object storage is
              configured.
            </p>
          </div>
        </div>
      </section>
      <section className="surface-card overflow-hidden rounded-[1.5rem]">
        <div className="border-border flex items-center justify-between gap-4 border-b p-5 sm:p-6">
          <div>
            <p className="text-foreground text-sm font-bold">All media</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Assets recorded in the database
            </p>
          </div>
          <label className="border-border bg-background flex h-10 items-center gap-2 rounded-xl border px-3 sm:w-60">
            <Search className="text-muted-foreground size-4" />
            <input
              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search media"
              type="search"
              value={query}
            />
          </label>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {filtered.map((item) => (
            <article
              className="border-border overflow-hidden rounded-2xl border"
              key={item.id}
            >
              <div className="bg-surface-subtle relative aspect-video">
                <Image
                  alt={item.altText ?? ""}
                  className="object-cover"
                  fill
                  loading="lazy"
                  sizes="320px"
                  src={item.url}
                />
              </div>
              <div className="p-3">
                <p className="text-foreground truncate text-[.7rem] font-bold">
                  {item.name}
                </p>
                <p className="text-muted-foreground mt-1 text-[.62rem]">
                  {item.width && item.height
                    ? `${item.width} × ${item.height} · `
                    : ""}
                  {(item.sizeBytes / 1024).toFixed(0)} KB
                </p>
                <p className="text-primary mt-2 text-[.62rem] font-semibold">
                  Used by {item.usageCount} article
                  {item.usageCount === 1 ? "" : "s"}
                </p>
              </div>
            </article>
          ))}
          {!filtered.length ? (
            <p className="text-muted-foreground col-span-full py-14 text-center text-xs">
              No saved media assets.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [notice, setNotice] = useState("");
  const query = useQuery({
    queryKey: ["admin", "blog"],
    queryFn: () => apiClient<BlogResponse>("/api/v1/admin/blog"),
  });
  const data = query.data;
  const openEditor = (post?: BlogPost) => {
    setEditingPost(post ?? null);
    setNotice("");
    setActiveTab("editor");
  };
  const openTab = (tab: WorkspaceTab) => {
    setNotice("");
    setActiveTab(tab);
  };
  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };
  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-[1540px]">
        <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="text-primary text-[.68rem] font-bold tracking-[0.16em] uppercase">
              Publishing workspace
            </span>
            <h1 className="text-foreground mt-2 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
              Blog management
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              Create stories, manage publication, and moderate learner
              discussions with live database data.
            </p>
          </div>
          <button
            className="bg-primary text-primary-foreground inline-flex h-11 w-fit items-center gap-2 rounded-xl px-4 text-xs font-bold"
            onClick={() => openEditor()}
            type="button"
          >
            <Plus className="size-4" /> Create new article
          </button>
        </header>
        <nav
          aria-label="Blog management sections"
          className="border-border bg-surface mb-5 flex gap-1 overflow-x-auto rounded-2xl border p-1.5 shadow-sm"
        >
          {TABS.map((tab) => (
            <button
              aria-current={activeTab === tab.value ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-xl px-4 py-2.5 text-[.72rem] font-bold transition",
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
              )}
              key={tab.value}
              onClick={() => openTab(tab.value)}
              type="button"
            >
              {tab.label}
              {tab.value === "discussions" &&
              data?.metrics.pendingDiscussions ? (
                <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-[.56rem]">
                  {data.metrics.pendingDiscussions}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
        {notice ? (
          <div
            aria-live="polite"
            className="border-success/25 bg-surface text-success fixed top-5 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold shadow-xl"
            role="status"
          >
            <Check className="size-4" />
            {notice}
          </div>
        ) : null}
        {query.isLoading ? (
          <div className="text-muted-foreground flex min-h-[28rem] items-center justify-center gap-2 text-xs">
            <span className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
            Loading blog records…
          </div>
        ) : query.isError || !data ? (
          <div className="surface-card rounded-3xl p-10 text-center">
            <p className="text-foreground text-sm font-bold">
              Blog data is unavailable
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              The database summary could not be loaded.
            </p>
            <button
              className="text-primary mt-3 text-xs font-bold"
              onClick={() => query.refetch()}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {activeTab === "overview" ? (
              <OverviewPanel
                data={data}
                openEditor={openEditor}
                openTab={openTab}
              />
            ) : null}
            {activeTab === "posts" ? (
              <PostsPanel editPost={openEditor} posts={data.posts} />
            ) : null}
            {activeTab === "editor" ? (
              <EditorPanel
                editingPost={editingPost}
                key={editingPost?.id ?? "new"}
                onSaved={notify}
              />
            ) : null}
            {activeTab === "discussions" ? (
              <DiscussionsPanel
                comments={data.comments}
                metrics={data.metrics}
              />
            ) : null}
            {activeTab === "media" ? <MediaPanel media={data.media} /> : null}
          </>
        )}
      </div>
    </AdminShell>
  );
}
