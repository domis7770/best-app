import Link from "next/link";
import { TotpForm, VerifyForm } from "../components/Forms";

export default async function VerifyDevicePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; dev?: string }>;
}) {
  const params = await searchParams;
  const totp = params.step === "totp";

  return (
    <div className="page">
      <div className="container">
        <div className="auth-wrap">
          <div className="card">
            <span className="eyebrow">{totp ? "Admin check" : "New device"}</span>
            <h2 style={{ margin: "8px 0 10px" }}>
              {totp ? "Enter your authenticator code" : "Check your other device"}
            </h2>
            <p className="small muted" style={{ marginBottom: 18 }}>
              {totp
                ? "This account has two-factor on. Codes change every 30 seconds."
                : "A 4-digit code was sent to your signed-in device. It expires in 10 minutes and stops working after 5 wrong tries."}
            </p>
            {totp ? <TotpForm /> : <VerifyForm devCode={params.dev} />}
          </div>
          <p className="small muted" style={{ textAlign: "center", marginTop: 14 }}>
            Nothing arrived? <Link href="/login">Start again</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
