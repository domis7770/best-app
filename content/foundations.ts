import type { Lesson } from "./types";

export const FOUNDATIONS: Lesson[] = [
  {
    id: "fnd-1",
    trackId: "foundations",
    title: "What a model actually is",
    blurb: "No memory, no internet, no opinions — unless you give it something to work with.",
    minutes: 4,
    xp: 20,
    blocks: [
      {
        kind: "text",
        body: "A language model is a next-token predictor. It reads the text you give it and estimates which token is most likely to come next, then repeats. That loop produced everything you have ever seen it write.",
      },
      {
        kind: "text",
        body: "This single fact explains most of its behaviour. It is very good at patterns it has seen a million times — tone, structure, code, summaries. It is not looking anything up, not remembering your last chat, and not checking whether the sentence is true.",
      },
      {
        kind: "callout",
        label: "The one habit",
        body: "If the model needs a fact, put the fact in the prompt. Everything it knows that you did not type, it is recalling from training data, and training data goes stale.",
      },
      {
        kind: "compare",
        label: "Same request, different outcome",
        body: "“What's our refund policy?” — the model invents a plausible policy.",
        body2: "“Here is our refund policy: <paste>. A customer asks if they can return an opened item after 40 days. Answer using only the policy.” — the model quotes your policy.",
      },
    ],
    quiz: [
      {
        question: "Why does a model sometimes state a confident wrong fact?",
        options: [
          "It predicts plausible text rather than checking sources",
          "It has a bug that corrupts facts when the prompt is long",
          "It intentionally hides uncertainty",
        ],
        answer: 0,
        explain: "Plausibility and truth are different targets. Fluent text is the output; accuracy depends on what you put in the prompt.",
      },
      {
        question: "A model answers a question about today's prices. What is the most likely problem?",
        options: [
          "Nothing — models browse by default",
          "It cannot know current prices unless you give them or it has a search tool",
          "It only fails on weekends",
        ],
        answer: 1,
        explain: "Training data has a cutoff. Without a tool or pasted data, current facts come from the model's imagination.",
      },
    ],
    takeaways: [
      "It predicts tokens; it does not verify facts.",
      "It only 'knows' what is in the prompt plus its training data.",
      "Facts in the prompt beat facts in the model's memory.",
    ],
  },
  {
    id: "fnd-2",
    trackId: "foundations",
    title: "Tokens and the context window",
    blurb: "Why long chats get worse, and why cost is measured in a unit you can't see.",
    minutes: 5,
    xp: 20,
    blocks: [
      {
        kind: "text",
        body: "Text is split into tokens — roughly three quarters of a word each. “Promptly” might be two tokens. Models read and write in those units, which is why pricing is quoted per million tokens.",
      },
      {
        kind: "text",
        body: "The context window is the total tokens the model can hold at once: your instructions, the conversation so far, any documents you pasted, and the reply. It is a hard limit, not a soft one. When you cross it, the oldest material is dropped or the request fails.",
      },
      {
        kind: "callout",
        label: "Symptom to recognise",
        body: "If the model forgets an instruction from twenty messages ago, you did not lose its attention — you lost its context. Restate the constraint or start a fresh thread with a summary.",
      },
      {
        kind: "prompt",
        label: "Cheap pattern: summarise and restart",
        body: "Summarise our conversation so far into: decisions made, open questions, and the constraints I gave you. Keep it under 200 words.",
      },
    ],
    quiz: [
      {
        question: "A long chat starts ignoring your original formatting rules. Best fix?",
        options: [
          "Repeat the rules in your next message or restart with a summary",
          "Type in all caps so the rules stand out",
          "Ask the model to try harder",
        ],
        answer: 0,
        explain: "The early instruction has drifted out of the effective window. Restate it, or carry a summary into a fresh thread.",
      },
      {
        question: "What are you billed for?",
        options: ["Words typed", "Input and output tokens", "Time spent in the chat"],
        answer: 1,
        explain: "Both directions count. Pasting a 40-page document costs input tokens every time you send it.",
      },
    ],
    takeaways: [
      "Tokens ≈ 0.75 words; pricing and limits use them.",
      "Context is a shared budget: instructions + history + documents + reply.",
      "Long threads drift. Summarise and restart.",
    ],
  },
  {
    id: "fnd-3",
    trackId: "foundations",
    title: "Prompts that work",
    blurb: "Role, task, context, format, constraints — plus one change at a time.",
    minutes: 6,
    xp: 25,
    blocks: [
      {
        kind: "text",
        body: "A prompt that produces usable output usually contains five things: who the model is acting as, the single task, the context it needs, the shape of the output, and the constraints it must respect.",
      },
      {
        kind: "compare",
        label: "Weak vs strong",
        body: "“Write an email about the delay.”",
        body2: "“You are a support lead at a small hardware company. Write a 120-word email to a customer whose order is 5 days late because a part failed inspection. Tone: direct, no corporate filler. Include one concrete next step and a new delivery date placeholder. Do not apologise more than once.”",
      },
      {
        kind: "callout",
        label: "One variable at a time",
        body: "If the output is wrong, change one element and re-run. Change three at once and you learn nothing about which one mattered.",
      },
      {
        kind: "prompt",
        label: "The reusable skeleton",
        body: "Role: <who you are>. Task: <one sentence>. Context: <facts I am giving you>. Output: <format, length>. Constraints: <what not to do>. If something is missing, ask before writing.",
      },
    ],
    quiz: [
      {
        question: "Which element is most often missing from a bad prompt?",
        options: ["Politeness", "Concrete context and output format", "A closing thank-you"],
        answer: 1,
        explain: "Models are not shy — they are under-informed. Facts and a target shape do most of the work.",
      },
      {
        question: "Your prompt gives five conflicting instructions and the output is muddled. What first?",
        options: [
          "Add more instructions to clarify",
          "Cut to the single most important requirement and rebuild",
          "Switch models immediately",
        ],
        answer: 1,
        explain: "Conflicts confuse the model exactly as they would a new colleague. Reduce, then re-add deliberately.",
      },
      {
        question: "Why add “if something is missing, ask before writing”?",
        options: [
          "It forces the model to guess faster",
          "It converts silent invention into a useful question",
          "It reduces token cost to zero",
        ],
        answer: 1,
        explain: "Gaps get filled either by a question or by a confident guess. Choose the question.",
      },
    ],
    takeaways: [
      "Role, task, context, format, constraints.",
      "One change per iteration so you learn what works.",
      "Invite questions instead of inviting invention.",
    ],
  },
  {
    id: "fnd-4",
    trackId: "foundations",
    title: "Hallucinations and how to catch them",
    blurb: "Fluent is not the same as true. Build the checking habit now.",
    minutes: 5,
    xp: 25,
    blocks: [
      {
        kind: "text",
        body: "A hallucination is output that reads as authoritative and is not true: an invented citation, a policy that does not exist, a function that is not in the library. It is not a malfunction — it is the prediction loop doing exactly what it does when it lacks the facts.",
      },
      {
        kind: "text",
        body: "Hallucinations cluster where facts are specific: numbers, names, dates, quotes, legal or medical detail, API signatures, and anything after the training cutoff. General explanation is usually fine; specifics need a source.",
      },
      {
        kind: "callout",
        label: "Three cheap defences",
        body: "1) Paste the source and say “answer only from this”. 2) Ask for the exact quote that supports each claim. 3) Check every number, name and link yourself before it leaves your desk.",
      },
      {
        kind: "prompt",
        label: "Grounding prompt",
        body: "Using only the document below, answer the question. For every claim, quote the sentence it came from. If the document does not contain the answer, say “not in the document” instead of guessing.",
      },
    ],
    quiz: [
      {
        question: "The model cites a real-sounding study that does not exist. Why?",
        options: [
          "It predicted a plausible citation pattern",
          "It has a database of fake studies",
          "The citation was removed from the internet",
        ],
        answer: 0,
        explain: "Citation-shaped text is a pattern. Without retrieval, the details are generated, not looked up.",
      },
      {
        question: "Which output needs the most verification?",
        options: [
          "A general explanation of what a token is",
          "A table of 2026 tax thresholds with citations",
          "A brainstorm of ten blog titles",
        ],
        answer: 1,
        explain: "Specific, checkable, high-stakes numbers are exactly where invention is most costly.",
      },
    ],
    takeaways: [
      "Fluent ≠ true; specificity is where it breaks.",
      "Ground the model in a source you can check.",
      "Verify numbers, names, quotes and links before sending.",
    ],
  },
  {
    id: "fnd-5",
    trackId: "foundations",
    title: "What is safe to paste",
    blurb: "Context improves answers. Some context should never leave your machine.",
    minutes: 5,
    xp: 25,
    blocks: [
      {
        kind: "text",
        body: "Everything you paste is data you are handing to a third party. That is fine for a draft, a public spec or an anonymised sample. It is not fine for credentials, customer records, health data, contracts under NDA, or anything your legal team would want to know about first.",
      },
      {
        kind: "compare",
        label: "Redact, don't skip",
        body: "Bad: pasting a real customer email with name, address and card last-four.",
        body2: "Good: “Customer in Germany, ordered 3 weeks ago, item arrived damaged.” Same task, no exposure.",
      },
      {
        kind: "callout",
        label: "The three-question test",
        body: "Would I email this to an outside contractor? Would it matter if it appeared in a breach report? Does the task actually need the real value, or just its shape?",
      },
      {
        kind: "text",
        body: "Secrets are the sharp edge: an API key pasted into a chat is compromised the moment it is sent, even if you delete the message. Rotate anything that slips, and never let a model generate credentials for production.",
      },
    ],
    quiz: [
      {
        question: "You need help debugging an API call. What do you paste?",
        options: [
          "The full request including the live key",
          "The request with the key replaced by YOUR_KEY_HERE",
          "Nothing — debugging is impossible without the key",
        ],
        answer: 1,
        explain: "The shape of the request is what matters. A placeholder preserves the structure without leaking the secret.",
      },
      {
        question: "Which of these is safe to paste into a public AI tool?",
        options: [
          "An anonymised sample of 5 support tickets",
          "A signed contract with a client",
          "Employee salary spreadsheet",
        ],
        answer: 0,
        explain: "Anonymised samples carry the structure you need with no identifiable data attached.",
      },
    ],
    takeaways: [
      "Paste shapes, not identities.",
      "Credentials pasted are credentials leaked — rotate them.",
      "When unsure, ask before pasting.",
    ],
  },
  {
    id: "fnd-6",
    trackId: "foundations",
    title: "Iterate, don't restart",
    blurb: "The second draft is where the value is. Learn to give useful feedback.",
    minutes: 5,
    xp: 25,
    blocks: [
      {
        kind: "text",
        body: "Most people judge the first output, dislike it, and start over with a brand new prompt. The better loop is to keep the thread and critique specifics: this sentence is too long, that claim is unsupported, the tone is too formal for this reader.",
      },
      {
        kind: "prompt",
        label: "Critique-first pattern",
        body: "Before rewriting: list the three weakest parts of what you just wrote and why. Then rewrite only those parts. Keep everything else identical.",
      },
      {
        kind: "text",
        body: "Examples beat adjectives. “Make it more professional” is unactionable. Pasting two sentences in the voice you want gives the model a target it can match.",
      },
      {
        kind: "callout",
        label: "Stop rule",
        body: "If three rounds have not converged, the prompt is wrong — not the model. Go back to the five elements and fix the missing one.",
      },
    ],
    quiz: [
      {
        question: "Best way to fix tone across a whole draft?",
        options: [
          "Say “make it better” and rerun",
          "Paste a two-sentence example of the voice you want",
          "Ask for a longer version",
        ],
        answer: 1,
        explain: "Examples are the highest-bandwidth instruction. Adjectives are guesses; samples are targets.",
      },
      {
        question: "What does “rewrite only those parts, keep everything else identical” protect?",
        options: [
          "The good material you already approved",
          "Token count",
          "The model's memory of the thread",
        ],
        answer: 0,
        explain: "Scoped edits stop the model from silently rewriting what already worked.",
      },
    ],
    takeaways: [
      "Critique specifics, not vibes.",
      "Examples of voice beat adjectives about voice.",
      "Three failed rounds means fix the prompt, not the wording.",
    ],
  },
  {
    id: "fnd-7",
    trackId: "foundations",
    title: "Tools, retrieval and the right job",
    blurb: "When a model should search, when it should compute, and when it shouldn't be used.",
    minutes: 6,
    xp: 30,
    blocks: [
      {
        kind: "text",
        body: "A model on its own can only transform text. Give it a tool and it can search the web, run code, read your files or call an API. The model decides when to use the tool; the tool returns real data; the model writes the answer.",
      },
      {
        kind: "compare",
        label: "Pick the right instrument",
        body: "Arithmetic, sorting, deduplication, date maths → a script. Deterministic, free, exact.",
        body2: "Drafting, summarising, rewriting, classifying messy text → a model. Ambiguous, language-shaped, no single right answer.",
      },
      {
        kind: "callout",
        label: "Retrieval in one line",
        body: "If the answer lives in your documents, fetch the relevant passages first and put them in the prompt. That is all “RAG” means at the level you need today.",
      },
      {
        kind: "text",
        body: "Never let a model be the only check on a decision that costs money, affects a person's rights, or cannot be undone. Use it to prepare the decision, then decide.",
      },
    ],
    quiz: [
      {
        question: "You need the total of 400 invoice amounts. Best tool?",
        options: ["The model's arithmetic in the chat", "A script or spreadsheet formula", "Ask the model twice and average"],
        answer: 1,
        explain: "Deterministic maths belongs in code. Models can sum small lists, but there is no reason to risk it at scale.",
      },
      {
        question: "What makes a task a good fit for a model?",
        options: [
          "The output is language and there are many acceptable answers",
          "The output must be bit-for-bit reproducible",
          "The task is a legal compliance decision",
        ],
        answer: 0,
        explain: "Language-shaped, judgement-tolerant work is the sweet spot. Exactness and accountability are not.",
      },
      {
        question: "Simplest way to make a model answer from your own docs?",
        options: [
          "Fine-tune a model on the docs",
          "Retrieve the relevant passages and paste them into the prompt",
          "Ask it to search its memory",
        ],
        answer: 1,
        explain: "Retrieval plus a grounded prompt solves most internal-knowledge cases without training anything.",
      },
    ],
    takeaways: [
      "Tools turn prediction into retrieval and computation.",
      "Code for exact, models for language, retrieval for your own facts.",
      "Keep humans on irreversible, high-stakes decisions.",
    ],
  },
];
