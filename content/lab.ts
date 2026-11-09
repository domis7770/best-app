import type { LabTemplate } from "./types";

export const LAB: LabTemplate[] = [
  {
    id: "lab-hero",
    title: "Landing hero that says one thing",
    blurb: "Three variants, constrained so they stay specific instead of swelling into marketing fog.",
    level: "Starter",
    minutes: 8,
    system: "You are a copywriter who has shipped many developer-tool landing pages. You write plainly and you never use the words revolutionary, seamless, unlock or empower.",
    prompt: `Product: <one sentence describing what it does and for whom>.
Audience: <who lands on this page and what they already believe>.

Write 3 hero variants. Each must contain:
- headline, max 8 words, stating the outcome (not the mechanism)
- subheadline, max 20 words, naming who it is for
- one primary button label, max 4 words

Rules: no exclamation marks, no adjectives that cannot be proven, no feature lists.
After the three, name the one you would ship and why in 2 sentences.`,
    checklist: [
      "Headline is an outcome, not a feature",
      "A stranger can tell who the product is for",
      "Button label is a verb, not 'Learn more'",
      "No claim you could not defend in a meeting",
    ],
  },
  {
    id: "lab-support",
    title: "Support reply that stays inside policy",
    blurb: "Grounded in your policy, with an explicit escalation path instead of creative promises.",
    level: "Starter",
    minutes: 10,
    system: "You are a support agent. You may only use the policy provided. If the policy does not cover the case, you say so and offer to escalate.",
    prompt: `Policy:
<PASTE THE REFUND / WARRANTY / SLA POLICY VERBATIM>

Customer message:
<PASTE THE MESSAGE, WITH PERSONAL DETAILS REDACTED>

Write a reply that:
1. answers the actual question in the first sentence
2. states what happens next, with a concrete timeframe
3. offers one alternative if the request cannot be met
4. stays under 130 words, warm but not apologetic

Then list, separately: any part of the request the policy does not cover.`,
    code: `// The rule that matters: the model never chooses the policy.
const reply = await model.generate({
  system: POLICY_PROMPT,          // fixed, versioned
  input: customerMessage,         // untrusted
  maxTokens: 300,
});
// Human reads before send, for the first month.`,
    checklist: [
      "Every promise traces to a line in the policy",
      "Uncovered cases are escalated, not improvised",
      "No customer PII pasted — names replaced",
      "Reply is read by a human before sending",
    ],
  },
  {
    id: "lab-csv",
    title: "CSV cleanup script",
    blurb: "Describe the mess precisely once, get a script you can read, then keep the script.",
    level: "Intermediate",
    minutes: 12,
    prompt: `Write a single Bun/Node script (no external dependencies) that reads input.csv and writes clean.csv.

Known problems in the file:
- dates appear as YYYY-MM-DD, DD/MM/YYYY and "March 3, 2025"
- amounts sometimes contain "$", commas and parentheses for negatives
- duplicate rows, where a duplicate means same email + same date
- a header row that may be repeated mid-file

Requirements: normalise dates to ISO 8601, parse amounts to integer cents, drop duplicates keeping the last occurrence, skip repeated headers, print a summary of how many rows were fixed or dropped. Handle a missing file with a clear error.`,
    checklist: [
      "Script runs on a copy of the real file",
      "Row counts before and after are printed",
      "Money is handled in integer cents, never floats",
      "Original file is never overwritten",
    ],
  },
  {
    id: "lab-sql",
    title: "SQL generator with a schema, not a database",
    blurb: "Give it column names and types only — never rows, never a connection string.",
    level: "Intermediate",
    minutes: 10,
    system: "You write read-only PostgreSQL. You never use SELECT *, never interpolate user input into strings, and you always use bound parameters.",
    prompt: `Schema (tables, columns, types, indexed columns):
<PASTE ONLY THE SCHEMA>

Question: <what a human wants to know>

Return:
1. one query using $1-style placeholders for any user-supplied value
2. the parameter list with example values
3. an index that would make it fast, if one is missing
4. the row shape the caller should expect

If the schema cannot answer the question, say what column is missing instead of inventing one.`,
    code: `-- generated output is a draft: read it before you run it
SELECT o.id, SUM(oi.qty * oi.unit_cents) AS total_cents
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.created_at >= $1 AND o.created_at < $2
GROUP BY o.id
ORDER BY total_cents DESC
LIMIT 50;`,
    checklist: [
      "Only schema was pasted, no real rows",
      "Query is read-only and parameterised",
      "Placeholders match the parameter list",
      "Query is tested against a replica first",
    ],
  },
  {
    id: "lab-react",
    title: "React component from a written spec",
    blurb: "Constrain the output to your stack so you get review-ready code, not a rewrite.",
    level: "Intermediate",
    minutes: 12,
    prompt: `Write a React 19 function component called PriceToggle.

Behaviour:
- props: { monthly: number; yearly: number; onChange?: (plan: 'monthly' | 'yearly') => void }
- renders two buttons, monthly and yearly, the active one visually distinct
- shows the yearly saving as a percentage, rounded down, e.g. "Save 20%"
- keyboard accessible: arrow keys move selection, Enter/Space activates
- uncontrolled fallback: works without onChange, managing its own state

Constraints: TypeScript, no UI library, no inline styles except a CSS variable for the accent colour, no useEffect for derived values, under 70 lines.`,
    checklist: [
      "Types compile with strict mode on",
      "Tab and arrow keys both work",
      "Percentages are computed, not hard-coded",
      "No useEffect used for derived state",
    ],
  },
  {
    id: "lab-automation",
    title: "Automation spec for a workflow",
    blurb: "The highest-leverage output for a model is a precise plan you can hand to anyone.",
    level: "Advanced",
    minutes: 15,
    prompt: `Write an automation specification for this workflow: <describe the manual process, who does it, and how often>.

The spec must include:
1. trigger — what starts the workflow
2. inputs — every field, its format, and where it comes from
3. steps — each step with its tool, its input and its output
4. failure modes — three realistic ways it breaks and what happens then
5. human checkpoints — where a person must approve before anything irreversible
6. success metric — one number, measured how, checked how often

For each step, mark it as deterministic (code) or generative (model). Never mark a step that moves money or deletes data as generative.`,
    checklist: [
      "Every input names its source and format",
      "Irreversible steps have a human checkpoint",
      "Failure modes have a defined response",
      "There is exactly one success metric",
    ],
  },
];
