import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import "../styles/loginpage.css";
import { register } from "../utils/authAPI";

const emptyForm = { full_name: "", email: "", contact_number: "", password: "", confirmPassword: "" };

export default function RegisterPage() {
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        contact_number: form.contact_number.trim(),
        password: form.password,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
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
              Request access to the Casiguro
              <br />
              Transaction Management System.
            </p>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-container">
            {submitted ? (
              <div className="register-success">
                <CheckCircle2 className="register-success-icon" />
                <h1>Registration submitted</h1>
                <p>
                  Thanks, {form.full_name.trim().split(" ")[0]}. An administrator needs to approve your account before you can sign in.
                  Please check back later or contact your administrator.
                </p>
                <Link to="/login" className="sign-in-button register-link-button">Back to sign in</Link>
              </div>
            ) : (
              <>
                <div className="login-heading register-heading">
                  <h1>
                    Create an <span>Account</span>
                  </h1>
                  <p>New accounts are reviewed by an administrator before they can sign in.</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                  {error && <div className="form-error">{error}</div>}

                  <div className="form-group">
                    <label htmlFor="full_name">Full name</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><User /></span>
                      <input id="full_name" value={form.full_name} onChange={update("full_name")} placeholder="e.g. Juan Dela Cruz" autoComplete="name" required />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Mail /></span>
                        <input id="email" type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" autoComplete="email" required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="contact_number">Contact number</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Phone /></span>
                        <input id="contact_number" type="tel" value={form.contact_number} onChange={update("contact_number")} placeholder="0917 123 4567" autoComplete="tel" required />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Lock /></span>
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={update("password")}
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
                          value={form.confirmPassword}
                          onChange={update("confirmPassword")}
                          placeholder="Re-enter password"
                          autoComplete="new-password"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <p className="form-hint">Use at least 8 characters with a letter and a number.</p>

                  <button type="submit" className="sign-in-button" disabled={loading}>
                    {loading ? "Submitting..." : "Request account"}
                  </button>
                </form>

                <p className="auth-switch">
                  Already have an account? <Link to="/login">Sign in</Link>
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
