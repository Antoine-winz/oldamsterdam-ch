import { useLocation } from "wouter";
import logoImg from "@assets/cropped-OA_WOORDMERK_WITTE_LETTERS_GOUDEN_SHADOW-600x86_1761328349218.png";

export default function NectraGateway() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <img
          src={logoImg}
          alt="Old Amsterdam"
          className="h-12 mx-auto mb-10 object-contain"
          data-testid="img-gateway-logo"
        />

        <h1 className="text-2xl font-heading text-primary mb-2" data-testid="text-gateway-title">
          Welcome
        </h1>
        <p className="text-white/60 font-body text-sm mb-10">
          Where would you like to go?
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => setLocation("/en/")}
            className="w-full px-6 py-4 bg-primary text-black font-heading text-lg rounded-md transition-opacity hover:opacity-90"
            data-testid="button-enter-website"
          >
            Enter Website
          </button>

          <button
            onClick={() => setLocation("/admin/dashboard")}
            className="w-full px-6 py-4 bg-white/10 border border-white/20 text-white font-heading text-lg rounded-md transition-colors hover:bg-white/15"
            data-testid="button-goto-admin"
          >
            Admin Dashboard
          </button>
        </div>

        <p className="text-white/30 font-body text-xs mt-8">
          oldamsterdam.ch
        </p>
      </div>
    </div>
  );
}
