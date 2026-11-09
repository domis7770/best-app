"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { post, del, upload } from "@/lib/client";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong.";
}

/* ------------------------------------------------------------------ auth */

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "signup") {
        await post("/api/auth/signup", {
          email: form.get("email"),
          password: form.get("password"),
          displayName: form.get("displayName") || "Learner",
        });
        router.push("/learn");
        router.refresh();
        return;
      }
      const result = await post<{ status: string; devCode?: string }>("/api/auth/login", {
        email: form.get("email"),
        password: form.get("password"),
      });
      if (result.status === "verify_device") {
        const query = result.devCode ? `?dev=${encodeURIComponent(result.devCode)}` : "";
        router.push(`/verify-device${query}`);
      } else {
        router.push("/learn");
      }
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {error ? <div className="form-error">{error}</div> : null}
      {mode === "signup" ? (
        <div className="field">
          <label htmlFor="displayName">First name</label>
          <input id="displayName" name="displayName" autoComplete="given-name" maxLength={60} />
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="email">Gmail address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
          placeholder="you@gmail.com"
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={mode === "signup" ? 10 : 1}
          maxLength={200}
        />
      </div>
      <button className="btn btn-block" disabled={pending}>
        {pending ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
      <p className="small muted" style={{ marginTop: 12 }}>
        {mode === "signup"
          ? "At least 10 characters. A new device will need a 4-digit code."
          : "New devices need a 4-digit code before they can sign in."}
      </p>
    </form>
  );
}

export function VerifyForm({ devCode }: { devCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await post<{ status: string }>("/api/auth/verify-device", { code });
      if (result.status === "totp_required") {
        router.push("/verify-device?step=totp");
      } else {
        router.push("/learn");
      }
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? <div className="form-error">{error}</div> : null}
      {devCode ? (
        <>
          <div className="dev-code">{devCode}</div>
          <p className="small muted" style={{ marginBottom: 12 }}>
            Development only — this code would normally be read on your first device.
          </p>
        </>
      ) : null}
      <div className="field">
        <label htmlFor="code">4-digit code</label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          required
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
          style={{ letterSpacing: "0.5em", fontSize: "1.3rem", textAlign: "center" }}
        />
      </div>
      <button className="btn btn-block" disabled={pending || code.length !== 4}>
        {pending ? "Checking…" : "Verify device"}
      </button>
    </form>
  );
}

export function TotpForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await post("/api/auth/verify-totp", { code });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? <div className="form-error">{error}</div> : null}
      <div className="field">
        <label htmlFor="totp">Authenticator code</label>
        <input
          id="totp"
          name="totp"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          style={{ letterSpacing: "0.4em", fontSize: "1.3rem", textAlign: "center" }}
        />
      </div>
      <button className="btn btn-block" disabled={pending || code.length !== 6}>
        {pending ? "Checking…" : "Confirm and continue"}
      </button>
    </form>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        await post("/api/auth/logout");
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

/* --------------------------------------------------------------- billing */

export function UpgradeButton({
  plan,
  label,
  ghost = false,
}: {
  plan: "plus" | "pro";
  label: string;
  ghost?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        className={`btn btn-block ${ghost ? "btn-ghost" : ""}`}
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const result = await post<{ url?: string }>("/api/billing/checkout", { plan });
            if (result.url && result.url.startsWith("http")) {
              window.location.href = result.url;
              return;
            }
            router.push(result.url ?? "/account");
            router.refresh();
          } catch (err) {
            setError(errorMessage(err));
            setPending(false);
          }
        }}
      >
        {pending ? "Opening…" : label}
      </button>
      {error ? <div className="form-error" style={{ marginTop: 10 }}>{error}</div> : null}
    </>
  );
}

export function GuestButton({ label = "Try two lessons free" }: { label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      className="btn btn-ghost"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await post("/api/guest/start");
          router.push("/learn/foundations/fnd-1");
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Starting…" : label}
    </button>
  );
}

/* --------------------------------------------------------------- devices */

export function RevokeButton({ deviceId }: { deviceId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      className="btn btn-ghost btn-sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await del(`/api/devices/${deviceId}`);
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Revoking…" : "Revoke"}
    </button>
  );
}

/* ------------------------------------------------------------------- 2fa */

export function TotpSetup() {
  const router = useRouter();
  const [secret, setSecret] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    post<{ secret: string; uri: string }>("/api/admin/totp/setup")
      .then((result) => {
        setSecret(result.secret);
        setUri(result.uri);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  async function confirm(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await post("/api/admin/totp/confirm", { code });
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card">
      <h3>Turn on two-factor</h3>
      <p className="small muted" style={{ margin: "6px 0 14px" }}>
        Admins need an authenticator app before this area unlocks.
      </p>
      {error ? <div className="form-error">{error}</div> : null}
      {secret ? (
        <>
          <p className="small muted" style={{ marginBottom: 6 }}>
            Add this secret to your authenticator (or scan the URI):
          </p>
          <div className="secret">{secret}</div>
          <p className="small muted" style={{ margin: "10px 0", wordBreak: "break-all" }}>
            {uri}
          </p>
        </>
      ) : (
        <p className="small muted">Preparing a secret…</p>
      )}
      <form onSubmit={confirm} style={{ marginTop: 12 }}>
        <div className="field">
          <label htmlFor="confirm">6-digit code from the app</label>
          <input
            id="confirm"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
        </div>
        <button className="btn" disabled={pending || code.length !== 6}>
          {pending ? "Confirming…" : "Confirm and enable"}
        </button>
      </form>
    </div>
  );
}

/* --------------------------------------------------------------- uploads */

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [uploaded, setUploaded] = useState<{ id: string; name: string } | null>(null);

  return (
    <div>
      {error ? <div className="form-error">{error}</div> : null}
      {uploaded ? (
        <div style={{ marginBottom: 12 }}>
          <p className="small muted">Uploaded privately: {uploaded.name}</p>
          <img className="thumb" src={`/api/uploads/${uploaded.id}`} alt="Your private upload" />
        </div>
      ) : null}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!file) return;
          setPending(true);
          setError(null);
          const form = new FormData();
          form.append("file", file);
          try {
            const result = await upload<{ id: string; name: string }>("/api/uploads", form);
            setUploaded(result);
            router.refresh();
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="field">
          <label htmlFor="file">Image (PNG, JPEG or WebP, max 2 MB)</label>
          <input
            id="file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>
        <button className="btn btn-ghost btn-sm" disabled={!file || pending}>
          {pending ? "Uploading…" : "Upload"}
        </button>
      </form>
    </div>
  );
}
