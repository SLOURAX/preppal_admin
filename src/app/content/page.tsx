"use client";

import { useMemo, useState, type SVGProps } from "react";

import { AdminShell } from "@/components/layout";
import { AdminIcon } from "@/components/ui";
import { cn } from "@/lib/utils";

type WorkspaceTab = "overview" | "posts" | "editor" | "discussions" | "media";
type PostStatus = "Published" | "Draft" | "Scheduled" | "In review";
type DiscussionStatus = "Approved" | "Pending" | "Flagged" | "Hidden";

interface BlogPost {
  readonly author: string;
  readonly category: string;
  readonly comments: number;
  readonly excerpt: string;
  readonly featured?: boolean;
  readonly id: string;
  readonly likes: number;
  readonly publishedAt: string;
  readonly readTime: string;
  readonly slug: string;
  readonly status: PostStatus;
  readonly title: string;
  readonly tone: string;
  readonly updatedAt: string;
  readonly views: number;
}

interface Discussion {
  readonly article: string;
  readonly author: string;
  readonly avatar: string;
  readonly id: string;
  readonly message: string;
  status: DiscussionStatus;
  readonly time: string;
}

type BlogIconName =
  | "calendar"
  | "check"
  | "chevron"
  | "clock"
  | "comment"
  | "edit"
  | "eye"
  | "flag"
  | "heart"
  | "image"
  | "link"
  | "more"
  | "plus"
  | "search"
  | "trash"
  | "upload"
  | "x";

const POSTS: readonly BlogPost[] = [
  {
    id: "post-001",
    title: "How AI explanations can turn a wrong answer into understanding",
    slug: "ai-explanations-that-build-understanding",
    excerpt:
      "The best feedback does more than reveal the answer. It helps learners recognise the reasoning pattern they can reuse next time.",
    category: "AI & Learning",
    author: "Preppal Learning Team",
    status: "Published",
    publishedAt: "2 Sep 2026 · 9:30 AM",
    updatedAt: "2 Sep 2026",
    readTime: "6 min",
    views: 12840,
    likes: 284,
    comments: 38,
    featured: true,
    tone: "from-[#29176e] via-[#5b35f5] to-[#9b80ff]",
  },
  {
    id: "post-002",
    title: "A practical seven-day plan for focused exam preparation",
    slug: "seven-day-exam-preparation-plan",
    excerpt:
      "Use short practice sessions, deliberate review, and realistic targets to make the final week count.",
    category: "Study Skills",
    author: "Dr. Nneka Adeyemi",
    status: "Published",
    publishedAt: "1 Sep 2026 · 2:15 PM",
    updatedAt: "1 Sep 2026",
    readTime: "5 min",
    views: 9340,
    likes: 196,
    comments: 24,
    tone: "from-[#0f5f5a] via-[#159978] to-[#7fd7b7]",
  },
  {
    id: "post-003",
    title: "New reward milestones make consistent practice more valuable",
    slug: "new-reward-milestones",
    excerpt:
      "A closer look at the clearer progress milestones now available to every learner.",
    category: "Rewards",
    author: "Preppal Product Team",
    status: "Scheduled",
    publishedAt: "8 Oct 2026 · 10:00 AM",
    updatedAt: "Today · 10:42 AM",
    readTime: "3 min",
    views: 0,
    likes: 0,
    comments: 0,
    tone: "from-[#9a4c0d] via-[#f38a22] to-[#ffd182]",
  },
  {
    id: "post-004",
    title: "Why learning with friends can improve consistency",
    slug: "learning-together-improves-consistency",
    excerpt:
      "Accountability and shared goals can make a study routine much easier to maintain.",
    category: "Community",
    author: "Tomi Akinwale",
    status: "In review",
    publishedAt: "Not published",
    updatedAt: "Today · 9:18 AM",
    readTime: "4 min",
    views: 0,
    likes: 0,
    comments: 0,
    tone: "from-[#174a91] via-[#2378db] to-[#8fc3ff]",
  },
  {
    id: "post-005",
    title: "Retrieval practice: why testing yourself beats rereading",
    slug: "retrieval-practice-beats-rereading",
    excerpt:
      "Trying to recall information strengthens memory and reveals the gaps familiar notes can hide.",
    category: "Study Skills",
    author: "Preppal Learning Team",
    status: "Draft",
    publishedAt: "Not published",
    updatedAt: "Yesterday · 4:05 PM",
    readTime: "5 min",
    views: 0,
    likes: 0,
    comments: 0,
    tone: "from-[#642161] via-[#bd4aae] to-[#f2a5df]",
  },
] as const;

