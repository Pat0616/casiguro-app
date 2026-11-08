import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import "../styles/loginpage.css";
import { resetPassword, startPasswordReset } from "../utils/authAPI";

// Two steps: enter the email → enter the emailed code with a new password. Then back to sign in.
// The server answers the same whether or not the email has an account, so this page never says which.
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "reset">("email");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const sendCode = async () => {
    const res = await startPasswordReset(email.trim());
    setCode("");
    setNotice(`${res.message} It expires in ${res.expiresInMinutes} minutes. Check your inbox (and spam folder).`);
    setResendIn(res.resendAfterSeconds);
  };

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendCode();
      setStep("reset");
    } catch (err: any) {
      setError(err.message || "Couldn't send a code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await sendCode();
    } catch (err: any) {
      setError(err.message || "Couldn't send a new code.");
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword(email.trim(), code, password);
      navigate("/login", { replace: true, state: { notice: res.message } });
    } catch (err: any) {
      setError(err.message || "Couldn't reset the password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-brand-panel">
          <img src="TopBladeCasiguro.svg" alt="" className="casiguro-brandblade" />
          <img src="BottomDesignCasiguro.svg" alt="" className="casiguro-brandblade2" />
          <div className="brand-content">
            <div className="logo-container">
              <div className="casiguro-logo" />
            </div>
            <div className="brand-line">
              <span className="cyan"></span>
              <span className="pink"></span>
              <span className="yellow"></span>
              <span className="black"></span>
            </div>
            <p>
              Reset the password for your
              <br />
              Casiguro account.
            </p>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-container">
            {step === "reset" ? (
              <>
                <div className="login-heading register-heading">
                  <h1>
                    Choose a new <span>Password</span>
                  </h1>
                  <p>Enter the code we emailed to {email.trim()} and your new password.</p>
                </div>

                <form className="login-form" onSubmit={handleReset} noValidate>
                  {notice && <div className="form-notice">{notice}</div>}
                  {error && <div className="form-error">{error}</div>}

                  <div className="form-group">
                    <label htmlFor="code">Reset code</label>
                    <input
                      id="code"
                      className="verify-code-input"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      autoFocus
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="password">New password</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Lock /></span>
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          autoComplete="new-password"
                          required
                        />
                        <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
                          {showPassword ? <EyeOff /> : <Eye />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm password</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Lock /></span>
                        <input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          autoComplete="new-password"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <p className="form-hint">Use at least 8 characters with a letter and a number.</p>

                  <button type="submit" className="sign-in-button" disabled={loading || code.length !== 6}>
                    {loading ? "Saving..." : "Reset password"}
                  </button>

                  <div className="verify-actions">
                    <button type="button" className="text-button" onClick={() => { setStep("email"); setError(""); setNotice(""); }}>
                      ← Use a different email
                    </button>
                    <button type="button" className="text-button" onClick={handleResend} disabled={resendIn > 0}>
                      {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="login-heading register-heading">
                  <h1>
                    Forgot your <span>Password?</span>
                  </h1>
                  <p>Enter the email you sign in with. If it belongs to an active account, we'll email you a 6-digit code.</p>
                </div>

                <form className="login-form" onSubmit={handleSendCode} noValidate>
                  {error && <div className="form-error">{error}</div>}

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><Mail /></span>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="sign-in-button" disabled={loading || !email.trim()}>
                    {loading ? "Sending code..." : "Send code"}
                  </button>
                </form>

                <p className="auth-switch">
                  Remembered it? <Link to="/login">Sign in</Link>
                </p>
              </>
            )}

            <footer className="login-footer">© 2026 CASIGURO Enterprises Inc. All rights reserved.</footer>
          </div>
        </section>
      </div>
    </div>
  );
}
