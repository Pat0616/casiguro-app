import { FormEvent, useState } from "react";
import '../styles/loginpage.css';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const dotStyle = { backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize: "18px 18px" };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="login-page">
      <div className="login-shell">

      {/* LEFT BRANDING PANEL */}
      <section className="login-brand-panel">
         <img src="TopBladeCasiguro.svg" alt="CASIguro Printing Services" className="casiguro-brandblade" />
         <img src="BottomDesignCasiguro.svg" alt="CASIguro Printing Services" className="casiguro-brandblade2" />

        <div className="brand-content">

          <div className="logo-container">
            <div
              className="casiguro-logo"
            />
          </div>

         

          <div className="brand-line">
            <span className="cyan"></span>
            <span className="pink"></span>
            <span className="yellow"></span>
            <span className="black"></span>
          </div>

          <p>
            Your trusted partner for quality printing
            <br />
            and customized solutions.
          </p>

        </div>
      </section>


      {/* RIGHT LOGIN PANEL */}
      <section className="login-form-panel">

        <div className="login-container">

          <div className="login-heading">
            <h1>
              Welcome <span>Back!</span>
            </h1>

            <p>
              Sign in to continue to your account
            </p>
          </div>


          <form className="login-form">

            {/* USERNAME */}
            <div className="form-group">

              <label htmlFor="username">
                Username / Email
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
                  </svg>
                </span>

                <input
                  type="text"
                  id="username"
                  placeholder="Enter your username or email"
                />

              </div>

            </div>


            {/* PASSWORD */}
            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.5 10.5a2 2 0 0 0 3 3" />
                      <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 8.5 4 9.5 6a15.7 15.7 0 0 1-3.1 3.7" />
                      <path d="M6.6 6.6C4.5 8 3.3 9.7 2.5 10.5c1 2 4.5 6 9.5 6 1 0 2-.2 2.9-.5" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </button>

              </div>

            </div>


            {/* OPTIONS */}
            <div className="login-options">

              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-password"
              >
                Forgot Password?
              </button>

            </div>


            {/* SIGN IN */}
            <button
              type="submit"
              className="sign-in-button"
              onClick={onLogin}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2"
                />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>

              Sign In
            </button>

          </form>


          {/* DIVIDER */}
          <div className="divider">
            
          </div>


         


          <footer className="login-footer">
            © 2026 CASIGURO Enterprises Inc. All rights reserved.
          </footer>

        </div>

      </section>
      </div>
    </div>
  );
}