const INITIAL_DISCUSSIONS: Discussion[] = [
  {
    id: "comment-001",
    author: "Ada M.",
    avatar: "AM",
    article: "How AI explanations can turn a wrong answer into understanding",
    message:
      "This is a useful way to think about reviewing mistakes. I’m going to try it in my next practice session.",
    time: "12 min ago",
    status: "Pending",
  },
  {
    id: "comment-002",
    author: "Daniel O.",
    avatar: "DO",
    article: "A practical seven-day plan for focused exam preparation",
    message:
      "The practical examples made the routine much easier to understand and apply.",
    time: "38 min ago",
    status: "Approved",
  },
  {
    id: "comment-003",
    author: "Ifeanyi K.",
    avatar: "IK",
    article: "New reward milestones make consistent practice more valuable",
    message:
      "Can we also get a breakdown of how the weekly goal contributes to XP?",
    time: "2 hours ago",
    status: "Pending",
  },
  {
    id: "comment-004",
    author: "Anonymous user",
    avatar: "AU",
    article: "Why learning with friends can improve consistency",
    message:
      "This comment was automatically flagged because it may violate the community rules.",
    time: "Yesterday",
    status: "Flagged",
  },
];

const MEDIA = [
  {
    id: "media-1",
    name: "ai-study-support.png",
    meta: "1600 × 900 · 824 KB",
    used: "Featured cover",
    tone: "from-[#27156b] via-[#6240f8] to-[#b49fff]",
  },
  {
    id: "media-2",
    name: "exam-preparation.png",
    meta: "1600 × 900 · 691 KB",
    used: "2 articles",
    tone: "from-[#0f5c58] via-[#1da77e] to-[#a2e4cc]",
  },
  {
    id: "media-3",
    name: "learning-rewards.png",
    meta: "1600 × 900 · 742 KB",
    used: "1 article",
    tone: "from-[#98440c] via-[#f38420] to-[#ffd9a2]",
  },
  {
    id: "media-4",
    name: "learner-community.png",
    meta: "1600 × 900 · 628 KB",
    used: "2 articles",
    tone: "from-[#144487] via-[#2477d8] to-[#9fcaff]",
  },
  {
    id: "media-5",
    name: "retrieval-practice.png",
    meta: "1280 × 720 · 504 KB",
    used: "Not used",
    tone: "from-[#5b1c57] via-[#bd4bad] to-[#f5bae8]",
  },
  {
    id: "media-6",
    name: "study-routine.png",
    meta: "1280 × 720 · 577 KB",
    used: "Not used",
    tone: "from-[#343c55] via-[#69758f] to-[#c9d0dd]",
  },
] as const;

const CATEGORIES = [
  "AI & Learning",
  "Study Skills",
  "Rewards",
  "Community",
] as const;

const TABS: ReadonlyArray<{
  readonly label: string;
  readonly value: WorkspaceTab;
}> = [
  { label: "Overview", value: "overview" },
  { label: "All posts", value: "posts" },
  { label: "Editor", value: "editor" },
  { label: "Discussions", value: "discussions" },
  { label: "Media", value: "media" },
];

function BlogIcon({
  name,
  ...props
}: { readonly name: BlogIconName } & SVGProps<SVGSVGElement>) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      {name === "plus" ? <path {...common} d="M12 5v14M5 12h14" /> : null}
      {name === "search" ? (
        <>
          <circle {...common} cx="11" cy="11" r="6.5" />
          <path {...common} d="m16 16 4 4" />
        </>
      ) : null}
      {name === "eye" ? (
        <>
          <path
            {...common}
            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
          />
          <circle {...common} cx="12" cy="12" r="2.5" />
        </>
      ) : null}
      {name === "edit" ? (
        <>
          <path
            {...common}
            d="m14.5 5.5 4 4M4 20l4.5-1 10-10a2.8 2.8 0 0 0-4-4l-10 10L4 20Z"
          />
        </>
      ) : null}
      {name === "comment" ? (
        <path
          {...common}
          d="M5 18.5 3.5 21l4.2-1.2c1.3.5 2.7.7 4.3.7 5 0 9-3.7 9-8.5s-4-8.5-9-8.5S3 7.2 3 12c0 2.6 1.1 4.8 3 6.4"
        />
      ) : null}
      {name === "upload" ? (
        <>
          <path
            {...common}
            d="M12 16V4m-4 4 4-4 4 4M4 15v4a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-4"
          />
        </>
      ) : null}
      {name === "more" ? (
        <>
          <circle cx="5" cy="12" fill="currentColor" r="1.3" />
          <circle cx="12" cy="12" fill="currentColor" r="1.3" />
          <circle cx="19" cy="12" fill="currentColor" r="1.3" />
        </>
      ) : null}
      {name === "image" ? (
        <>
          <rect {...common} height="16" rx="2" width="18" x="3" y="4" />
          <circle {...common} cx="8.5" cy="9" r="1.5" />
          <path {...common} d="m4 17 4.5-4 3.2 3 2.4-2.2L20 19" />
        </>
      ) : null}
      {name === "calendar" ? (
        <>
          <rect {...common} height="16" rx="2" width="18" x="3" y="5" />
          <path {...common} d="M8 3v4M16 3v4M3 10h18" />
        </>
      ) : null}
      {name === "chevron" ? <path {...common} d="m9 6 6 6-6 6" /> : null}
      {name === "link" ? (
        <>
          <path
            {...common}
            d="m9.5 14.5 5-5M7.5 17.5l-1 1a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0M16.5 6.5l1-1a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0"
          />
        </>
      ) : null}
      {name === "heart" ? (
        <path
          {...common}
          d="M20.8 5.7c-2-2.1-5.3-1.8-7.1.4L12 8l-1.7-1.9C8.5 3.9 5.2 3.6 3.2 5.7c-2 2.2-1.8 5.6.3 7.7L12 21l8.5-7.6c2.1-2.1 2.3-5.5.3-7.7Z"
        />
      ) : null}
      {name === "clock" ? (
        <>
          <circle {...common} cx="12" cy="12" r="9" />
          <path {...common} d="M12 7v5l3.5 2" />
        </>
      ) : null}
      {name === "trash" ? (
        <>
          <path
            {...common}
            d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"
          />
        </>
      ) : null}
      {name === "check" ? <path {...common} d="m5 12 4 4L19 6" /> : null}
      {name === "flag" ? (
        <path {...common} d="M5 21V4m0 1h10l-1 4 3 4H5" />
      ) : null}
      {name === "x" ? <path {...common} d="m6 6 12 12M18 6 6 18" /> : null}
    </svg>
  );
}

