import * as React from "react";

export interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      email: data.get("email") as string | null,
      password: data.get("password") as string | null,
    };
    // TODO: handle submission (call API, update state, etc.)

    console.log("Login payload:", payload);
  };

  return (
    <div className={className} {...props}>
      <h2 className="text-lg font-semibold mb-4">Sign in to your account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="Enter your password"
            className="w-full rounded-md border px-3 py-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Must be at least 8 characters.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-primary flex-1 px-4 py-2 rounded"
          >
            Sign In
          </button>
          <button type="reset" className="btn-outline px-4 py-2 rounded">
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
