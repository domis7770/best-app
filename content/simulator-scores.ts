export interface Outcome {
  cash: number;
  reach: number;
  trust: number;
  feedback: string;
}

/**
 * Server-only. Imported by lib/sim.ts, never by a client component: scores must
 * not be visible in the browser bundle.
 */
export const SCORES: Record<string, Record<string, Outcome>> = {
  "sim-1": {
    a: {
      cash: 0,
      reach: 1,
      trust: 0,
      feedback:
        "Broad positioning gave you nothing to be recommended for. Nobody searches for 'writing assistant for everyone'.",
    },
    b: {
      cash: 1,
      reach: 2,
      trust: 3,
      feedback:
        "A specific, painful, recurring job with a clear buyer. Reach is limited but every conversation is relevant, and relevance is what makes referrals work.",
    },
    c: {
      cash: 0,
      reach: 1,
      trust: -1,
      feedback:
        "Competing on price in a saturated category means you buy customers you cannot afford to keep. Reach rose briefly, then stalled.",
    },
  },
  "sim-2": {
    a: {
      cash: 0,
      reach: 2,
      trust: 1,
      feedback: "Free users are not a business. You learned usage patterns, but no willingness to pay.",
    },
    b: {
      cash: 3,
      reach: 1,
      trust: 2,
      feedback:
        "Anchoring price to the value of one recovered job is the right frame, and $19 is low enough to try. Cash starts moving.",
    },
    c: {
      cash: 1,
      reach: -2,
      trust: -2,
      feedback:
        "No trial at $99 asks for trust you have not earned. A few sales, many silent rejections, and no feedback loop.",
    },
  },
  "sim-3": {
    a: {
      cash: -2,
      reach: 1,
      trust: 0,
      feedback: "Paid clicks with no proof convert badly. You paid for attention you could not convert.",
    },
    b: {
      cash: 1,
      reach: 3,
      trust: 3,
      feedback:
        "Six weeks of showing up where the work happens beats any ad budget. Helpful answers become the social proof your landing page lacks.",
    },
    c: {
      cash: 0,
      reach: 3,
      trust: -2,
      feedback:
        "Reach spiked. Free lifetime accounts will weigh on costs forever, and people who came for free rarely convert.",
    },
  },
  "sim-4": {
    a: {
      cash: 0,
      reach: 0,
      trust: -3,
      feedback:
        "Silent fixes get discovered anyway. The users who hit the bug learn that you will not tell them when things break.",
    },
    b: {
      cash: -1,
      reach: 1,
      trust: 3,
      feedback:
        "Owning it plainly and changing the flow is the only move that survives. Confirmation steps cost clicks and buy the thing you cannot buy back: trust.",
    },
    c: {
      cash: 0,
      reach: 0,
      trust: -3,
      feedback:
        "Blaming the provider reads as refusing responsibility. Users do not care whose model it was; they care who shipped it.",
    },
  },
  "sim-5": {
    a: {
      cash: -1,
      reach: 2,
      trust: -1,
      feedback:
        "Saying yes to everything spread the product thin. Reliability slipped exactly when usage grew.",
    },
    b: {
      cash: 3,
      reach: 2,
      trust: 3,
      feedback:
        "Harden the core, protect existing customers, fund support with new-user pricing. Unglamorous and correct.",
    },
    c: {
      cash: 1,
      reach: -2,
      trust: -3,
      feedback:
        "Doubling prices while removing support churns the people who trusted you first. Revenue rises for one month.",
    },
  },
};

export const MAX_ROUND = 5;
