"use client";

import { FormEvent, useState } from "react";
import { AdminShell } from "@/components/layout";

type ContentTab = "blog" | "exams";
type PublishStatus = "Published" | "Draft";

interface BlogPost {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly updatedAt: string;
  status: PublishStatus;
}

interface ExamUpload {
  readonly id: string;
  readonly name: string;
  readonly subject: string;
  readonly year: string;
  readonly questions: number;
  readonly uploadedAt: string;
  status: "Ready" | "Processing";
}

const INITIAL_POSTS: BlogPost[] = [
  { id: "POST-018", title: "How to build a study routine that sticks", author: "Preppal team", updatedAt: "2026-09-08", status: "Published" },
  { id: "POST-017", title: "Understanding your XP and coin balance", author: "Preppal team", updatedAt: "2026-09-05", status: "Published" },
  { id: "POST-016", title: "Five ways to prepare for a timed exam", author: "Amaka Okafor", updatedAt: "2026-09-03", status: "Draft" },
];

const INITIAL_UPLOADS: ExamUpload[] = [
  { id: "UP-204", name: "JAMB Mathematics", subject: "Mathematics", year: "2025", questions: 40, uploadedAt: "2026-09-09", status: "Ready" },
  { id: "UP-203", name: "WAEC Biology", subject: "Biology", year: "2024", questions: 50, uploadedAt: "2026-09-07", status: "Ready" },
  { id: "UP-202", name: "JAMB English Language", subject: "English Language", year: "2025", questions: 60, uploadedAt: "2026-09-06", status: "Processing" },
];

const formatDate = (value: string) => new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

function StatusBadge({ status }: { readonly status: PublishStatus | ExamUpload["status"] }) {
  const styles: Record<typeof status, string> = {
    Published: "bg-emerald-500/10 text-emerald-700",
    Draft: "bg-amber-500/10 text-amber-700",
    Ready: "bg-emerald-500/10 text-emerald-700",
    Processing: "bg-blue-500/10 text-blue-700",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}>{status}</span>;
}

