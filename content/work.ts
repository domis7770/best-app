import type { Lesson } from "./types";

export const WORK: Lesson[] = [
  {
    id: "wrk-1",
    trackId: "work",
    title: "Audit your week before automating it",
    blurb: "Find the four kinds of work in your calendar — and only automate two of them.",
    minutes: 6,
    xp: 30,
    blocks: [
      {
        kind: "text",
        body: "Most people start with “where can AI save time?” and end up automating a task they should have deleted. Start with evidence instead: list what you actually did last week, in 20-minute blocks, and label each block.",
      },
      {
        kind: "text",
        body: "Four labels cover almost everything. Draft — producing a first version of text. Transform — reshaping something that exists (summarise, translate, restructure). Extract — pulling structured facts out of mess. Decide — judgement with consequences.",
      },
      {
        kind: "callout",
        label: "Where the hours are",
        body: "Draft and transform are the safe, immediate wins: high volume, low risk, easy to check. Extract is high value but needs verification. Decide is where you should stay the human in the loop.",
      },
      {
        kind: "text",
        label: "Role example — support",
        body: "Twenty-three similar “where is my order” replies drafted by hand becomes one template plus a model that fills in order specifics. The reply still gets read before sending for the first month.",
      },
      {
        kind: "text",
        label: "Role example — sales",
        body: "Researching a prospect before a call (transform: 40 minutes of tabs into a one-page brief) beats auto-writing cold emails, which is high volume but damages the brand when it is wrong.",
      },
      {
        kind: "prompt",
        label: "Do this now",
        body: "Here is my task list from last week: <paste>. Label each item Draft, Transform, Extract or Decide. Then rank the Draft and Transform items by (minutes per week × how safe they are to check).",
      },
    ],
    quiz: [
      {
        question: "Which category is the best first automation target?",
        options: ["Decide", "Draft", "Anything involving legal review"],
        answer: 1,
        explain: "Drafting is high-volume, easily reviewed, and low-consequence when a human reads the output.",
      },
      {
        question: "Why label blocks before choosing a tool?",
        options: [
          "It reveals where hours actually go instead of where you assume",
          "It is required by compliance",
          "It makes the model faster",
        ],
        answer: 0,
        explain: "The audit replaces guesses with evidence. Often the biggest block is a task worth deleting rather than automating.",
      },
    ],
    takeaways: [
      "Audit real blocks, not remembered impressions.",
      "Draft and transform first; decide last.",
      "Delete before you automate.",
    ],
  },
  {
    id: "wrk-2",
    trackId: "work",
    title: "Outbound email that sounds like you",
    blurb: "Give the model your voice as evidence, then constrain the ask.",
    minutes: 6,
    xp: 30,
    blocks: [
      {
        kind: "text",
        body: "Generic AI email fails for one reason: the model has no sample of your voice, so it writes the average of the internet. Fix that with two of your own sent emails before you ask for anything.",
      },
      {
        kind: "prompt",
        label: "Voice-cloning prompt",
        body: "Below are two emails I actually sent. Match their voice: sentence length, how I open, how direct I am, whether I use contractions. Then write a 90-word email to <person> about <reason>. One ask, stated plainly. No exclamation marks, no “I hope this finds you well”, no bullet points.",
      },
      {
        kind: "compare",
        label: "The difference",
        body: "“I hope this email finds you well! I wanted to reach out regarding…” — the model's default register.",
        body2: "“Quick one: we're shipping the pricing change on the 14th. Do you need a walkthrough before then?” — same content, a voice a human recognises.",
      },
      {
        kind: "text",
        label: "Role example — marketing",
        body: "Feed the model three of your best-performing newsletter openings and ask it to write five subject lines in that pattern, then pick by hand. The choosing is the skill; the generating is cheap.",
      },
      {
        kind: "callout",
        label: "Non-negotiable",
        body: "Never let it invent a fact about the recipient — a shared connection, a funding round, a product they use. If you did not supply it, it is fabricated and it will embarrass you.",
      },
    ],
    quiz: [
      {
        question: "What most improves voice matching?",
        options: [
          "Asking for a professional tone",
          "Pasting two emails you actually wrote",
          "Increasing the length limit",
        ],
        answer: 1,
        explain: "Examples carry rhythm and diction that adjectives cannot. Two real samples change the output more than any instruction.",
      },
      {
        question: "The model mentions the recipient's recent funding round you never told it about. What is that?",
        options: ["A lucky guess worth keeping", "A fabrication to remove", "A cached web result"],
        answer: 1,
        explain: "Recipient facts must come from you. Unsupplied specifics are invented regardless of how plausible they look.",
      },
    ],
    takeaways: [
      "Two real samples beat any adjective.",
      "Constrain the ask to one thing.",
      "Never ship an unsupplied fact about a person.",
    ],
  },
  {
    id: "wrk-3",
    trackId: "work",
    title: "Thread to decisions",
    blurb: "Turn 80 messages into owners, dates and open questions.",
    minutes: 5,
    xp: 30,
    blocks: [
      {
        kind: "prompt",
        label: "The workhorse prompt",
        body: "Below is a thread (or meeting notes). Extract: 1) decisions made, with who made them; 2) action items with an owner and a due date, or “unassigned” if none is stated; 3) open questions; 4) anything that contradicts an earlier message. Do not invent owners or dates. Quote the line each item came from.",
      },
      {
        kind: "text",
        body: "The “quote the line” rule is doing the real work. It makes every item checkable in seconds, and it stops the model from smoothing over ambiguity with a confident summary.",
      },
      {
        kind: "text",
        label: "Role example — engineering",
        body: "After an incident channel with 200 messages, the same prompt plus “order the timeline by timestamp” produces a draft postmortem skeleton. Engineers then correct it — much faster than starting from a blank page.",
      },
      {
        kind: "text",
        label: "Role example — ops",
        body: "Vendor email chains become a table of commitments: what was promised, by when, at what price. Anything the model marked “unassigned” is your follow-up list.",
      },
      {
        kind: "callout",
        label: "Guardrail",
        body: "Do not paste a thread that contains customer PII or credentials. Redact names and replace account numbers with placeholders before it goes anywhere.",
      },
    ],
    quiz: [
      {
        question: "Why require a quote for each extracted item?",
        options: [
          "It makes the summary longer",
          "It makes every claim verifiable in seconds",
          "It improves the model's memory",
        ],
        answer: 1,
        explain: "Quotes let a human confirm the extraction without re-reading the thread, and they expose invented items immediately.",
      },
      {
        question: "The summary assigns an owner nobody mentioned. What went wrong?",
        options: [
          "The prompt lacked an explicit “do not invent owners” constraint",
          "The thread was too short",
          "The model needs a bigger context window",
        ],
        answer: 0,
        explain: "Models fill gaps. Naming the forbidden inference and asking for “unassigned” when unsure prevents it.",
      },
    ],
    takeaways: [
      "Decisions, owners, dates, open questions — extract, don't summarise.",
      "Quotes make the result auditable.",
      "“Unassigned” is a valid and useful answer.",
    ],
  },
  {
    id: "wrk-4",
    trackId: "work",
    title: "One document, five formats",
    blurb: "Write once, then reshape — the highest-leverage transform there is.",
    minutes: 5,
    xp: 30,
    blocks: [
      {
        kind: "text",
        body: "A finished document already contains the hard thinking. Turning it into a deck, a summary, a FAQ, a launch post and a one-line pitch is mechanical reshaping — exactly the work a model does well and a human does slowly.",
      },
      {
        kind: "prompt",
        label: "Reshape prompt",
        body: "Here is a finished document. Produce, without adding new claims: 1) a 5-slide outline with a headline per slide; 2) a 120-word executive summary; 3) eight FAQ questions with answers drawn from the text; 4) a 60-word launch post; 5) one sentence under 15 words. Flag anything that does not fit the source.",
      },
      {
        kind: "callout",
        label: "The rule that keeps it honest",
        body: "“Without adding new claims” plus “flag anything that does not fit the source”. Reshaping should compress, never invent. The flag line is your quality check.",
      },
      {
        kind: "text",
        label: "Role example — product",
        body: "A spec becomes release notes, a support macro, an internal changelog and a sales one-pager in a single pass. Each audience gets the same facts at a different depth.",
      },
      {
        kind: "text",
        label: "Role example — consulting",
        body: "A 30-page analysis becomes a 10-slide narrative. Ask explicitly for “headline as the slide title, evidence as the body” — that structure is what makes decks readable.",
      },
    ],
    quiz: [
      {
        question: "Which instruction best protects accuracy when reshaping?",
        options: [
          "“Make it engaging”",
          "“Do not add claims not present in the source; flag mismatches”",
          "“Use a professional tone”",
        ],
        answer: 1,
        explain: "Reshaping is compression. The constraint keeps it from drifting into new, unverified content.",
      },
      {
        question: "What should you check first in the reshaped output?",
        options: [
          "Word count",
          "Whether any new factual claim appeared",
          "Font choice",
        ],
        answer: 1,
        explain: "Volume is easy to fix. Invented facts are the failure mode that reaches customers.",
      },
    ],
    takeaways: [
      "Write the source once, reshape many times.",
      "Forbid new claims; ask it to flag gaps.",
      "Match depth to audience, facts stay constant.",
    ],
  },
  {
    id: "wrk-5",
    trackId: "work",
    title: "Measure it or stop doing it",
    blurb: "Baseline, time saved, error rate — in one week, with a spreadsheet.",
    minutes: 6,
    xp: 35,
    blocks: [
      {
        kind: "text",
        body: "An AI workflow that feels faster is not evidence. Pick one task, measure it for a week before you change anything, then measure again. Three numbers are enough: minutes per task, tasks per week, and how often the output needed a human fix.",
      },
      {
        kind: "text",
        body: "Track the review cost honestly. A draft that takes 2 minutes to generate but 9 minutes to check saved nothing over the 8 minutes it used to take. The win appears when review is fast because the task is easy to verify.",
      },
      {
        kind: "callout",
        label: "The decision rule",
        body: "If review time plus generation time is not clearly below baseline, do not ship the workflow. If the error rate rises, the savings are borrowed, not earned.",
      },
      {
        kind: "prompt",
        label: "Weekly review prompt",
        body: "Here is my log of this task for two weeks (before and after). Compute median minutes per task for each week, the change in volume, and my fix rate. Tell me plainly whether this workflow is worth keeping.",
      },
      {
        kind: "text",
        label: "Role example — operations",
        body: "Invoice data entry dropped from 6 minutes to 90 seconds per invoice, but the fix rate went from 2% to 11%. The team kept the workflow only after adding a validation column that caught the common extraction error.",
      },
    ],
    quiz: [
      {
        question: "A workflow generates a draft in 1 minute but review takes 10. What is the honest conclusion?",
        options: [
          "It is a win because generation is fast",
          "It is no faster than the 8-minute baseline",
          "Review time does not count",
        ],
        answer: 1,
        explain: "Total time is generation plus review. Faster generation with slow checking is a lateral move.",
      },
      {
        question: "Which metric most often gets ignored?",
        options: ["Minutes saved", "Error and fix rate", "Number of prompts written"],
        answer: 1,
        explain: "Error rate is invisible unless you log it, and it is the one that decides whether the savings are real.",
      },
    ],
    takeaways: [
      "Baseline first, or you are guessing.",
      "Count review time as part of the cost.",
      "Rising error rate cancels the time saved.",
    ],
  },
];
