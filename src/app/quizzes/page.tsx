"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileQuestion,
  FolderTree,
  Layers3,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  LoaderCircle,
  X,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  AdminPageHeader,
  MetricCard,
  Pagination,
  SectionCard,
  SegmentedControl,
  StatusBadge,
} from "@/components/admin-ui";
import { AdminShell } from "@/components/layout";
import { Select } from "@/components/ui";
import { apiClient } from "@/lib/api/client";
import {
  RichContent,
  RichContentEditor,
} from "@/components/rich-content-editor";

type Tab = "questions" | "exams" | "standalone" | "reports";
type Path = "EXAM" | "STANDALONE";
type Status = "ARCHIVED" | "DRAFT" | "IN_REVIEW" | "PUBLISHED";
interface Topic {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  subjectClassId?: string;
}
interface SubjectClass {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  topics: Topic[];
}
interface Subject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  topics: Topic[];
  classes: SubjectClass[];
  _count?: { questions: number };
}
interface ExamSubjectYear {
  id: string;
  active: boolean;
  examYear: { id: string; year: number };
}
interface ExamSubject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  years: ExamSubjectYear[];
  _count: { questions: number };
}
interface Exam {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  subjects: ExamSubject[];
  years: Array<{ id: string; year: number }>;
}
interface Option {
  id?: string;
  label: string;
  text: string;
  isCorrect: boolean;
}
interface Question {
  id: string;
  reference: string;
  path: Path;
  prompt: string;
  passage?: string;
  explanation?: string;
  status: Status;
  subject?: Pick<Subject, "id" | "name" | "slug">;
  examSubject?: Pick<ExamSubject, "id" | "name" | "slug">;
  topic?: Pick<Topic, "id" | "name" | "slug" | "subjectClassId">;
  options: Option[];
  updatedAt: string;
  examSubjectYear?: {
    id: string;
    examYear: { id: string; year: number };
    examSubject: Pick<ExamSubject, "id" | "name" | "slug"> & {
      exam: Pick<Exam, "id" | "name" | "slug">;
    };
  };
}
interface Flag {
  id: string;
  questionReference: string;
  flagType: string;
  status: string;
  notes?: string;
}
interface Workspace {
  exams: Exam[];
  standaloneSubjects: Subject[];
  questions: Question[];
  flags: Flag[];
  metrics: Partial<Record<Status, number>>;
  pagination: { page: number; pageSize: number; total: number; pages: number };
}
interface BatchDraftQuestion {
  path: "STANDALONE";
  subjectId: string;
  topicId?: string;
  prompt: string;
  passage?: string;
  explanation?: string;
  status: Status;
  options: Option[];
}
interface GeneratedBatch {
  subject: { id: string; name: string };
  topic: { id: string; name: string } | null;
  questions: BatchDraftQuestion[];
}

const tabs = [
  { label: "Question bank", value: "questions" },
  { label: "Exam setup", value: "exams" },
  { label: "Standalone subjects", value: "standalone" },
  { label: "Reports", value: "reports" },
] as const;
const input =
  "border-border bg-background text-foreground focus:border-primary h-9 w-full rounded-xl border px-3 text-[.68rem] outline-none transition";
const primary =
  "bg-primary text-primary-foreground inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3.5 text-[.68rem] font-bold disabled:opacity-50";
const secondary =
  "border-border text-foreground hover:bg-surface-subtle inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3.5 text-[.68rem] font-bold disabled:opacity-50";
const labels = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
const plainText = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
const tone = (status: Status) =>
  status === "PUBLISHED"
    ? ("success" as const)
    : status === "ARCHIVED"
      ? ("danger" as const)
      : status === "IN_REVIEW"
        ? ("info" as const)
        : ("warning" as const);

