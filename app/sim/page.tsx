import Link from "next/link";
import { getActor, accessOf } from "@/lib/session";
import { canUseSimulator, simRoundsAllowed } from "@/lib/entitlements";
import { loadState, currentRound, finalReport } from "@/lib/sim";
import { ROUNDS } from "@/content/simulator";
import { SimClient } from "../components/SimClient";
import { GuestButton } from "../components/Forms";

export default async function SimPage() {
  const viewer = await getActor();
  const access = accessOf(viewer);

  if (!canUseSimulator(access)) {
    return (
      <div className="page">
        <div className="container lesson-wrap">
          <div className="paywall">
            <span className="eyebrow">Build with AI</span>
            <h1 style={{ margin: "10px 0 12px", fontSize: "clamp(1.8rem, 3.6vw, 2.6rem)" }}>
              Run a business for five rounds.
            </h1>
            <p className="lede" style={{ margin: "0 auto 18px" }}>
              Every choice moves cash, reach and trust. Free accounts get the first two rounds; Plus
              gets all five, scored on the server.
            </p>
            <div className="row" style={{ justifyContent: "center" }}>
              <Link className="btn" href="/signup">
                Create a free account
              </Link>
              <GuestButton label="Browse as guest" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const state = loadState(viewer.kind === "user" ? viewer.user.id : "");
  const round = currentRound(state);
  const report = finalReport(state);

  return (
    <div className="page">
      <div className="container lesson-wrap stack" style={{ gap: 18 }}>
        <div>
          <span className="eyebrow">Build with AI</span>
          <h1 style={{ margin: "8px 0 10px", fontSize: "clamp(1.8rem, 3.6vw, 2.6rem)" }}>
            Five decisions. One business.
          </h1>
          <p className="lede">
            Nothing here is random. Each round has a defensible answer, and the scoring reflects what
            actually compounds.
          </p>
        </div>
        <SimClient
          initial={state}
          round={round}
          allowedRounds={simRoundsAllowed(access)}
          totalRounds={ROUNDS.length}
          report={report}
        />
      </div>
    </div>
  );
}