export default function ContentPage() {
  const [tab, setTab] = useState<ContentTab>("blog");
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [uploads, setUploads] = useState(INITIAL_UPLOADS);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [examName, setExamName] = useState("JAMB");
  const [subject, setSubject] = useState("Mathematics");
  const [year, setYear] = useState("2025");
  const [fileName, setFileName] = useState("");
  const [notice, setNotice] = useState("");

  const createPost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setPosts((items) => [{ id: `POST-${String(items.length + 19).padStart(3, "0")}`, title: title.trim(), author: "Admin", updatedAt: new Date().toISOString().slice(0, 10), status: "Draft" }, ...items]);
    setTitle("");
    setBody("");
    setNotice("Draft saved to the blog library.");
  };

  const uploadExam = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileName) return;
    setUploads((items) => [{ id: `UP-${205 + items.length}`, name: `${examName} ${subject}`, subject, year, questions: 0, uploadedAt: new Date().toISOString().slice(0, 10), status: "Processing" }, ...items]);
    setFileName("");
    setNotice("Exam file queued for validation and question extraction.");
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <span className="eyebrow">Content operations</span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Content editor</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">Create helpful learning content and safely add professionally authored exam questions to the practice library.</p>
        </header>

        <div className="surface-card flex w-full gap-1 rounded-2xl p-1.5 sm:w-fit">
          {(["blog", "exams"] as const).map((value) => <button className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-subtle"}`} key={value} onClick={() => { setTab(value); setNotice(""); }} type="button">{value === "blog" ? "Blog posts" : "Upload exams"}</button>)}
        </div>

        {notice ? <div className="border-success/30 bg-success/10 text-success rounded-xl border px-4 py-3 text-sm font-medium">{notice}</div> : null}

        {tab === "blog" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <section className="surface-card rounded-2xl p-5 sm:p-6">
              <div className="mb-5"><h2 className="font-semibold">Write a post</h2><p className="text-muted-foreground mt-1 text-xs">Draft first, then publish after a content review.</p></div>
              <form className="space-y-4" onSubmit={createPost}>
                <label className="block"><span className="text-muted-foreground mb-1.5 block text-xs font-semibold">Title</span><input className="border-border bg-background focus:border-primary h-11 w-full rounded-xl border px-3 text-sm outline-none" onChange={(event) => setTitle(event.target.value)} placeholder="Give the post a clear title" value={title} /></label>
                <label className="block"><span className="text-muted-foreground mb-1.5 block text-xs font-semibold">Content</span><textarea className="border-border bg-background focus:border-primary min-h-48 w-full resize-y rounded-xl border px-3 py-3 text-sm outline-none" onChange={(event) => setBody(event.target.value)} placeholder="Write practical guidance for learners..." value={body} /></label>
                <div className="flex items-center justify-between gap-3"><p className="text-muted-foreground text-xs">Posts are saved as drafts by default.</p><button className="bg-primary text-primary-foreground hover:bg-primary-strong rounded-xl px-4 py-2.5 text-xs font-semibold" type="submit">Save draft</button></div>
              </form>
            </section>
            <section className="surface-card overflow-hidden rounded-2xl">
              <div className="border-border flex items-center justify-between border-b p-5"><div><h2 className="font-semibold">Blog library</h2><p className="text-muted-foreground mt-1 text-xs">{posts.length} posts in your workspace</p></div><button className="text-primary text-xs font-semibold" type="button">View published</button></div>
              <div className="divide-border divide-y">{posts.map((post) => <article className="flex items-center justify-between gap-4 p-5" key={post.id}><div className="min-w-0"><p className="truncate text-sm font-semibold">{post.title}</p><p className="text-muted-foreground mt-1 text-xs">{post.id} · {post.author} · Updated {formatDate(post.updatedAt)}</p></div><StatusBadge status={post.status} /></article>)}</div>
            </section>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <section className="surface-card rounded-2xl p-5 sm:p-6">
              <div className="mb-5"><h2 className="font-semibold">Upload question bank</h2><p className="text-muted-foreground mt-1 text-xs">Add metadata first so questions are searchable and assigned correctly.</p></div>
              <form className="space-y-4" onSubmit={uploadExam}>
                <div className="grid gap-3 sm:grid-cols-2"><label><span className="text-muted-foreground mb-1.5 block text-xs font-semibold">Exam</span><select className="border-border bg-background h-11 w-full rounded-xl border px-3 text-sm" onChange={(event) => setExamName(event.target.value)} value={examName}><option>JAMB</option><option>WAEC</option><option>NECO</option></select></label><label><span className="text-muted-foreground mb-1.5 block text-xs font-semibold">Year</span><select className="border-border bg-background h-11 w-full rounded-xl border px-3 text-sm" onChange={(event) => setYear(event.target.value)} value={year}>{["2026", "2025", "2024", "2023", "2022"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
                <label><span className="text-muted-foreground mb-1.5 block text-xs font-semibold">Subject</span><select className="border-border bg-background h-11 w-full rounded-xl border px-3 text-sm" onChange={(event) => setSubject(event.target.value)} value={subject}>{["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "Government"].map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="border-primary/30 bg-primary/[0.03] hover:bg-primary/[0.06] flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-7 text-center transition"><span className="bg-primary/10 text-primary mb-2 grid size-10 place-items-center rounded-xl text-lg">↑</span><span className="text-sm font-semibold">{fileName || "Choose a CSV or JSON file"}</span><span className="text-muted-foreground mt-1 text-xs">Questions, options, answer keys, and explanations</span><input className="sr-only" accept=".csv,.json" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} type="file" /></label>
                <button className="bg-primary text-primary-foreground hover:bg-primary-strong w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50" disabled={!fileName} type="submit">Queue exam upload</button>
              </form>
            </section>
            <section className="surface-card overflow-hidden rounded-2xl"><div className="border-border border-b p-5"><h2 className="font-semibold">Recent uploads</h2><p className="text-muted-foreground mt-1 text-xs">Validation status for incoming question banks.</p></div><div className="divide-border divide-y">{uploads.map((upload) => <article className="flex items-center justify-between gap-4 p-5" key={upload.id}><div className="min-w-0"><p className="text-sm font-semibold">{upload.name}</p><p className="text-muted-foreground mt-1 text-xs">{upload.id} · {upload.year} · {upload.questions ? `${upload.questions} questions` : "Extracting questions"} · {formatDate(upload.uploadedAt)}</p></div><StatusBadge status={upload.status} /></article>)}</div></section>
          </div>
        )}
        <p className="text-muted-foreground text-xs">Before publishing or activating an upload, confirm ownership, answer keys, explanations, and subject/year metadata. AI-generated practice can complement this professionally reviewed library.</p>
      </div>
    </AdminShell>
  );
}