function Modal({
  children,
  onClose,
  title,
  wide = false,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
  wide?: boolean;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <button
        aria-label="Close"
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />
      <section
        aria-modal="true"
        className={`bg-surface border-border relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-6 ${wide ? "max-w-5xl" : "max-w-2xl"}`}
        role="dialog"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-foreground text-base font-bold">{title}</h2>
          <button
            className="text-muted-foreground grid size-8 place-items-center rounded-xl"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
}

function Empty({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="border-border bg-surface-subtle/40 rounded-2xl border border-dashed px-5 py-9 text-center">
      <FolderTree className="text-primary mx-auto size-7" />
      <p className="text-foreground mt-3 text-[.75rem] font-bold">{title}</p>
      <p className="text-muted-foreground mt-1 text-[.63rem]">{children}</p>
    </div>
  );
}

interface DeleteTarget {
  type:
    | "exam"
    | "subject"
    | "subjectClass"
    | "examSubject"
    | "year"
    | "topic"
    | "question";
  id: string;
  name: string;
  parentName?: string;
}

function ConfirmDeleteModal({
  target,
  onClose,
  onDeleted,
}: {
  target: DeleteTarget;
  onClose: () => void;
  onDeleted: (message: string) => void;
}) {
  const cache = useQueryClient();
  const getEndpoint = () => {
    switch (target.type) {
      case "exam":
        return `/api/v1/admin/question-bank/exams/${target.id}`;
      case "examSubject":
        return `/api/v1/admin/question-bank/exam-subjects/${target.id}`;
      case "subject":
        return `/api/v1/admin/question-bank/subjects/${target.id}`;
      case "subjectClass":
        return `/api/v1/admin/question-bank/subject-classes/${target.id}`;
      case "year":
        return `/api/v1/admin/question-bank/exam-subject-years/${target.id}`;
      case "topic":
        return `/api/v1/admin/question-bank/topics/${target.id}`;
      case "question":
        return `/api/v1/admin/question-bank/questions/${target.id}`;
    }
  };

  const getDetails = () => {
    switch (target.type) {
      case "exam":
        return {
          title: "Delete exam",
          itemLabel: `exam "${target.name}"`,
          cascadeNotice:
            "This will permanently delete this exam and all its subjects, years, and questions.",
          confirmButton: "Delete exam",
          successMessage: `Exam "${target.name}" and all its contents were deleted.`,
        };
      case "examSubject":
        return {
          title: "Delete exam subject",
          itemLabel: `subject "${target.name}"`,
          cascadeNotice: `This will permanently delete this exam subject and all its years and questions. The parent exam "${target.parentName || "Exam"}" will not be affected.`,
          confirmButton: "Delete subject",
          successMessage: `Subject "${target.name}" and its questions were deleted.`,
        };
      case "subject":
        return {
          title: "Delete standalone subject",
          itemLabel: `subject "${target.name}"`,
          cascadeNotice:
            "This will permanently delete this standalone subject and all its topics and questions.",
          confirmButton: "Delete subject",
          successMessage: `Subject "${target.name}" and its questions were deleted.`,
        };
      case "subjectClass":
        return {
          title: "Delete class",
          itemLabel: `class "${target.name}"`,
          cascadeNotice: `This will delete the class, its topics, and their questions. The parent subject "${target.parentName || "Subject"}" will not be affected.`,
          confirmButton: "Delete class",
          successMessage: `Class "${target.name}" and its content were deleted.`,
        };
      case "year":
        return {
          title: "Delete exam year",
          itemLabel: `year ${target.name} for "${target.parentName || "this subject"}"`,
          cascadeNotice:
            "This will delete all questions belonging to this year. Other years and the parent subject will not be affected.",
          confirmButton: "Delete year",
          successMessage: `Year ${target.name} and its questions were deleted.`,
        };
      case "topic":
        return {
          title: "Delete topic",
          itemLabel: `topic "${target.name}"`,
          cascadeNotice: `This will delete all questions under this topic. The parent subject "${target.parentName || "Subject"}" will not be affected.`,
          confirmButton: "Delete topic",
          successMessage: `Topic "${target.name}" and its questions were deleted.`,
        };
      case "question":
        return {
          title: "Delete question",
          itemLabel: `question "${target.name}"`,
          cascadeNotice:
            "This question will be permanently removed. The subject, topic, and exam will not be affected.",
          confirmButton: "Delete question",
          successMessage: `Question "${target.name}" was permanently deleted.`,
        };
    }
  };

  const info = getDetails();
  const del = useMutation({
    mutationFn: () => apiClient(getEndpoint(), { method: "DELETE" }),
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ["admin", "question-bank"] });
      onDeleted(info.successMessage);
      onClose();
    },
  });

  return (
    <Modal onClose={onClose} title={info.title}>
      <div className="space-y-4">
        <div className="border-danger/20 bg-danger/5 flex items-start gap-3 rounded-2xl border p-4">
          <AlertCircle className="text-danger mt-0.5 size-5 shrink-0" />
          <div className="space-y-1">
            <p className="text-foreground text-[.74rem] font-bold">
              Are you sure you want to delete {info.itemLabel}?
            </p>
            <p className="text-muted-foreground text-[.64rem] leading-relaxed">
              {info.cascadeNotice}
            </p>
          </div>
        </div>

        {del.error ? (
          <p className="bg-danger/10 text-danger rounded-xl p-3 text-[.64rem] font-semibold">
            {del.error.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            className={secondary}
            disabled={del.isPending}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="bg-danger hover:bg-danger/90 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-4 text-[.66rem] font-bold text-white transition-colors disabled:opacity-50"
            disabled={del.isPending}
            onClick={() => del.mutate()}
            type="button"
          >
            {del.isPending ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            {del.isPending ? "Deleting…" : info.confirmButton}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreateEntity({
  mode,
  onClose,
  onDone,
}: {
  mode: "exam" | "standalone";
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const cache = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const save = useMutation({
    mutationFn: () =>
      apiClient(
        `/api/v1/admin/question-bank/${mode === "exam" ? "exams" : "subjects"}`,
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
          }),
        },
      ),
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ["admin", "question-bank"] });
      onDone(`${mode === "exam" ? "Exam" : "Subject"} created.`);
    },
  });
  return (
    <Modal
      onClose={onClose}
      title={mode === "exam" ? "Create exam" : "Create standalone subject"}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <label className="text-foreground block text-[.65rem] font-bold">
          Name
          <input
            autoFocus
            className={`${input} mt-1.5`}
            onChange={(event) => setName(event.target.value)}
            placeholder={
              mode === "exam" ? "e.g. JAMB" : "e.g. Financial literacy"
            }
            value={name}
          />
        </label>
        <label className="text-foreground block text-[.65rem] font-bold">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
          <textarea
            className="border-border bg-background mt-1.5 min-h-24 w-full rounded-xl border p-3 text-[.68rem] font-normal outline-none"
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
        </label>
        {save.error ? (
          <p className="text-danger text-[.62rem]">{save.error.message}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button className={secondary} onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className={primary}
            disabled={name.trim().length < 2 || save.isPending}
            type="submit"
          >
            {save.isPending ? "Saving…" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ExamSetup({
  data,
  notify,
}: {
  data: Workspace;
  notify: (value: string) => void;
}) {
  const cache = useQueryClient();
  const [examId, setExamId] = useState(data.exams[0]?.id ?? "");
  const [newSubject, setNewSubject] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearOwner, setYearOwner] = useState("");
  const [createExam, setCreateExam] = useState(false);
  const [importExamJson, setImportExamJson] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const exam = data.exams.find((item) => item.id === examId) ?? data.exams[0];
  const refresh = async (message: string) => {
    await cache.invalidateQueries({ queryKey: ["admin", "question-bank"] });
    notify(message);
  };
  const addNewSubject = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/admin/question-bank/exams/${exam.id}/subjects`, {
        method: "POST",
        body: JSON.stringify({ name: newSubject.trim() }),
      }),
    onSuccess: async () => {
      setNewSubject("");
      await refresh("Exam subject created.");
    },
  });
  const addYear = useMutation({
    mutationFn: () =>
      apiClient(
        `/api/v1/admin/question-bank/exam-subjects/${yearOwner}/years`,
        { method: "POST", body: JSON.stringify({ year }) },
      ),
    onSuccess: () => refresh("Exam year added."),
  });
  return (
    <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <SectionCard
        className="min-w-0"
        description="Select an exam to configure."
        title="Exams"
      >
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-[.62rem] font-bold whitespace-nowrap transition-colors"
            onClick={() => setImportExamJson(true)}
            type="button"
          >
            <Sparkles className="size-3.5 shrink-0" /> Import JSON
          </button>
          <button
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2.5 text-[.62rem] font-bold whitespace-nowrap transition-colors"
            onClick={() => setCreateExam(true)}
            type="button"
          >
            <Plus className="size-3.5 shrink-0" /> New exam
          </button>
        </div>
        <div className="space-y-1.5">
          {data.exams.map((item) => (
            <div
              className={`group flex items-center justify-between gap-1 rounded-xl pr-1.5 transition-colors ${exam?.id === item.id ? "bg-primary/10 text-primary" : "hover:bg-surface-subtle"}`}
              key={item.id}
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left"
                onClick={() => setExamId(item.id)}
                type="button"
              >
                <BookOpen className="size-4 shrink-0" />
                <span className="truncate text-[.7rem] font-bold">
                  {item.name}
                </span>
                <span className="text-muted-foreground ml-auto pr-1 text-[.58rem]">
                  {item.subjects.length}
                </span>
              </button>
              <button
                className="text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-lg p-1.5 opacity-60 transition-colors hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget({
                    type: "exam",
                    id: item.id,
                    name: item.name,
                  });
                }}
                title={`Delete exam ${item.name}`}
                type="button"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {!data.exams.length ? (
            <Empty title="No exams">
              Create an exam before attaching subjects.
            </Empty>
          ) : null}
        </div>
      </SectionCard>
      {exam ? (
        <div className="space-y-4">
          <SectionCard
            description={
              exam.description ||
              "Create subjects specifically for this exam, then add the years available for each subject."
            }
            title={exam.name}
          >
            <div>
              <form
                className="border-border rounded-2xl border p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  addNewSubject.mutate();
                }}
              >
                <p className="text-foreground text-[.66rem] font-bold">
                  Create exam subject
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    className={input}
                    onChange={(event) => setNewSubject(event.target.value)}
                    placeholder="Subject name"
                    value={newSubject}
                  />
                  <button
                    className={primary}
                    disabled={!newSubject.trim() || addNewSubject.isPending}
                    type="submit"
                  >
                    {addNewSubject.isPending ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    {addNewSubject.isPending ? "Adding…" : "Add"}
                  </button>
                </div>
                {addNewSubject.error ? (
                  <p className="text-danger mt-2 text-[.6rem]">
                    {addNewSubject.error.message}
                  </p>
                ) : null}
              </form>
            </div>
          </SectionCard>
          <SectionCard
            description="Configure the years available for each exam subject."
            title="Exam subjects and years"
          >
            <div className="space-y-3">
              {exam.subjects.map((entry) => (
                <article
                  className="border-border rounded-2xl border p-3.5"
                  key={entry.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-foreground text-[.73rem] font-bold">
                          {entry.name}
                        </h3>
                        <button
                          className="text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-lg p-1 transition-colors"
                          onClick={() =>
                            setDeleteTarget({
                              type: "examSubject",
                              id: entry.id,
                              name: entry.name,
                              parentName: exam.name,
                            })
                          }
                          title={`Delete subject ${entry.name}`}
                          type="button"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                      <p className="text-muted-foreground mt-1 text-[.58rem]">
                        {entry._count.questions} questions
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.years.map((item) => (
                        <span
                          className="bg-primary/8 text-primary inline-flex items-center gap-1 rounded-full py-0.5 pr-1.5 pl-2.5 text-[.58rem] font-bold"
                          key={item.id}
                        >
                          <span>{item.examYear.year}</span>
                          <button
                            className="hover:text-danger hover:bg-danger/10 rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
                            onClick={() =>
                              setDeleteTarget({
                                type: "year",
                                id: item.id,
                                name: `${item.examYear.year}`,
                                parentName: entry.name,
                              })
                            }
                            title={`Delete year ${item.examYear.year}`}
                            type="button"
                          >
                            <X className="size-2.5" />
                          </button>
                        </span>
                      ))}
                      {!entry.years.length ? (
                        <span className="text-muted-foreground text-[.58rem]">
                          No years yet
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="border-border mt-3 grid gap-2 border-t pt-3 sm:grid-cols-[130px_auto] sm:justify-end">
                    <input
                      className={input}
                      max={2200}
                      min={1950}
                      onFocus={() => setYearOwner(entry.id)}
                      onChange={(event) => {
                        setYearOwner(entry.id);
                        setYear(Number(event.target.value));
                      }}
                      type="number"
                      value={
                        yearOwner === entry.id ? year : new Date().getFullYear()
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        className={secondary}
                        disabled={yearOwner !== entry.id || addYear.isPending}
                        onClick={() => addYear.mutate()}
                        type="button"
                      >
                        {addYear.isPending && yearOwner === entry.id ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : (
                          <CalendarDays className="size-3.5" />
                        )}
                        {addYear.isPending && yearOwner === entry.id
                          ? "Adding…"
                          : "Year"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {!exam.subjects.length ? (
                <Empty title="No subjects">
                  Create the first subject for this exam.
                </Empty>
              ) : null}
            </div>
          </SectionCard>
        </div>
      ) : null}
      {createExam ? (
        <CreateEntity
          mode="exam"
          onClose={() => setCreateExam(false)}
          onDone={(message) => {
            setCreateExam(false);
            notify(message);
          }}
        />
      ) : null}
      {importExamJson ? (
        <ExamJsonImporter
          onClose={() => setImportExamJson(false)}
          onDone={async (message) => {
            setImportExamJson(false);
            await refresh(message);
          }}
        />
      ) : null}
      {deleteTarget ? (
        <ConfirmDeleteModal
          onClose={() => setDeleteTarget(null)}
          onDeleted={async (message) => {
            if (deleteTarget.type === "exam" && deleteTarget.id === examId) {
              setExamId("");
            }
            await refresh(message);
          }}
          target={deleteTarget}
        />
      ) : null}
    </div>
  );
}

const EXAM_IMPORT_EXAMPLE = JSON.stringify(
  {
    exam: "JAMB UTME",
    examDescription: "Joint Admissions and Matriculation Board examination",
    subject: "Mathematics",
    subjectDescription: "Mathematics for the selected examination",
    year: 2025,
    status: "DRAFT",
    questions: [
      {
        prompt: "Solve 2x + 4 = 10.",
        passage: "",
        explanation: "Subtract 4, then divide by 2.",
        options: ["2", "3", "4", "5"],
        correctAnswer: "B",
      },
    ],
  },
  null,
  2,
);

function ExamJsonImporter({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (message: string) => void | Promise<void>;
}) {
  const [json, setJson] = useState(EXAM_IMPORT_EXAMPLE);
  const [parseError, setParseError] = useState("");
  const importer = useMutation({
    mutationFn: async () => {
      let payload: unknown;
      try {
        payload = JSON.parse(json);
      } catch {
        throw new Error(
          "The JSON is not valid. Check commas, quotes, and brackets.",
        );
      }
      return apiClient<{
        created: number;
        exam: { name: string };
        subject: { name: string };
        year: number;
      }>("/api/v1/admin/question-bank/questions/exam-json-import", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (result) =>
      onDone(
        `${result.created} questions imported into ${result.exam.name} ${result.subject.name} (${result.year}).`,
      ),
  });

  return (
    <Modal onClose={onClose} title="Magic exam JSON importer" wide>
      <div className="space-y-4">
        <div className="border-primary/20 bg-primary/5 rounded-2xl border p-4">
          <p className="text-foreground text-[.72rem] font-bold">
            One JSON document creates or reuses the full hierarchy
          </p>
          <p className="text-muted-foreground mt-1 text-[.62rem] leading-5">
            Required top-level keys: <strong>exam</strong>,{" "}
            <strong>subject</strong>, <strong>year</strong>,{" "}
            <strong>status</strong>, and <strong>questions</strong>. Every
            question requires <strong>prompt</strong>, <strong>options</strong>{" "}
            and <strong>correctAnswer</strong>. correctAnswer is the option
            letter A–F. Use DRAFT while reviewing; use PUBLISHED only for
            approved content.
          </p>
        </div>
        <label className="text-foreground block text-[.63rem] font-bold">
          Exam question JSON
          <textarea
            className="border-border focus:border-primary mt-1.5 min-h-[28rem] w-full rounded-2xl border bg-[#151126] p-4 font-mono text-[.65rem] leading-5 text-violet-50 outline-none"
            onChange={(event) => {
              setJson(event.target.value);
              setParseError("");
            }}
            spellCheck={false}
            value={json}
          />
        </label>
        {parseError || importer.error ? (
          <p className="bg-danger/10 text-danger rounded-xl p-3 text-[.65rem] font-semibold">
            {parseError || importer.error?.message}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <button className={secondary} onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className={primary}
            disabled={!json.trim() || importer.isPending}
            onClick={() => {
              try {
                JSON.parse(json);
                setParseError("");
                importer.mutate();
              } catch {
                setParseError(
                  "The JSON is not valid. Check commas, quotes, and brackets.",
                );
              }
            }}
            type="button"
          >
            {importer.isPending ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {importer.isPending ? "Importing…" : "Validate and import"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Standalone({
  data,
  notify,
}: {
  data: Workspace;
  notify: (value: string) => void;
}) {
  const cache = useQueryClient();
  const [create, setCreate] = useState(false);
  const [magicCreatorSubjectId, setMagicCreatorSubjectId] = useState<
    string | null
  >(null);
  const [owner, setOwner] = useState("");
  const [topic, setTopic] = useState("");
  const [classOwner, setClassOwner] = useState("");
  const [className, setClassName] = useState("");
  const [topicClassId, setTopicClassId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const add = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/admin/question-bank/subjects/${owner}/topics`, {
        method: "POST",
        body: JSON.stringify({
          name: topic.trim(),
          subjectClassId: topicClassId,
        }),
      }),
    onSuccess: async () => {
      setTopic("");
      await cache.invalidateQueries({ queryKey: ["admin", "question-bank"] });
      notify("Topic added.");
    },
  });
  const addClass = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/admin/question-bank/subjects/${classOwner}/classes`, {
        method: "POST",
        body: JSON.stringify({ name: className.trim() }),
      }),
    onSuccess: async () => {
      setClassName("");
      await cache.invalidateQueries({ queryKey: ["admin", "question-bank"] });
      notify("Class added.");
    },
  });
  return (
    <SectionCard
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            className={secondary}
            disabled={!data.standaloneSubjects.length}
            onClick={() =>
              setMagicCreatorSubjectId(data.standaloneSubjects[0]?.id ?? null)
            }
            type="button"
          >
            <Sparkles className="size-3.5" /> Magic question batch
          </button>
          <button
            className={primary}
            onClick={() => setCreate(true)}
            type="button"
          >
            <Plus className="size-3.5" /> New subject
          </button>
        </div>
      }
      description="These subjects are independent and do not require an exam or year."
      title="Standalone subjects"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.standaloneSubjects.map((subject) => (
          <article
            className="border-border rounded-2xl border p-4"
            key={subject.id}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-xl">
                <Layers3 className="size-4" />
              </span>
              <button
                className="text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-lg p-1.5 transition-colors"
                onClick={() =>
                  setDeleteTarget({
                    type: "subject",
                    id: subject.id,
                    name: subject.name,
                  })
                }
                title={`Delete subject ${subject.name}`}
                type="button"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            <h3 className="text-foreground mt-3 text-[.77rem] font-bold">
              {subject.name}
            </h3>
            <p className="text-muted-foreground mt-1 text-[.58rem]">
              {subject._count?.questions ?? 0} questions ·{" "}
              {subject.classes.length} classes · {subject.topics.length} topics
            </p>
            <div className="mt-3 space-y-2">
              {subject.classes.map((subjectClass) => (
                <div
                  className="border-border bg-surface-subtle/40 rounded-xl border p-2.5"
                  key={subjectClass.id}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-foreground text-[.62rem] font-bold">
                      {subjectClass.name}
                    </p>
                    <button
                      className="text-muted-foreground hover:text-danger"
                      onClick={() =>
                        setDeleteTarget({
                          type: "subjectClass",
                          id: subjectClass.id,
                          name: subjectClass.name,
                          parentName: subject.name,
                        })
                      }
                      type="button"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {subjectClass.topics.map((item) => (
                      <span
                        className="bg-surface text-foreground inline-flex items-center gap-1 rounded-full py-0.5 pr-1.5 pl-2.5 text-[.56rem]"
                        key={item.id}
                      >
                        <span>{item.name}</span>
                        <button
                          className="hover:text-danger rounded-full p-0.5"
                          onClick={() =>
                            setDeleteTarget({
                              type: "topic",
                              id: item.id,
                              name: item.name,
                              parentName: `${subject.name} · ${subjectClass.name}`,
                            })
                          }
                          type="button"
                        >
                          <X className="size-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      add.mutate();
                    }}
                  >
                    <input
                      className={input}
                      onChange={(event) => {
                        setOwner(subject.id);
                        setTopicClassId(subjectClass.id);
                        setTopic(event.target.value);
                      }}
                      placeholder="Add topic"
                      value={topicClassId === subjectClass.id ? topic : ""}
                    />
                    <button
                      className={secondary}
                      disabled={
                        topicClassId !== subjectClass.id ||
                        !topic.trim() ||
                        add.isPending
                      }
                      type="submit"
                    >
                      {add.isPending && topicClassId === subjectClass.id ? (
                        <LoaderCircle className="size-3.5 animate-spin" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                    </button>
                  </form>
                </div>
              ))}
            </div>
            <button
              className="text-primary mt-3 inline-flex items-center gap-1.5 text-[.6rem] font-bold"
              onClick={() => setMagicCreatorSubjectId(subject.id)}
              type="button"
            >
              <Sparkles className="size-3.5" /> Generate question batch
            </button>
            <form
              className="border-border mt-3 flex gap-2 border-t pt-3"
              onSubmit={(event) => {
                event.preventDefault();
                addClass.mutate();
              }}
            >
              <input
                className={input}
                onChange={(event) => {
                  setClassOwner(subject.id);
                  setClassName(event.target.value);
                }}
                placeholder="Add class (e.g. SS 1)"
                value={classOwner === subject.id ? className : ""}
              />
              <button
                className={secondary}
                disabled={
                  classOwner !== subject.id ||
                  !className.trim() ||
                  addClass.isPending
                }
                type="submit"
              >
                {addClass.isPending && classOwner === subject.id ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
              </button>
            </form>
          </article>
        ))}
      </div>
      {!data.standaloneSubjects.length ? (
        <Empty title="No standalone subjects">
          Create one, add topics, then author its questions.
        </Empty>
      ) : null}
      {create ? (
        <CreateEntity
          mode="standalone"
          onClose={() => setCreate(false)}
          onDone={(message) => {
            setCreate(false);
            notify(message);
          }}
        />
      ) : null}
      {magicCreatorSubjectId ? (
        <MagicStandaloneCreator
          data={data}
          initialSubjectId={magicCreatorSubjectId}
          onClose={() => setMagicCreatorSubjectId(null)}
          onDone={(message) => {
            setMagicCreatorSubjectId(null);
            notify(message);
          }}
        />
      ) : null}
      {deleteTarget ? (
        <ConfirmDeleteModal
          onClose={() => setDeleteTarget(null)}
          onDeleted={async (message) => {
            await cache.invalidateQueries({
              queryKey: ["admin", "question-bank"],
            });
            notify(message);
          }}
          target={deleteTarget}
        />
      ) : null}
    </SectionCard>
  );
}

function MagicStandaloneCreator({
  data,
  initialSubjectId,
  onClose,
  onDone,
}: {
  data: Workspace;
  initialSubjectId: string;
  onClose: () => void;
  onDone: (value: string) => void;
}) {
  const cache = useQueryClient();
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [subjectClassId, setSubjectClassId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [style, setStyle] = useState<
    "MIXED" | "CONCEPTUAL" | "APPLIED" | "COMPREHENSION"
  >("MIXED");
  const [count, setCount] = useState(5);
  const [context, setContext] = useState("");
  const [questions, setQuestions] = useState<BatchDraftQuestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saveStatus, setSaveStatus] = useState<Status>("DRAFT");
  const subject = data.standaloneSubjects.find((item) => item.id === subjectId);
  const subjectClass = subject?.classes.find(
    (item) => item.id === subjectClassId,
  );
  const selectedQuestions = questions.filter((_, index) => selected.has(index));
  const selectedAreValid =
    selectedQuestions.length > 0 &&
    selectedQuestions.every(
      (question) =>
        plainText(question.prompt).length >= 5 &&
        question.options.length >= 2 &&
        question.options.every((option) => plainText(option.text).length > 0) &&
        question.options.filter((option) => option.isCorrect).length === 1,
    );

  const generate = useMutation({
    mutationFn: () =>
      apiClient<GeneratedBatch>(
        "/api/v1/admin/question-bank/questions/ai-batch",
        {
          method: "POST",
          body: JSON.stringify({
            subjectId,
            subjectClassId,
            topicId,
            style,
            count,
            context: context.trim(),
          }),
        },
      ),
    onSuccess: (result) => {
      setQuestions(result.questions);
      setSelected(new Set(result.questions.map((_, index) => index)));
    },
  });
  const save = useMutation({
    mutationFn: () =>
      apiClient<{ created: number }>(
        "/api/v1/admin/question-bank/questions/batch",
        {
          method: "POST",
          body: JSON.stringify({
            questions: selectedQuestions.map((question) => ({
              ...question,
              status: saveStatus,
            })),
          }),
        },
      ),
    onSuccess: async (result) => {
      await cache.invalidateQueries({ queryKey: ["admin", "question-bank"] });
      onDone(
        `${result.created} question${result.created === 1 ? "" : "s"} added to the question bank.`,
      );
    },
  });
  const updateQuestion = (
    index: number,
    update: (question: BatchDraftQuestion) => BatchDraftQuestion,
  ) =>
    setQuestions((current) =>
      current.map((question, itemIndex) =>
        itemIndex === index ? update(question) : question,
      ),
    );
  const removeQuestion = (index: number) => {
    const next = questions.filter((_, itemIndex) => itemIndex !== index);
    setQuestions(next);
    setSelected(new Set(next.map((_, itemIndex) => itemIndex)));
  };

  return (
    <Modal onClose={onClose} title="Magic standalone question creator" wide>
      {!questions.length ? (
        <div className="space-y-5">
          <div className="border-primary/20 from-primary/10 via-primary/5 to-surface rounded-2xl border bg-gradient-to-br p-4">
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-xl">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-foreground text-[.76rem] font-bold">
                  Build a review-ready question set
                </p>
                <p className="text-muted-foreground mt-1 text-[.64rem] leading-5">
                  AI creates editable drafts only. Review the wording, answer,
                  explanation before selecting what enters the question bank.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-foreground text-[.63rem] font-bold">
              Standalone subject
              <Select
                className={`${input} mt-1.5`}
                onChange={(event) => {
                  setSubjectId(event.target.value);
                  setSubjectClassId("");
                  setTopicId("");
                }}
                value={subjectId}
              >
                {data.standaloneSubjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-foreground text-[.63rem] font-bold">
              Class
              <Select
                className={`${input} mt-1.5`}
                onChange={(event) => {
                  setSubjectClassId(event.target.value);
                  setTopicId("");
                }}
                value={subjectClassId}
              >
                <option value="">Choose a class</option>
                {subject?.classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-foreground text-[.63rem] font-bold">
              Topic
              <Select
                className={`${input} mt-1.5`}
                onChange={(event) => setTopicId(event.target.value)}
                value={topicId}
              >
                <option value="">Choose a topic</option>
                {subjectClass?.topics.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-foreground text-[.63rem] font-bold">
              Number of questions
              <input
                className={`${input} mt-1.5`}
                max={20}
                min={2}
                onChange={(event) =>
                  setCount(
                    Math.min(20, Math.max(2, Number(event.target.value))),
                  )
                }
                type="number"
                value={count}
              />
            </label>
          </div>
          <label className="text-foreground block text-[.63rem] font-bold">
            Question style
            <Select
              className={`${input} mt-1.5 max-w-sm`}
              onChange={(event) =>
                setStyle(
                  event.target.value as
                    "MIXED" | "CONCEPTUAL" | "APPLIED" | "COMPREHENSION",
                )
              }
              value={style}
            >
              <option value="MIXED">Mixed question styles</option>
              <option value="CONCEPTUAL">Conceptual understanding</option>
              <option value="APPLIED">Applied problem solving</option>
              <option value="COMPREHENSION">Comprehension and context</option>
            </Select>
          </label>
          <label className="text-foreground block text-[.63rem] font-bold">
            Coverage and authoring brief
            <textarea
              className="border-border bg-background focus:border-primary mt-1.5 min-h-32 w-full rounded-xl border p-3 text-[.7rem] leading-5 outline-none"
              maxLength={3000}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Describe the concepts to assess, curriculum boundaries, learning objectives, terminology, calculations, or material the questions must use."
              value={context}
            />
            <span className="text-muted-foreground mt-1 block text-[.56rem] font-normal">
              {context.length.toLocaleString()} / 3,000 characters · minimum 20
            </span>
          </label>
          {generate.isError ? (
            <p className="bg-danger/10 text-danger rounded-xl p-3 text-[.65rem] font-semibold">
              {generate.error.message}
            </p>
          ) : null}
          <div className="flex justify-end">
            <button
              className={primary}
              disabled={
                !subjectId ||
                !subjectClassId ||
                !topicId ||
                context.trim().length < 20 ||
                generate.isPending
              }
              onClick={() => generate.mutate()}
              type="button"
            >
              {generate.isPending ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {generate.isPending
                ? `Creating ${count} questions…`
                : `Create ${count} review drafts`}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-border bg-surface-subtle/50 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3">
            <div>
              <p className="text-foreground text-[.72rem] font-bold">
                Review {questions.length} generated questions
              </p>
              <p className="text-muted-foreground mt-1 text-[.59rem]">
                {selected.size} selected · edit every field before saving
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={secondary}
                onClick={() => {
                  setQuestions([]);
                  setSelected(new Set());
                }}
                type="button"
              >
                <Sparkles className="size-3.5" /> Generate again
              </button>
              <button
                className={secondary}
                onClick={() =>
                  setSelected(
                    selected.size === questions.length
                      ? new Set()
                      : new Set(questions.map((_, index) => index)),
                  )
                }
                type="button"
              >
                {selected.size === questions.length
                  ? "Clear selection"
                  : "Select all"}
              </button>
            </div>
          </div>

          {questions.map((question, questionIndex) => (
            <article
              className={`rounded-2xl border p-4 ${selected.has(questionIndex) ? "border-primary/35 bg-primary/[.025]" : "border-border opacity-70"}`}
              key={questionIndex}
            >
              <div className="flex items-center gap-3">
                <input
                  aria-label={`Select question ${questionIndex + 1}`}
                  checked={selected.has(questionIndex)}
                  className="accent-primary size-4"
                  onChange={(event) => {
                    const next = new Set(selected);
                    if (event.target.checked) next.add(questionIndex);
                    else next.delete(questionIndex);
                    setSelected(next);
                  }}
                  type="checkbox"
                />
                <p className="text-foreground text-[.7rem] font-bold">
                  Question {questionIndex + 1}
                </p>
                <button
                  aria-label={`Remove question ${questionIndex + 1}`}
                  className="text-danger hover:bg-danger/10 ml-auto grid size-8 place-items-center rounded-lg"
                  onClick={() => removeQuestion(questionIndex)}
                  type="button"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="mt-3">
                <label className="text-foreground text-[.61rem] font-bold">
                  Question prompt
                  <textarea
                    className="border-border bg-background mt-1.5 min-h-20 w-full rounded-xl border p-3 text-[.68rem] leading-5 outline-none"
                    onChange={(event) =>
                      updateQuestion(questionIndex, (current) => ({
                        ...current,
                        prompt: event.target.value,
                      }))
                    }
                    value={question.prompt}
                  />
                </label>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <div
                    className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${option.isCorrect ? "border-success/40 bg-success/5" : "border-border bg-background"}`}
                    key={option.label}
                  >
                    <label className="flex cursor-pointer items-center gap-1.5 select-none">
                      <input
                        checked={option.isCorrect}
                        className="cursor-pointer"
                        name={`correct-${questionIndex}`}
                        onChange={() =>
                          updateQuestion(questionIndex, (current) => ({
                            ...current,
                            options: current.options.map((item, itemIndex) => ({
                              ...item,
                              isCorrect: itemIndex === optionIndex,
                            })),
                          }))
                        }
                        type="radio"
                      />
                      <span className="text-muted-foreground text-[.6rem] font-bold">
                        {option.label}
                      </span>
                    </label>
                    <input
                      className="min-w-0 flex-1 bg-transparent text-[.67rem] outline-none"
                      onChange={(event) =>
                        updateQuestion(questionIndex, (current) => ({
                          ...current,
                          options: current.options.map((item, itemIndex) =>
                            itemIndex === optionIndex
                              ? { ...item, text: event.target.value }
                              : item,
                          ),
                        }))
                      }
                      value={option.text}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <label className="text-foreground text-[.61rem] font-bold">
                  Passage or shared context
                  <textarea
                    className="border-border bg-background mt-1.5 min-h-20 w-full rounded-xl border p-3 text-[.66rem] leading-5 outline-none"
                    onChange={(event) =>
                      updateQuestion(questionIndex, (current) => ({
                        ...current,
                        passage: event.target.value,
                      }))
                    }
                    placeholder="Optional"
                    value={question.passage ?? ""}
                  />
                </label>
                <label className="text-foreground text-[.61rem] font-bold">
                  Answer explanation
                  <textarea
                    className="border-border bg-background mt-1.5 min-h-20 w-full rounded-xl border p-3 text-[.66rem] leading-5 outline-none"
                    onChange={(event) =>
                      updateQuestion(questionIndex, (current) => ({
                        ...current,
                        explanation: event.target.value,
                      }))
                    }
                    value={question.explanation ?? ""}
                  />
                </label>
              </div>
            </article>
          ))}

          {save.isError ? (
            <p className="bg-danger/10 text-danger rounded-xl p-3 text-[.65rem] font-semibold">
              {save.error.message}
            </p>
          ) : null}
          <div className="border-border bg-surface sticky bottom-0 flex flex-wrap items-end justify-between gap-3 border-t py-3">
            <label className="text-foreground text-[.61rem] font-bold">
              Save selected as
              <Select
                className={`${input} mt-1.5 w-44`}
                onChange={(event) =>
                  setSaveStatus(event.target.value as Status)
                }
                value={saveStatus}
              >
                <option value="DRAFT">Draft</option>
                <option value="IN_REVIEW">In review</option>
                <option value="PUBLISHED">Published</option>
              </Select>
            </label>
            <button
              className={primary}
              disabled={!selectedAreValid || save.isPending}
              onClick={() => save.mutate()}
              type="button"
            >
              {save.isPending ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
              {save.isPending
                ? "Saving batch…"
                : `Save ${selectedQuestions.length} selected`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

const blankOptions = ["A", "B", "C", "D"].map((label, index) => ({
  label,
  text: "",
  isCorrect: index === 0,
}));
function Editor({
  data,
  editing,
  onClose,
  onDone,
}: {
  data: Workspace;
  editing?: Question;
  onClose: () => void;
  onDone: (value: string) => void;
}) {
  const cache = useQueryClient();
  const [path, setPath] = useState<Path>(editing?.path ?? "EXAM");
  const [examId, setExamId] = useState(
    editing?.examSubjectYear?.examSubject.exam.id ?? data.exams[0]?.id ?? "",
  );
  const [subjectId, setSubjectId] = useState(editing?.subject?.id ?? "");
  const [examSubjectId, setExamSubjectId] = useState(
    editing?.examSubjectYear?.examSubject.id ?? editing?.examSubject?.id ?? "",
  );
  const [yearLinkId, setYearLinkId] = useState(
    editing?.examSubjectYear?.id ?? "",
  );
  const [topicId, setTopicId] = useState(editing?.topic?.id ?? "");
  const [subjectClassId, setSubjectClassId] = useState(
    editing?.topic?.subjectClassId ?? "",
  );
  const [status, setStatus] = useState<Status>(editing?.status ?? "DRAFT");
  const [prompt, setPrompt] = useState(editing?.prompt ?? "");
  const [passage, setPassage] = useState(editing?.passage ?? "");
  const [explanation, setExplanation] = useState(editing?.explanation ?? "");
  const [options, setOptions] = useState<Option[]>(
    editing?.options.map(({ label, text, isCorrect }) => ({
      label,
      text,
      isCorrect,
    })) ?? blankOptions,
  );
  const exam = data.exams.find((item) => item.id === examId);
  const examSubject = exam?.subjects.find((item) => item.id === examSubjectId);
  const subject =
    path === "STANDALONE"
      ? data.standaloneSubjects.find((item) => item.id === subjectId)
      : undefined;
  const subjectClass = subject?.classes.find(
    (item) => item.id === subjectClassId,
  );
  const save = useMutation({
    mutationFn: () =>
      apiClient(
        `/api/v1/admin/question-bank/questions${editing ? `/${editing.id}` : ""}`,
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify({
            path,
            subjectId: path === "STANDALONE" ? subjectId : undefined,
            examSubjectId: path === "EXAM" ? examSubjectId : undefined,
            topicId: path === "STANDALONE" ? topicId || undefined : undefined,
            examSubjectYearId: path === "EXAM" ? yearLinkId : undefined,
            prompt,
            passage: passage || undefined,
            explanation: explanation || undefined,
            status,
            options,
          }),
        },
      ),
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ["admin", "question-bank"] });
      onDone(editing ? "Question updated." : "Question created.");
    },
  });
  const ready =
    prompt.trim().length >= 5 &&
    (path === "EXAM"
      ? examSubjectId && yearLinkId
      : subjectId && subjectClassId && topicId) &&
    options.every((item) => item.text.trim()) &&
    (path === "STANDALONE" || yearLinkId);
  return (
    <Modal
      onClose={onClose}
      title={editing ? "Edit question" : "Create question"}
    >
      <form
        className="space-y-4"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div className="bg-surface-subtle flex w-fit gap-1 rounded-full p-1">
          {(["EXAM", "STANDALONE"] as const).map((item) => (
            <button
              className={`rounded-full px-3 py-1.5 text-[.62rem] font-bold ${path === item ? "bg-surface text-primary shadow-sm" : "text-muted-foreground"}`}
              key={item}
              onClick={() => {
                setPath(item);
                setSubjectId("");
                setExamSubjectId("");
                setYearLinkId("");
                setTopicId("");
                setSubjectClassId("");
              }}
              type="button"
            >
              {item === "EXAM" ? "Exam question" : "Standalone"}
            </button>
          ))}
        </div>
        <div
          className={`grid gap-3 ${path === "EXAM" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
        >
          {path === "EXAM" ? (
            <label className="text-foreground text-[.63rem] font-bold">
              Exam
              <Select
                className={`${input} mt-1.5`}
                onChange={(event) => {
                  setExamId(event.target.value);
                  setExamSubjectId("");
                  setYearLinkId("");
                }}
                value={examId}
              >
                <option value="">Choose exam</option>
                {data.exams.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
          <label className="text-foreground text-[.63rem] font-bold">
            Subject
            <Select
              className={`${input} mt-1.5`}
              onChange={(event) => {
                if (path === "EXAM") setExamSubjectId(event.target.value);
                else setSubjectId(event.target.value);
                setYearLinkId("");
                setTopicId("");
                setSubjectClassId("");
              }}
              value={path === "EXAM" ? examSubjectId : subjectId}
            >
              <option value="">Choose subject</option>
              {(path === "EXAM"
                ? (exam?.subjects ?? [])
                : data.standaloneSubjects
              ).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          {path === "EXAM" ? (
            <label className="text-foreground text-[.63rem] font-bold">
              Year
              <Select
                className={`${input} mt-1.5`}
                onChange={(event) => setYearLinkId(event.target.value)}
                value={yearLinkId}
              >
                <option value="">Choose year</option>
                {examSubject?.years.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.examYear.year}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
        </div>
        {path === "STANDALONE" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-foreground text-[.63rem] font-bold">
              Class
              <Select
                className={`${input} mt-1.5`}
                onChange={(event) => {
                  setSubjectClassId(event.target.value);
                  setTopicId("");
                }}
                value={subjectClassId}
              >
                <option value="">Choose class</option>
                {subject?.classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-foreground text-[.63rem] font-bold">
              Topic
              <Select
                className={`${input} mt-1.5`}
                onChange={(event) => setTopicId(event.target.value)}
                value={topicId}
              >
                <option value="">Choose topic</option>
                {subjectClass?.topics.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        ) : null}
        <RichContentEditor
          label="Comprehension passage"
          minHeight="min-h-24"
          onChange={setPassage}
          placeholder="Add a reading passage, context, or shared information for this question (optional)."
          value={passage}
        />
        <RichContentEditor
          label="Question"
          minHeight="min-h-32"
          onChange={setPrompt}
          placeholder="Write the question. Use the toolbar for symbols, formulas, calculations, tables, images, or diagrams."
          value={prompt}
        />
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((option, index) => (
              <div
                className={`rounded-xl border p-2.5 transition-colors ${option.isCorrect ? "border-success/50 bg-success/5" : "border-border bg-surface"}`}
                key={option.label}
              >
                <div className="text-foreground flex items-center justify-between text-[.61rem] font-bold">
                  <label className="flex cursor-pointer items-center gap-2 select-none">
                    <input
                      checked={option.isCorrect}
                      className="cursor-pointer"
                      name="correct"
                      onChange={() =>
                        setOptions((current) =>
                          current.map((item, itemIndex) => ({
                            ...item,
                            isCorrect: itemIndex === index,
                          })),
                        )
                      }
                      type="radio"
                    />
                    <span>Option {option.label}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {option.isCorrect ? (
                      <span className="text-success font-semibold">
                        Correct
                      </span>
                    ) : (
                      <button
                        className="text-muted-foreground hover:text-foreground text-[.58rem] font-normal transition-colors"
                        onClick={() =>
                          setOptions((current) =>
                            current.map((item, itemIndex) => ({
                              ...item,
                              isCorrect: itemIndex === index,
                            })),
                          )
                        }
                        type="button"
                      >
                        Set as correct
                      </button>
                    )}
                    {options.length > 2 && !option.isCorrect ? (
                      <button
                        className="text-muted-foreground hover:text-danger ml-1 rounded-md p-0.5 transition-colors"
                        onClick={() =>
                          setOptions((current) => {
                            const next = current.filter((_, i) => i !== index);
                            // Re-label A, B, C…
                            return next.map((item, i) => ({
                              ...item,
                              label: String.fromCharCode(65 + i),
                            }));
                          })
                        }
                        title="Remove option"
                        type="button"
                      >
                        <X className="size-3" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2">
                  <RichContentEditor
                    label={`Option ${option.label}`}
                    minHeight="min-h-16"
                    onChange={(value) =>
                      setOptions((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, text: value } : item,
                        ),
                      )
                    }
                    placeholder={`Enter option ${option.label}`}
                    value={option.text}
                  />
                </div>
              </div>
            ))}
          </div>
          {options.length < 8 ? (
            <button
              className={`${secondary} w-full`}
              onClick={() =>
                setOptions((current) => [
                  ...current,
                  {
                    label: String.fromCharCode(65 + current.length),
                    text: "",
                    isCorrect: false,
                  },
                ])
              }
              type="button"
            >
              <Plus className="size-3.5" /> Add option
            </button>
          ) : null}
        </div>
        <div>
          <span className="text-foreground mb-1.5 block text-[.63rem] font-bold">
            Explanation{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </span>
          <RichContentEditor
            label="Explanation"
            minHeight="min-h-20"
            onChange={setExplanation}
            placeholder="Explain the reasoning, calculations, or formula used to get the answer."
            value={explanation}
          />
        </div>
        <label className="text-foreground block text-[.63rem] font-bold">
          Status
          <Select
            className={`${input} mt-1.5`}
            onChange={(event) => setStatus(event.target.value as Status)}
            value={status}
          >
            {["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"].map((item) => (
              <option key={item} value={item}>
                {labels(item)}
              </option>
            ))}
          </Select>
        </label>
        {save.error ? (
          <p className="text-danger text-[.62rem]">{save.error.message}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button className={secondary} onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className={primary}
            disabled={!ready || save.isPending}
            type="submit"
          >
            {save.isPending ? "Saving…" : "Save question"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function QuestionsPage() {
  const [tab, setTab] = useState<Tab>("questions");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [exam, setExam] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<Question | "new" | null>(null);
  const [preview, setPreview] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = new URLSearchParams({ page: String(page), pageSize: "12" });
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (exam) params.set("examId", exam);
  if (status) params.set("status", status);
  const query = useQuery({
    queryKey: ["admin", "question-bank", page, debouncedSearch, exam, status],
    queryFn: () =>
      apiClient<Workspace>(`/api/v1/admin/question-bank?${params}`),
    placeholderData: keepPreviousData,
  });
  const data = query.data;
  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };
  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-[1480px] space-y-5">
        <AdminPageHeader
          actions={
            <button
              className={primary}
              onClick={() => setEditor("new")}
              type="button"
            >
              <Plus className="size-4" /> New question
            </button>
          }
          description="Create exams, attach subjects and valid years, add standalone subjects and topics, then author questions using only valid database records."
          eyebrow="Learning content"
          title="Questions & exams"
        />
        {notice ? (
          <div className="border-success/20 bg-success/8 text-success flex items-center gap-2 rounded-xl border px-3 py-2 text-[.65rem]">
            <CheckCircle2 className="size-4" />
            {notice}
          </div>
        ) : null}
        {!data && query.isLoading ? (
          <div className="surface-card grid min-h-64 place-items-center text-[.7rem]">
            Loading question bank…
          </div>
        ) : null}
        {query.error ? (
          <div className="border-danger/20 bg-danger/5 text-danger flex gap-2 rounded-xl border p-4 text-[.68rem]">
            <AlertCircle className="size-4" />
            {query.error.message}
          </div>
        ) : null}
        {data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                detail="Across every learning path"
                icon="content"
                label="Total questions"
                value={String(data.pagination.total)}
              />
              <MetricCard
                accent="bg-emerald-500/10 text-emerald-600"
                detail="Available to learners"
                icon="analytics"
                label="Published"
                value={String(data.metrics.PUBLISHED ?? 0)}
              />
              <MetricCard
                accent="bg-amber-500/10 text-amber-600"
                detail="Awaiting completion"
                icon="blog"
                label="Draft & review"
                value={String(
                  (data.metrics.DRAFT ?? 0) + (data.metrics.IN_REVIEW ?? 0),
                )}
              />
              <MetricCard
                accent="bg-rose-500/10 text-rose-600"
                detail="Awaiting review"
                icon="rewards"
                label="Open reports"
                value={String(
                  data.flags.filter((item) => item.status === "OPEN").length,
                )}
              />
            </div>
            <div className="flex overflow-x-auto">
              <SegmentedControl
                ariaLabel="Question management"
                onChange={setTab}
                options={tabs}
                value={tab}
              />
            </div>
            {tab === "exams" ? <ExamSetup data={data} notify={notify} /> : null}
            {tab === "standalone" ? (
              <Standalone data={data} notify={notify} />
            ) : null}
            {tab === "questions" ? (
              <SectionCard
                description="Selectors in the composer come directly from exam and subject setup."
                title="Question bank"
              >
                <div className="border-border mb-4 grid gap-2 border-y py-3 sm:grid-cols-2 lg:grid-cols-[1fr_190px_170px]">
                  <label className="relative">
                    {query.isFetching && debouncedSearch ? (
                      <LoaderCircle className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2 animate-spin" />
                    ) : (
                      <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                    )}
                    <input
                      autoComplete="off"
                      className={`${input} pl-9 ${searchInput ? "pr-8" : ""}`}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search question or reference"
                      value={searchInput}
                    />
                    {searchInput ? (
                      <button
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 p-0.5"
                        onClick={() => {
                          setSearchInput("");
                          setDebouncedSearch("");
                          setPage(1);
                        }}
                        title="Clear search"
                        type="button"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </label>
                  <Select
                    className={input}
                    onChange={(event) => {
                      setExam(event.target.value);
                      setPage(1);
                    }}
                    value={exam}
                  >
                    <option value="">All exams and paths</option>
                    {data.exams.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    className={input}
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setPage(1);
                    }}
                    value={status}
                  >
                    <option value="">All statuses</option>
                    {["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"].map(
                      (item) => (
                        <option key={item} value={item}>
                          {labels(item)}
                        </option>
                      ),
                    )}
                  </Select>
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[820px] text-left">
                    <thead className="text-muted-foreground text-[.58rem] font-bold uppercase">
                      <tr>
                        <th className="pb-3">Question</th>
                        <th className="px-3 pb-3">Path</th>
                        <th className="px-3 pb-3">Subject</th>
                        <th className="px-3 pb-3">Status</th>
                        <th className="w-[190px] pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                      {data.questions.map((item) => (
                        <tr key={item.id}>
                          <td className="max-w-md py-3 pr-3">
                            <p className="text-foreground line-clamp-1 text-[.69rem] font-semibold">
                              {plainText(item.prompt)}
                            </p>
                            <p className="text-muted-foreground mt-1 text-[.57rem]">
                              {item.reference} ·{" "}
                              {item.topic?.name ?? "No topic"}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-[.64rem]">
                            {item.path === "EXAM"
                              ? `${item.examSubjectYear?.examSubject.exam.name} ${item.examSubjectYear?.examYear.year}`
                              : "Standalone"}
                          </td>
                          <td className="px-3 py-3 text-[.64rem]">
                            {item.path === "EXAM"
                              ? (item.examSubject?.name ??
                                item.examSubjectYear?.examSubject.name ??
                                "Exam subject")
                              : (item.subject?.name ?? "Standalone subject")}
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge tone={tone(item.status)}>
                              {labels(item.status)}
                            </StatusBadge>
                          </td>
                          <td className="py-3 align-middle">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                className="border-border bg-surface hover:border-primary/35 hover:bg-primary/5 text-primary inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[.6rem] font-bold transition-colors"
                                onClick={() => setPreview(item)}
                                type="button"
                              >
                                <Eye className="size-3.5" />
                                View
                              </button>
                              <button
                                aria-label="Edit question"
                                className="border-primary/20 bg-primary/8 text-primary hover:bg-primary/15 inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
                                onClick={() => setEditor(item)}
                                title="Edit question"
                                type="button"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                aria-label="Delete question"
                                className="border-border bg-surface text-muted-foreground hover:border-danger/30 hover:bg-danger/5 hover:text-danger inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
                                onClick={() => setDeleteQuestion(item)}
                                title="Delete question"
                                type="button"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-border divide-y md:hidden">
                  {data.questions.map((item) => (
                    <button
                      className="flex w-full items-start gap-3 py-3 text-left"
                      key={item.id}
                      onClick={() => setPreview(item)}
                      type="button"
                    >
                      <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-xl">
                        <FileQuestion className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-foreground line-clamp-2 block text-[.67rem] font-semibold">
                          {plainText(item.prompt)}
                        </span>
                        <span className="text-muted-foreground mt-1 block text-[.57rem]">
                          {item.path === "EXAM"
                            ? (item.examSubject?.name ??
                              item.examSubjectYear?.examSubject.name ??
                              "Exam subject")
                            : (item.subject?.name ?? "Standalone subject")}
                        </span>
                      </span>
                      <StatusBadge tone={tone(item.status)}>
                        {labels(item.status)}
                      </StatusBadge>
                    </button>
                  ))}
                </div>
                {!data.questions.length ? (
                  <Empty title="No matching questions">
                    Complete setup, then create the first question.
                  </Empty>
                ) : null}
                <Pagination
                  currentPage={data.pagination.page}
                  itemLabel="questions"
                  onPageChange={setPage}
                  pageSize={data.pagination.pageSize}
                  totalItems={data.pagination.total}
                  totalPages={data.pagination.pages}
                />
              </SectionCard>
            ) : null}
            {tab === "reports" ? (
              <SectionCard
                description="Reports retain the learner's question reference and are linked to persisted questions."
                title="Content reports"
              >
                <div className="divide-border divide-y">
                  {data.flags.map((flag) => (
                    <article
                      className="flex items-start gap-3 py-3"
                      key={flag.id}
                    >
                      <span className="bg-danger/10 text-danger grid size-9 place-items-center rounded-xl">
                        <AlertCircle className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-foreground block text-[.68rem] font-bold">
                          {labels(flag.flagType)}
                        </span>
                        <span className="text-muted-foreground mt-1 block text-[.58rem]">
                          {flag.questionReference} · {flag.notes || "No notes"}
                        </span>
                      </span>
                      <StatusBadge
                        tone={flag.status === "OPEN" ? "danger" : "success"}
                      >
                        {labels(flag.status)}
                      </StatusBadge>
                    </article>
                  ))}
                  {!data.flags.length ? (
                    <Empty title="No reports">
                      Learner content reports will appear here.
                    </Empty>
                  ) : null}
                </div>
              </SectionCard>
            ) : null}
          </>
        ) : null}
      </div>
      {editor && data ? (
        <Editor
          data={data}
          editing={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
          onDone={(message) => {
            setEditor(null);
            notify(message);
          }}
        />
      ) : null}
      {preview ? (
        <Modal onClose={() => setPreview(null)} title={preview.reference}>
          <div className="flex gap-2">
            <StatusBadge tone={tone(preview.status)}>
              {labels(preview.status)}
            </StatusBadge>
          </div>
          {preview.passage ? (
            <div className="bg-surface-subtle mt-4 rounded-xl p-3">
              <p className="text-muted-foreground mb-2 text-[.57rem] font-bold tracking-wide uppercase">
                Comprehension passage
              </p>
              <RichContent
                html={preview.passage}
                className="text-foreground text-[.7rem] leading-5"
              />
            </div>
          ) : null}
          <RichContent
            html={preview.prompt}
            className="text-foreground mt-4 text-[.8rem] leading-6 font-semibold"
          />
          <div className="mt-4 space-y-2">
            {preview.options.map((option) => (
              <div
                className={`flex gap-3 rounded-xl border p-3 text-[.67rem] ${option.isCorrect ? "border-success/40 bg-success/5" : "border-border"}`}
                key={option.label}
              >
                <strong>{option.label}</strong>
                <RichContent html={option.text} className="flex-1" />
                {option.isCorrect ? (
                  <CheckCircle2 className="text-success size-4" />
                ) : null}
              </div>
            ))}
          </div>
          {preview.explanation ? (
            <RichContent
              html={preview.explanation}
              className="bg-surface-subtle text-foreground mt-4 rounded-xl p-3 text-[.65rem] leading-5"
            />
          ) : null}
        </Modal>
      ) : null}
      {deleteQuestion ? (
        <ConfirmDeleteModal
          onClose={() => setDeleteQuestion(null)}
          onDeleted={(message) => {
            setDeleteQuestion(null);
            notify(message);
          }}
          target={{
            type: "question",
            id: deleteQuestion.id,
            name: plainText(deleteQuestion.prompt).slice(0, 60),
          }}
        />
      ) : null}
    </AdminShell>
  );
}
