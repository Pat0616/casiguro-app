import { FormEvent, useState } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADIENT_TEXT } from "@/lib/constants";
import Field, { inputClass } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const dotStyle = { backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize: "18px 18px" };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6">
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl md:flex-row">
        {/* Left brand panel */}
        <div className="relative hidden w-full flex-col justify-center overflow-hidden border-b border-slate-100 px-10 py-16 md:flex md:w-1/2 md:border-b-0 md:border-r">
          <div className="pointer-events-none absolute inset-0" style={dotStyle} />
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-sky-500 opacity-30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-gradient-to-tr from-yellow-300 via-fuchsia-300 to-sky-300 opacity-30 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-xs text-center">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-sky-500">CASIGURO</h1>
            <p className="mt-1 text-lg font-bold tracking-widest text-slate-800">ENTERPRISES, INC.</p>
            <div className="mx-auto mt-5 flex h-1.5 w-24 overflow-hidden rounded-full">
              <span className="flex-1 bg-sky-500" />
              <span className="flex-1 bg-pink-600" />
              <span className="flex-1 bg-yellow-400" />
              <span className="flex-1 bg-slate-900" />
            </div>
            <p className="mt-6 text-sm text-slate-500">Your trusted partner for quality printing and customized solutions.</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="w-full px-6 py-10 sm:px-12 sm:py-14 md:w-1/2">
          <h2 className="font-display text-3xl font-extrabold text-slate-900">
            Welcome <span className={GRADIENT_TEXT}>Back!</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to continue to your account</p>

          <form className="mt-8 space-y-5" onSubmit={submit}>
            <Field label="Username / Email">
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className={cn(inputClass, "pl-10")} placeholder="Enter your username or email" defaultValue="admin@casiguro.ph" />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  className={cn(inputClass, "pl-10 pr-10")}
                  placeholder="Enter your password"
                  defaultValue="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-400" />
                Remember me
              </label>
              <a href="#" onClick={(e) => e.preventDefault()} className="font-semibold text-sky-600 hover:text-sky-700">
                Forgot Password?
              </a>
            </div>

            <Button type="submit" onClick={onLogin} className="w-full" size="lg">
              <Lock className="h-4 w-4" /> Sign In
            </Button>

            <p className="text-center text-xs text-slate-400">Prototype demo — click Sign In with any credentials.</p>
          </form>

          <p className="mt-10 text-center text-xs text-slate-400">© 2026 CASIGURO Enterprises Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