function StatusBadge({
  status,
}: {
  readonly status: DiscussionStatus | PostStatus;
}) {
  const styles: Record<DiscussionStatus | PostStatus, string> = {
    Approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    Published: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    Draft: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    Scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    "In review": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    Pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    Flagged: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    Hidden: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[.64rem] font-bold",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}

function MetricCard({
  description,
  icon,
  label,
  value,
}: {
  readonly description: string;
  readonly icon: "analytics" | "blog" | "comment" | "edit";
  readonly label: string;
  readonly value: string;
}) {
  return (
    <article className="surface-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-[.7rem] font-semibold">
            {label}
          </p>
          <p className="text-foreground mt-2 text-2xl font-bold tracking-[-0.04em]">
            {value}
          </p>
        </div>
        <span className="bg-primary/10 text-primary grid size-10 place-items-center rounded-xl">
          {icon === "comment" ? (
            <BlogIcon className="size-[18px]" name="comment" />
          ) : icon === "edit" ? (
            <BlogIcon className="size-[18px]" name="edit" />
          ) : (
            <AdminIcon className="size-[18px]" name={icon} />
          )}
        </span>
      </div>
      <p className="text-muted-foreground mt-4 text-[.66rem]">{description}</p>
    </article>
  );
}

function OverviewPanel({
  openEditor,
  openTab,
}: {
  readonly openEditor: (post?: BlogPost) => void;
  readonly openTab: (tab: WorkspaceTab) => void;
}) {
  const featured = POSTS.find((post) => post.featured) ?? POSTS[0];
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description="19 published · 6 drafts · 3 scheduled"
          icon="blog"
          label="Total articles"
          value="28"
        />
        <MetricCard
          description="+18.2% compared with last month"
          icon="analytics"
          label="Views this month"
          value="48.6k"
        />
        <MetricCard
          description="12 waiting for moderation"
          icon="comment"
          label="Discussions"
          value="184"
        />
        <MetricCard
          description="3 drafts need editorial review"
          icon="edit"
          label="Editorial queue"
          value="6"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <article className="surface-card overflow-hidden rounded-[1.5rem]">
          <div className="border-border flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-foreground text-base font-bold">
                Featured story
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Primary story currently highlighted on the public blog
              </p>
            </div>
            <button
              className="text-primary inline-flex items-center gap-1.5 self-start text-xs font-bold"
              onClick={() => openEditor(featured)}
              type="button"
            >
              Edit feature
              <BlogIcon className="size-4" name="edit" />
            </button>
          </div>
          <div className="grid lg:grid-cols-[.82fr_1.18fr]">
            <div
              className={cn(
                "relative min-h-64 overflow-hidden bg-gradient-to-br p-6",
                featured.tone,
              )}
            >
              <div className="absolute -right-10 -bottom-16 size-56 rounded-full border-[34px] border-white/10" />
              <div className="absolute top-7 right-7 grid size-16 place-items-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
                <AdminIcon className="size-8" name="blog" />
              </div>
              <p className="relative mt-36 text-[.68rem] font-bold tracking-[.13em] text-white/70 uppercase">
                {featured.category}
              </p>
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={featured.status} />
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[.64rem] font-bold">
                  Featured
                </span>
              </div>
              <h2 className="text-foreground mt-4 text-xl font-bold tracking-[-0.035em]">
                {featured.title}
              </h2>
              <p className="text-muted-foreground mt-3 text-[.78rem] leading-5">
                {featured.excerpt}
              </p>
              <div className="text-muted-foreground mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[.68rem]">
                <span>{featured.author}</span>
                <span>{featured.readTime} read</span>
                <span>{featured.views.toLocaleString()} views</span>
              </div>
            </div>
          </div>
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
              4
            </span>
          </div>
          <div className="mt-5 divide-y">
            {POSTS.filter((post) => post.status !== "Published")
              .slice(0, 4)
              .map((post) => (
                <button
                  className="group flex w-full items-center gap-3 py-4 text-left first:pt-0 last:pb-0"
                  key={post.id}
                  onClick={() => openEditor(post)}
                  type="button"
                >
                  <span
                    className={cn(
                      "size-10 shrink-0 rounded-xl bg-gradient-to-br",
                      post.tone,
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block truncate text-[.72rem] font-bold">
                      {post.title}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-[.64rem]">
                      {post.updatedAt}
                    </span>
                  </span>
                  <StatusBadge status={post.status} />
                </button>
              ))}
          </div>
          <button
            className="text-primary mt-6 inline-flex items-center gap-1.5 text-xs font-bold"
            onClick={() => openTab("posts")}
            type="button"
          >
            Open editorial queue
            <BlogIcon className="size-4" name="chevron" />
          </button>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <article className="surface-card rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-foreground text-base font-bold">Top stories</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Best-performing published articles this month
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
            {POSTS.filter((post) => post.status === "Published").map(
              (post, index) => (
                <div className="flex items-center gap-3" key={post.id}>
                  <span className="text-muted-foreground w-5 text-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      "size-11 shrink-0 rounded-xl bg-gradient-to-br",
                      post.tone,
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-[.72rem] font-bold">
                      {post.title}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[.64rem]">
                      {post.category} · {post.readTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground text-xs font-bold">
                      {post.views.toLocaleString()}
                    </p>
                    <p className="text-muted-foreground mt-1 text-[.62rem]">
                      views
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="surface-card rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-foreground text-base font-bold">
                Discussion health
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Community activity requiring moderation
              </p>
            </div>
            <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-xl">
              <BlogIcon className="size-[18px]" name="comment" />
            </span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ["184", "Total"],
              ["12", "Pending"],
              ["3", "Flagged"],
            ].map(([value, label]) => (
              <div className="bg-surface-subtle rounded-2xl p-3" key={label}>
                <p className="text-foreground text-lg font-bold">{value}</p>
                <p className="text-muted-foreground mt-1 text-[.62rem]">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-surface-subtle mt-4 rounded-2xl p-4">
            <div className="flex items-center justify-between text-[.68rem]">
              <span className="text-muted-foreground">Positive sentiment</span>
              <span className="text-foreground font-bold">91%</span>
            </div>
            <div className="bg-border mt-2 h-2 overflow-hidden rounded-full">
              <div className="h-full w-[91%] rounded-full bg-emerald-500" />
            </div>
          </div>
          <button
            className="text-primary mt-5 inline-flex items-center gap-1.5 text-xs font-bold"
            onClick={() => openTab("discussions")}
            type="button"
          >
            Moderate discussions
            <BlogIcon className="size-4" name="chevron" />
          </button>
        </article>
      </section>
    </div>
  );
}

function PostsPanel({
  editPost,
}: {
  readonly editPost: (post: BlogPost) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | PostStatus>("All");
  const visiblePosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return POSTS.filter(
      (post) =>
        (filter === "All" || post.status === filter) &&
        (!normalized ||
          post.title.toLowerCase().includes(normalized) ||
          post.author.toLowerCase().includes(normalized) ||
          post.category.toLowerCase().includes(normalized)),
    );
  }, [filter, query]);

  return (
    <section className="surface-card overflow-hidden rounded-[1.5rem]">
      <div className="border-border flex flex-col gap-4 border-b p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-foreground text-base font-bold">Article library</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Review, edit, schedule, and manage every public story
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="border-border bg-background flex h-10 min-w-0 items-center gap-2 rounded-xl border px-3 sm:w-64">
            <BlogIcon className="text-muted-foreground size-4" name="search" />
            <span className="sr-only">Search posts</span>
            <input
              className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-xs outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, author, category"
              type="search"
              value={query}
            />
          </label>
          <select
            className="border-border bg-background h-10 rounded-xl border px-3 text-xs font-semibold outline-none"
            onChange={(event) =>
              setFilter(event.target.value as "All" | PostStatus)
            }
            value={filter}
          >
            {["All", "Published", "Draft", "Scheduled", "In review"].map(
              (option) => (
                <option key={option}>{option}</option>
              ),
            )}
          </select>
        </div>
      </div>

      <div className="border-border text-muted-foreground hidden grid-cols-[minmax(280px,1.6fr)_120px_145px_120px_76px] gap-4 border-b px-6 py-3 text-[.62rem] font-bold tracking-[.1em] uppercase lg:grid">
        <span>Article</span>
        <span>Status</span>
        <span>Performance</span>
        <span>Updated</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y">
        {visiblePosts.map((post) => (
          <article
            className="grid gap-4 p-5 lg:grid-cols-[minmax(280px,1.6fr)_120px_145px_120px_76px] lg:items-center lg:px-6"
            key={post.id}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "size-14 shrink-0 rounded-xl bg-gradient-to-br",
                  post.tone,
                )}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-foreground truncate text-xs font-bold">
                    {post.title}
                  </p>
                  {post.featured ? (
                    <span className="bg-primary/10 text-primary shrink-0 rounded-full px-2 py-0.5 text-[.58rem] font-bold">
                      Featured
                    </span>
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-1 truncate text-[.64rem]">
                  {post.category} · {post.author}
                </p>
              </div>
            </div>
            <div>
              <StatusBadge status={post.status} />
            </div>
            <div className="text-muted-foreground flex items-center gap-3 text-[.64rem]">
              <span className="flex items-center gap-1">
                <BlogIcon className="size-3.5" name="eye" />
                {post.views.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <BlogIcon className="size-3.5" name="comment" />
                {post.comments}
              </span>
            </div>
            <div>
              <p className="text-foreground text-[.68rem] font-semibold">
                {post.updatedAt}
              </p>
              <p className="text-muted-foreground mt-1 text-[.62rem]">
                {post.readTime} read
              </p>
            </div>
            <div className="flex justify-end gap-1">
              <button
                aria-label={`Edit ${post.title}`}
                className="hover:bg-primary/10 hover:text-primary grid size-8 place-items-center rounded-lg transition"
                onClick={() => editPost(post)}
                type="button"
              >
                <BlogIcon className="size-4" name="edit" />
              </button>
              <button
                aria-label={`More options for ${post.title}`}
                className="hover:bg-surface-subtle text-muted-foreground grid size-8 place-items-center rounded-lg"
                type="button"
              >
                <BlogIcon className="size-4" name="more" />
              </button>
            </div>
          </article>
        ))}
        {visiblePosts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-foreground text-sm font-bold">
              No articles found
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Try a different search term or publishing status.
            </p>
          </div>
        ) : null}
      </div>
      <div className="border-border text-muted-foreground flex items-center justify-between border-t px-5 py-4 text-[.68rem] sm:px-6">
        <span>Showing {visiblePosts.length} of 28 articles</span>
        <div className="flex gap-2">
          <button
            className="border-border rounded-lg border px-3 py-1.5"
            type="button"
          >
            Previous
          </button>
          <button
            className="border-border rounded-lg border px-3 py-1.5"
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

function EditorPanel({
  editingPost,
  notify,
}: {
  readonly editingPost: BlogPost | null;
  readonly notify: (message: string) => void;
}) {
  const [title, setTitle] = useState(
    editingPost?.title ??
      "How small, consistent study sessions build stronger results",
  );
  const [excerpt, setExcerpt] = useState(
    editingPost?.excerpt ??
      "A practical guide to building a study rhythm learners can sustain, even on busy weeks.",
  );
  const [category, setCategory] = useState(
    editingPost?.category ?? "Study Skills",
  );
  const [author, setAuthor] = useState(
    editingPost?.author ?? "Preppal Learning Team",
  );
  const [slug, setSlug] = useState(
    editingPost?.slug ?? "consistent-study-sessions",
  );
  const [tags, setTags] = useState(
    editingPost
      ? "Study habits, Consistency, Exam prep"
      : "Study habits, Focus",
  );
  const [featured, setFeatured] = useState(editingPost?.featured ?? false);
  const [body, setBody] = useState(
    "Long study sessions can feel productive, but they are difficult to repeat consistently. A shorter routine that learners return to every day often creates stronger recall and less pressure.\n\nStart by choosing one clear learning goal for each session. Complete a focused quiz, review the explanation behind every missed answer, and write down the one idea you want to remember tomorrow.",
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="surface-card overflow-hidden rounded-[1.5rem]">
        <div className="border-border flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-foreground text-base font-bold">
              {editingPost ? "Edit article" : "Create article"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Draft the story exactly as it will appear to learners
            </p>
          </div>
          <span className="text-muted-foreground text-[.66rem]">
            Autosaved just now
          </span>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <label className="block">
            <span className="text-muted-foreground mb-2 block text-[.68rem] font-bold">
              Article title
            </span>
            <textarea
              className="placeholder:text-muted-foreground min-h-20 w-full resize-none bg-transparent text-2xl font-bold tracking-[-0.04em] outline-none sm:text-3xl"
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give the story a clear, useful title"
              value={title}
            />
            <span className="text-muted-foreground mt-1 block text-right text-[.62rem]">
              {title.length}/120
            </span>
          </label>

          <label className="block">
            <span className="text-muted-foreground mb-2 block text-[.68rem] font-bold">
              Description
            </span>
            <textarea
              className="border-border bg-background focus:border-primary min-h-24 w-full resize-y rounded-2xl border px-4 py-3 text-[.78rem] leading-5 outline-none"
              maxLength={240}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="A concise introduction used on the blog card and search results"
              value={excerpt}
            />
            <span className="text-muted-foreground mt-1 block text-right text-[.62rem]">
              {excerpt.length}/240
            </span>
          </label>

          <div>
            <div className="text-muted-foreground mb-2 flex items-center justify-between gap-3">
              <span className="text-[.68rem] font-bold">Article content</span>
              <span className="text-[.62rem]">About 4 min read</span>
            </div>
            <div className="border-border overflow-hidden rounded-2xl border">
              <div className="border-border bg-surface-subtle flex flex-wrap items-center gap-1 border-b p-2">
                {["H2", "H3", "B", "I", "“”"].map((control) => (
                  <button
                    className="hover:bg-surface grid h-8 min-w-8 place-items-center rounded-lg px-2 text-[.68rem] font-bold"
                    key={control}
                    type="button"
                  >
                    {control}
                  </button>
                ))}
                <span className="bg-border mx-1 h-5 w-px" />
                <button
                  className="hover:bg-surface flex h-8 items-center gap-1.5 rounded-lg px-2 text-[.68rem] font-bold"
                  type="button"
                >
                  <BlogIcon className="size-3.5" name="link" />
                  Link
                </button>
                <button
                  className="hover:bg-surface flex h-8 items-center gap-1.5 rounded-lg px-2 text-[.68rem] font-bold"
                  type="button"
                >
                  <BlogIcon className="size-3.5" name="image" />
                  Inline image
                </button>
              </div>
              <textarea
                className="bg-surface min-h-72 w-full resize-y px-5 py-5 text-[.8rem] leading-7 outline-none"
                onChange={(event) => setBody(event.target.value)}
                placeholder="Start writing your article..."
                value={body}
              />
              <div className="border-border bg-surface-subtle/50 m-4 mt-0 overflow-hidden rounded-2xl border">
                <div className="from-primary/20 via-primary/10 to-surface-subtle grid min-h-36 place-items-center bg-gradient-to-br">
                  <div className="text-primary text-center">
                    <BlogIcon className="mx-auto size-7" name="image" />
                    <p className="mt-2 text-[.68rem] font-bold">
                      Inline article image
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <input
                    aria-label="Image caption"
                    className="min-w-0 flex-1 bg-transparent text-[.68rem] outline-none"
                    defaultValue="A focused learner completing a short daily practice session."
                  />
                  <div className="flex gap-2">
                    <button
                      className="text-primary text-[.66rem] font-bold"
                      type="button"
                    >
                      Replace
                    </button>
                    <button
                      className="text-danger text-[.66rem] font-bold"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-foreground text-sm font-bold">Publish</p>
            <StatusBadge status={editingPost?.status ?? "Draft"} />
          </div>
          <div className="mt-5 space-y-3">
            <button
              className="bg-primary text-primary-foreground hover:bg-primary-strong h-10 w-full rounded-xl text-xs font-bold transition"
              onClick={() => notify("Article published to the blog preview.")}
              type="button"
            >
              {editingPost?.status === "Published"
                ? "Update article"
                : "Publish article"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="border-border hover:bg-surface-subtle h-10 rounded-xl border text-[.68rem] font-bold"
                onClick={() => notify("Draft saved.")}
                type="button"
              >
                Save draft
              </button>
              <button
                className="border-border hover:bg-surface-subtle flex h-10 items-center justify-center gap-1.5 rounded-xl border text-[.68rem] font-bold"
                onClick={() => notify("Article preview prepared.")}
                type="button"
              >
                <BlogIcon className="size-3.5" name="eye" />
                Preview
              </button>
            </div>
            <button
              className="text-primary flex w-full items-center justify-center gap-1.5 py-1 text-[.68rem] font-bold"
              type="button"
            >
              <BlogIcon className="size-3.5" name="calendar" />
              Schedule for later
            </button>
          </div>
        </section>

        <section className="surface-card rounded-2xl p-5">
          <p className="text-foreground text-sm font-bold">Story details</p>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-muted-foreground mb-1.5 block text-[.64rem] font-bold">
                Category
              </span>
              <select
                className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs outline-none"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                {CATEGORIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-muted-foreground mb-1.5 block text-[.64rem] font-bold">
                Author
              </span>
              <input
                className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs outline-none"
                onChange={(event) => setAuthor(event.target.value)}
                value={author}
              />
            </label>
            <label className="block">
              <span className="text-muted-foreground mb-1.5 block text-[.64rem] font-bold">
                Tags
              </span>
              <input
                className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs outline-none"
                onChange={(event) => setTags(event.target.value)}
                value={tags}
              />
              <span className="text-muted-foreground mt-1.5 block text-[.6rem]">
                Separate tags with commas
              </span>
            </label>
            <label className="border-border flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3">
              <span>
                <span className="text-foreground block text-xs font-bold">
                  Featured story
                </span>
                <span className="text-muted-foreground mt-1 block text-[.6rem]">
                  Show prominently on the blog landing page
                </span>
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
          <div className="from-primary/25 via-primary/10 to-surface-subtle mt-4 grid min-h-32 place-items-center rounded-2xl bg-gradient-to-br">
            <BlogIcon className="text-primary size-7" name="image" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="border-border hover:bg-surface-subtle h-9 rounded-xl border text-[.66rem] font-bold"
              type="button"
            >
              Replace
            </button>
            <button
              className="border-border hover:bg-surface-subtle h-9 rounded-xl border text-[.66rem] font-bold"
              type="button"
            >
              From library
            </button>
          </div>
          <label className="mt-4 block">
            <span className="text-muted-foreground mb-1.5 block text-[.64rem] font-bold">
              Alt text
            </span>
            <input
              className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs outline-none"
              defaultValue="Learner studying with Preppal"
            />
          </label>
        </section>

        <section className="surface-card rounded-2xl p-5">
          <p className="text-foreground text-sm font-bold">Search preview</p>
          <div className="border-border mt-4 rounded-xl border p-3">
            <p className="text-primary truncate text-xs font-semibold">
              {title || "Article title"}
            </p>
            <p className="mt-1 truncate text-[.62rem] text-emerald-700 dark:text-emerald-400">
              preppal.com/news/{slug}
            </p>
            <p className="text-muted-foreground mt-2 line-clamp-2 text-[.64rem] leading-4">
              {excerpt || "Article description will appear here."}
            </p>
          </div>
          <label className="mt-4 block">
            <span className="text-muted-foreground mb-1.5 block text-[.64rem] font-bold">
              URL slug
            </span>
            <input
              className="border-border bg-background h-10 w-full rounded-xl border px-3 text-xs outline-none"
              onChange={(event) => setSlug(event.target.value)}
              value={slug}
            />
          </label>
        </section>
      </aside>
    </div>
  );
}

function DiscussionsPanel() {
  const [discussions, setDiscussions] =
    useState<Discussion[]>(INITIAL_DISCUSSIONS);
  const [filter, setFilter] = useState<"All" | DiscussionStatus>("All");
  const visible = discussions.filter(
    (discussion) => filter === "All" || discussion.status === filter,
  );

  const updateStatus = (id: string, status: DiscussionStatus) => {
    setDiscussions((items) =>
      items.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="surface-card overflow-hidden rounded-[1.5rem]">
        <div className="border-border flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-foreground text-base font-bold">
              Discussion moderation
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Review learner comments before and after publication
            </p>
          </div>
          <select
            className="border-border bg-background h-10 rounded-xl border px-3 text-xs font-semibold outline-none"
            onChange={(event) =>
              setFilter(event.target.value as "All" | DiscussionStatus)
            }
            value={filter}
          >
            {["All", "Pending", "Approved", "Flagged", "Hidden"].map(
              (option) => (
                <option key={option}>{option}</option>
              ),
            )}
          </select>
        </div>
        <div className="divide-y">
          {visible.map((discussion) => (
            <article className="p-5 sm:p-6" key={discussion.id}>
              <div className="flex gap-3">
                <span className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-full text-[.68rem] font-bold">
                  {discussion.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-foreground text-xs font-bold">
                      {discussion.author}
                    </p>
                    <span className="text-muted-foreground text-[.62rem]">
                      {discussion.time}
                    </span>
                    <StatusBadge status={discussion.status} />
                  </div>
                  <p className="text-muted-foreground mt-2 truncate text-[.66rem]">
                    On: {discussion.article}
                  </p>
                  <p className="text-foreground mt-3 text-[.76rem] leading-6">
                    {discussion.message}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="border-border flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[.64rem] font-bold hover:bg-emerald-500/10 hover:text-emerald-700"
                      onClick={() => updateStatus(discussion.id, "Approved")}
                      type="button"
                    >
                      <BlogIcon className="size-3.5" name="check" />
                      Approve
                    </button>
                    <button
                      className="border-border flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[.64rem] font-bold hover:bg-rose-500/10 hover:text-rose-700"
                      onClick={() => updateStatus(discussion.id, "Flagged")}
                      type="button"
                    >
                      <BlogIcon className="size-3.5" name="flag" />
                      Flag
                    </button>
                    <button
                      className="border-border hover:bg-surface-subtle flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[.64rem] font-bold"
                      onClick={() => updateStatus(discussion.id, "Hidden")}
                      type="button"
                    >
                      <BlogIcon className="size-3.5" name="eye" />
                      Hide
                    </button>
                    <button
                      aria-label="Delete comment"
                      className="text-danger hover:bg-danger/10 grid size-8 place-items-center rounded-lg"
                      type="button"
                    >
                      <BlogIcon className="size-3.5" name="trash" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="space-y-5">
        <section className="surface-card rounded-2xl p-5">
          <p className="text-foreground text-sm font-bold">
            Moderation summary
          </p>
          <div className="mt-4 space-y-3">
            {[
              ["Awaiting review", "12", "bg-amber-500"],
              ["Approved today", "38", "bg-emerald-500"],
              ["Flagged", "3", "bg-rose-500"],
              ["Hidden", "6", "bg-slate-400"],
            ].map(([label, value, tone]) => (
              <div className="flex items-center gap-3" key={label}>
                <span className={cn("size-2 rounded-full", tone)} />
                <span className="text-muted-foreground flex-1 text-[.68rem]">
                  {label}
                </span>
                <span className="text-foreground text-xs font-bold">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[.07] p-5">
          <p className="text-foreground text-sm font-bold">
            Community standard
          </p>
          <p className="text-muted-foreground mt-2 text-[.68rem] leading-5">
            Remove harassment, spam, personal information, and content unrelated
            to learning. Keep disagreement respectful and educational.
          </p>
          <button
            className="text-primary mt-4 text-[.68rem] font-bold"
            type="button"
          >
            Review moderation guide
          </button>
        </section>
      </aside>
    </div>
  );
}

function MediaPanel({
  notify,
}: {
  readonly notify: (message: string) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="surface-card rounded-[1.5rem] p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-foreground text-base font-bold">Media library</p>
            <p className="text-muted-foreground mt-2 max-w-md text-xs leading-5">
              Manage cover images and inline article media. Images should be
              optimised, descriptive, and licensed for publication.
            </p>
            <div className="text-muted-foreground mt-5 flex flex-wrap gap-4 text-[.66rem]">
              <span>
                <strong className="text-foreground">42</strong> assets
              </span>
              <span>
                <strong className="text-foreground">18.4 MB</strong> used
              </span>
              <span>
                <strong className="text-foreground">6</strong> unused
              </span>
            </div>
          </div>
          <button
            className="border-primary/30 bg-primary/[.03] hover:bg-primary/[.06] flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition"
            onClick={() => notify("Media upload selected.")}
            type="button"
          >
            <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-2xl">
              <BlogIcon className="size-5" name="upload" />
            </span>
            <span className="text-foreground mt-3 text-xs font-bold">
              Upload images
            </span>
            <span className="text-muted-foreground mt-1 text-[.64rem]">
              PNG, JPG or WebP · up to 5 MB
            </span>
          </button>
        </div>
      </section>

      <section className="surface-card overflow-hidden rounded-[1.5rem]">
        <div className="border-border flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-foreground text-sm font-bold">All media</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Select an image to inspect usage and metadata
            </p>
          </div>
          <label className="border-border bg-background flex h-10 items-center gap-2 rounded-xl border px-3 sm:w-60">
            <BlogIcon className="text-muted-foreground size-4" name="search" />
            <input
              className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-xs outline-none"
              placeholder="Search media"
              type="search"
            />
          </label>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {MEDIA.map((item) => (
            <article
              className="border-border group overflow-hidden rounded-2xl border"
              key={item.id}
            >
              <div
                className={cn(
                  "relative grid aspect-video place-items-center bg-gradient-to-br",
                  item.tone,
                )}
              >
                <BlogIcon className="size-7 text-white/75" name="image" />
                <button
                  aria-label={`More options for ${item.name}`}
                  className="absolute top-2 right-2 grid size-8 place-items-center rounded-lg bg-black/25 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100"
                  type="button"
                >
                  <BlogIcon className="size-4" name="more" />
                </button>
              </div>
              <div className="p-3">
                <p className="text-foreground truncate text-[.7rem] font-bold">
                  {item.name}
                </p>
                <p className="text-muted-foreground mt-1 text-[.62rem]">
                  {item.meta}
                </p>
                <p className="text-primary mt-2 text-[.62rem] font-semibold">
                  {item.used}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [notice, setNotice] = useState("");

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
    window.setTimeout(() => setNotice(""), 2600);
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
              Create thoughtful stories, manage the public journal, and keep
              learner discussions healthy.
            </p>
          </div>
          <button
            className="bg-primary text-primary-foreground hover:bg-primary-strong inline-flex h-11 w-fit items-center gap-2 rounded-xl px-4 text-xs font-bold shadow-[0_10px_25px_rgba(92,53,245,.2)] transition"
            onClick={() => openEditor()}
            type="button"
          >
            <BlogIcon className="size-4" name="plus" />
            Create new article
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
              {tab.value === "discussions" ? (
                <span
                  className={cn(
                    "ml-2 rounded-full px-1.5 py-0.5 text-[.56rem]",
                    activeTab === tab.value
                      ? "bg-white/20 text-white"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                  )}
                >
                  12
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {notice ? (
          <div
            aria-live="polite"
            className="border-success/25 bg-success/10 text-success mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold"
          >
            <BlogIcon className="size-4" name="check" />
            {notice}
          </div>
        ) : null}

        {activeTab === "overview" ? (
          <OverviewPanel openEditor={openEditor} openTab={openTab} />
        ) : null}
        {activeTab === "posts" ? <PostsPanel editPost={openEditor} /> : null}
        {activeTab === "editor" ? (
          <EditorPanel editingPost={editingPost} notify={notify} />
        ) : null}
        {activeTab === "discussions" ? <DiscussionsPanel /> : null}
        {activeTab === "media" ? <MediaPanel notify={notify} /> : null}
      </div>
    </AdminShell>
  );
}
