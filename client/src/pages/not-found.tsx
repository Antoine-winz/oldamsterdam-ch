import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      <div className="w-full max-w-md mx-4 p-8 bg-black border border-white/10 rounded-lg">
        <div className="flex mb-4 gap-3 items-center">
          <AlertCircle className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-heading font-bold text-white">404 Page Not Found</h1>
        </div>
        <p className="mt-4 text-base font-body text-white/70">
          The page you're looking for doesn't exist.
        </p>
      </div>
    </div>
  );
}
