import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff } from "lucide-react";

const SSO_ERRORS: Record<string, string> = {
  no_token: "SSO token missing. Please log in via NECTRA portal.",
  sso_not_configured: "SSO is not configured on this server.",
  invalid_token: "SSO token is invalid or expired. Please log in again via NECTRA.",
};

type LoginMode = "nectra" | "local";

export default function AdminLogin() {
  const [mode, setMode] = useState<LoginMode>("nectra");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoError = params.get("error");
    if (ssoError && SSO_ERRORS[ssoError]) {
      setError(SSO_ERRORS[ssoError]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = mode === "nectra"
        ? { email, password }
        : { username, password };
      await apiRequest("POST", "/api/admin/login", body);
      setLocation("/admin/dashboard");
    } catch (err: any) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading text-primary mb-2" data-testid="text-admin-title">
            Old Amsterdam
          </h1>
          <p className="text-white/60 font-body" data-testid="text-admin-subtitle">Admin Panel</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-md p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-md text-sm" data-testid="text-login-error">
              {error}
            </div>
          )}

          <div className="flex rounded-md overflow-hidden border border-white/10">
            <button
              type="button"
              onClick={() => { setMode("nectra"); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-body transition-colors ${
                mode === "nectra" ? "bg-primary text-black font-semibold" : "bg-white/5 text-white/50 hover:text-white/70"
              }`}
              data-testid="tab-nectra"
            >
              NECTRA Login
            </button>
            <button
              type="button"
              onClick={() => { setMode("local"); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-body transition-colors ${
                mode === "local" ? "bg-primary text-black font-semibold" : "bg-white/5 text-white/50 hover:text-white/70"
              }`}
              data-testid="tab-local"
            >
              Local Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "nectra" ? (
              <div>
                <label htmlFor="email" className="block text-sm text-white/70 mb-2 font-body">NECTRA Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nectrafood.com"
                  className="w-full bg-white/5 border border-white/20 rounded-md px-4 py-3 text-white font-body focus:border-primary focus:outline-none placeholder:text-white/20"
                  data-testid="input-email"
                  required
                />
              </div>
            ) : (
              <div>
                <label htmlFor="username" className="block text-sm text-white/70 mb-2 font-body">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-md px-4 py-3 text-white font-body focus:border-primary focus:outline-none"
                  data-testid="input-username"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm text-white/70 mb-2 font-body">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-md px-4 py-3 pr-12 text-white font-body focus:border-primary focus:outline-none"
                  data-testid="input-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-body font-semibold py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
              data-testid="button-login"
            >
              {loading ? "Logging in..." : mode === "nectra" ? "Sign in with NECTRA" : "Log In"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-6 font-body">
          oldamsterdam.ch Administration
        </p>
      </div>
    </div>
  );
}
