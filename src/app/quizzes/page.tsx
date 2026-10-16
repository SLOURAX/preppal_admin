"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileQuestion,
  FolderTree,
  Layers3,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Tags,
  Trash2,
  LoaderCircle,
  X,
} from "lucide-react";
import { FormEvent, ReactNode, useState } from "react";
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
type Difficulty = "EASY" | "MEDIUM" | "HARD";
interface Topic {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}
interface Subject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  topics: Topic[];
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
  difficulty: Difficulty;
  status: Status;
  subject?: Pick<Subject, "id" | "name" | "slug">;
  examSubject?: Pick<ExamSubject, "id" | "name" | "slug">;
  topic?: Pick<Topic, "id" | "name" | "slug">;
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
  difficulty: Difficulty;
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
    <div className="grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)]">
      <SectionCard
        actions={
          <button
            className="text-primary text-[.62rem] font-bold"
            onClick={() => setCreateExam(true)}
            type="button"
          >
            + New
          </button>
        }
        description="Select an exam to configure."
        title="Exams"
      >
        <div className="space-y-1.5">
          {data.exams.map((item) => (
            <button
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${exam?.id === item.id ? "bg-primary/10 text-primary" : "hover:bg-surface-subtle"}`}
              key={item.id}
              onClick={() => setExamId(item.id)}
              type="button"
            >
              <BookOpen className="size-4" />
              <span className="flex-1 text-[.7rem] font-bold">{item.name}</span>
              <span className="text-muted-foreground text-[.58rem]">
                {item.subjects.length}
              </span>
            </button>
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
                    <Plus className="size-3.5" /> Add
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
            description="Each exam subject has its own available years. Topics are only used by standalone subjects."
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
                      <h3 className="text-foreground text-[.73rem] font-bold">
                        {entry.name}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-[.58rem]">
                        {entry._count.questions} questions
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.years.map((item) => (
                        <span
                          className="bg-primary/8 text-primary rounded-full px-2.5 py-1 text-[.58rem] font-bold"
                          key={item.id}
                        >
                          {item.examYear.year}
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
                        disabled={yearOwner !== entry.id}
                        onClick={() => addYear.mutate()}
                        type="button"
                      >
                        <CalendarDays className="size-3.5" /> Year
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
    </div>
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
  const add = useMutation({
    mutationFn: () =>
      apiClient(`/api/v1/admin/question-bank/subjects/${owner}/topics`, {
        method: "POST",
        body: JSON.stringify({ name: topic.trim() }),
      }),
    onSuccess: async () => {
      setTopic("");
      await cache.invalidateQueries({ queryKey: ["admin", "question-bank"] });
      notify("Topic added.");
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
            <span className="bg-primary/10 text-primary grid size-9 place-items-center rounded-xl">
              <Layers3 className="size-4" />
            </span>
            <h3 className="text-foreground mt-3 text-[.77rem] font-bold">
              {subject.name}
            </h3>
            <p className="text-muted-foreground mt-1 text-[.58rem]">
              {subject._count?.questions ?? 0} questions ·{" "}
              {subject.topics.length} topics
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {subject.topics.map((item) => (
                <span
                  className="bg-surface-subtle rounded-full px-2.5 py-1 text-[.56rem]"
                  key={item.id}
                >
                  {item.name}
                </span>
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
                add.mutate();
              }}
            >
              <input
                className={input}
                onChange={(event) => {
                  setOwner(subject.id);
                  setTopic(event.target.value);
                }}
                placeholder="Add topic"
                value={owner === subject.id ? topic : ""}
              />
              <button
                className={secondary}
                disabled={owner !== subject.id || !topic.trim()}
                type="submit"
              >
                <Plus className="size-3.5" />
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
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "MIXED">("MIXED");
  const [style, setStyle] = useState<
    "MIXED" | "CONCEPTUAL" | "APPLIED" | "COMPREHENSION"
  >("MIXED");
  const [count, setCount] = useState(5);
  const [context, setContext] = useState("");
  const [questions, setQuestions] = useState<BatchDraftQuestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saveStatus, setSaveStatus] = useState<Status>("DRAFT");
  const subject = data.standaloneSubjects.find((item) => item.id === subjectId);
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
            topicId: topicId || undefined,
            difficulty,
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
                  explanation, and difficulty before selecting what enters the
                  question bank.
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
              Topic
              <Select
                className={`${input} mt-1.5`}
                onChange={(event) => setTopicId(event.target.value)}
                value={topicId}
              >
                <option value="">Broad subject coverage</option>
                {subject?.topics.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-foreground text-[.63rem] font-bold">
              Difficulty
              <Select
                className={`${input} mt-1.5`}
                onChange={(event) =>
                  setDifficulty(event.target.value as Difficulty | "MIXED")
                }
                value={difficulty}
              >
                {(["MIXED", "EASY", "MEDIUM", "HARD"] as const).map((item) => (
                  <option key={item} value={item}>
                    {labels(item)}
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
                !subjectId || context.trim().length < 20 || generate.isPending
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
                <StatusBadge tone="info">
                  {labels(question.difficulty)}
                </StatusBadge>
                <button
                  aria-label={`Remove question ${questionIndex + 1}`}
                  className="text-danger hover:bg-danger/10 ml-auto grid size-8 place-items-center rounded-lg"
                  onClick={() => removeQuestion(questionIndex)}
                  type="button"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_150px]">
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
                <label className="text-foreground text-[.61rem] font-bold">
                  Difficulty
                  <Select
                    className={`${input} mt-1.5`}
                    onChange={(event) =>
                      updateQuestion(questionIndex, (current) => ({
                        ...current,
                        difficulty: event.target.value as Difficulty,
                      }))
                    }
                    value={question.difficulty}
                  >
                    {(["EASY", "MEDIUM", "HARD"] as const).map((item) => (
                      <option key={item} value={item}>
                        {labels(item)}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    className={`flex items-center gap-2 rounded-xl border p-2 ${option.isCorrect ? "border-success/40 bg-success/5" : "border-border bg-background"}`}
                    key={option.label}
                  >
                    <input
                      checked={option.isCorrect}
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
                  </label>
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
  const [difficulty, setDifficulty] = useState<Difficulty>(
    editing?.difficulty ?? "MEDIUM",
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
            difficulty,
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
    (path === "EXAM" ? examSubjectId && yearLinkId : subjectId) &&
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
              Topic
              <Select
                className={`${input} mt-1.5`}
                onChange={(event) => setTopicId(event.target.value)}
                value={topicId}
              >
                <option value="">No topic</option>
                {subject?.topics.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-foreground text-[.63rem] font-bold">
              Difficulty
              <Select
                className={`${input} mt-1.5`}
                onChange={(event) =>
                  setDifficulty(event.target.value as Difficulty)
                }
                value={difficulty}
              >
                {["EASY", "MEDIUM", "HARD"].map((item) => (
                  <option key={item} value={item}>
                    {labels(item)}
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
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option, index) => (
            <label
              className={`rounded-xl border p-2.5 ${option.isCorrect ? "border-success/50 bg-success/5" : "border-border"}`}
              key={option.label}
            >
              <span className="text-foreground flex items-center gap-2 text-[.61rem] font-bold">
                <input
                  checked={option.isCorrect}
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
                />{" "}
                Option {option.label}
                {option.isCorrect ? (
                  <span className="text-success ml-auto">Correct</span>
                ) : null}
              </span>
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
            </label>
          ))}
        </div>
        <label className="text-foreground block text-[.63rem] font-bold">
          Explanation{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
          <RichContentEditor
            label="Explanation"
            minHeight="min-h-20"
            onChange={setExplanation}
            placeholder="Explain the reasoning, calculations, or formula used to get the answer."
            value={explanation}
          />
        </label>
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
  const [search, setSearch] = useState("");
  const [exam, setExam] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<Question | "new" | null>(null);
  const [preview, setPreview] = useState<Question | null>(null);
  const [notice, setNotice] = useState("");
  const params = new URLSearchParams({ page: String(page), pageSize: "12" });
  if (search.trim()) params.set("search", search.trim());
  if (exam) params.set("examId", exam);
  if (status) params.set("status", status);
  const query = useQuery({
    queryKey: ["admin", "question-bank", page, search, exam, status],
    queryFn: () =>
      apiClient<Workspace>(`/api/v1/admin/question-bank?${params}`),
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
        {query.isLoading ? (
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
                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                    <input
                      className={`${input} pl-9`}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                      placeholder="Search question or reference"
                      value={search}
                    />
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
                        <th className="pb-3 text-right">Action</th>
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
                          <td className="py-3 text-right">
                            <button
                              className="text-primary px-2 py-1 text-[.62rem] font-bold"
                              onClick={() => setPreview(item)}
                              type="button"
                            >
                              View
                            </button>
                            <button
                              className="text-primary p-2"
                              onClick={() => setEditor(item)}
                              title="Edit"
                              type="button"
                            >
                              <Pencil className="size-3.5" />
                            </button>
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
            <StatusBadge>{labels(preview.difficulty)}</StatusBadge>
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
    </AdminShell>
  );
}
