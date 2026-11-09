export interface SimOption {
  id: "a" | "b" | "c";
  title: string;
  detail: string;
}

export interface SimRound {
  id: string;
  round: number;
  title: string;
  situation: string;
  metricHint: string;
  options: SimOption[];
}

/** Public round data. Scoring lives in content/simulator-scores.ts and never ships. */
export const ROUNDS: SimRound[] = [
  {
    id: "sim-1",
    round: 1,
    title: "Pick your niche",
    situation:
      "You have two weeks and no audience. You want an AI-built product that someone will pay for, not a demo that gets polite nods.",
    metricHint: "Cash is hard to move this early. Reach and trust compound.",
    options: [
      {
        id: "a",
        title: "A tool for everyone",
        detail: "An AI writing assistant for 'anyone who writes'. Huge market, no specific user, no way to be recommended.",
      },
      {
        id: "b",
        title: "A painful niche you understand",
        detail: "Quote follow-ups for independent tradespeople — a job done badly at 9pm from a phone.",
      },
      {
        id: "c",
        title: "A saturated category, done cheaply",
        detail: "Another AI resume builder, priced at $3/month, competing with forty established ones.",
      },
    ],
  },
  {
    id: "sim-2",
    round: 2,
    title: "Set the price",
    situation:
      "Twelve tradespeople have used the prototype. They keep using it. Now one asks what it costs — and you have to answer today.",
    metricHint: "Underpricing buys reach but starves the product. Overpricing with no proof kills trust.",
    options: [
      {
        id: "a",
        title: "$0 forever, grow later",
        detail: "Free while you build, monetise once you have thousands of users and a reason to stay.",
      },
      {
        id: "b",
        title: "$19/month, framed around one recovered job",
        detail: "A single recovered quote is worth hundreds. Price against that, not against other software.",
      },
      {
        id: "c",
        title: "$99/month with no trial",
        detail: "Premium positioning from day one, no free tier, no way to try before paying.",
      },
    ],
  },
  {
    id: "sim-3",
    round: 3,
    title: "Get the first hundred users",
    situation:
      "The product works. You have no marketing budget, a list of 400 tradespeople you have spoken to, and no idea which channel compounds.",
    metricHint: "Reach rises fast with anything public. Trust only rises when real people vouch.",
    options: [
      {
        id: "a",
        title: "Buy a thousand clicks",
        detail: "Paid ads to a cold audience, one landing page, no social proof and no follow-up sequence.",
      },
      {
        id: "b",
        title: "Go where they already talk",
        detail: "Answer real questions in trade forums and WhatsApp groups for six weeks, help first, mention the tool second.",
      },
      {
        id: "c",
        title: "A viral giveaway",
        detail: "Free lifetime access to anyone who shares a post. Fast reach, low intent, permanent free riders.",
      },
    ],
  },
  {
    id: "sim-4",
    round: 4,
    title: "The incident",
    situation:
      "A customer's follow-up email went to the wrong person because your AI drafted from a stale contact. They are angry and they are right. Two more users report the same bug.",
    metricHint: "This round decides whether anyone trusts you again.",
    options: [
      {
        id: "a",
        title: "Fix silently",
        detail: "Patch the bug quietly, no announcement, hope nobody else notices. No one is told, nothing is explained.",
      },
      {
        id: "b",
        title: "Own it publicly and change the flow",
        detail: "Tell affected users what happened in plain language, require explicit confirmation of the recipient, add a recipient-check step, publish what changed.",
      },
      {
        id: "c",
        title: "Blame the model provider",
        detail: "Explain that the underlying AI made a mistake, offer nothing, and keep the flow as it is.",
      },
    ],
  },
  {
    id: "sim-5",
    round: 5,
    title: "Scale without breaking it",
    situation:
      "340 paying users, one support inbox, and a growing pile of feature requests. Every new signup adds a little more load — and a little more risk.",
    metricHint: "The final score weighs cash, reach and trust together. Neglect one and it shows.",
    options: [
      {
        id: "a",
        title: "Ship every request",
        detail: "Say yes to all of it, keep the design flat, add features weekly with no migration plan.",
      },
      {
        id: "b",
        title: "Harden the core, raise the price for new users",
        detail: "Fix reliability and onboarding, publish a small roadmap, keep existing prices, raise new-user pricing to fund support.",
      },
      {
        id: "c",
        title: "Raise prices and cut support",
        detail: "Double the price for everyone, remove the support inbox, rely on documentation only.",
      },
    ],
  },
];
