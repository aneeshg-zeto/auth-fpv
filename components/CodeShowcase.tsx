"use client";

import { motion } from "framer-motion";

const code = `// 1. Add middleware (middleware.ts)
import { createWebAuthnMiddleware } from "next-webauthn";

export default createWebAuthnMiddleware();

// 2. Mount routes (app/api/auth/[...path]/route.ts)
import {
  createRegisterBeginHandler,
  createRegisterFinishHandler,
  createLoginBeginHandler,
  createLoginFinishHandler,
} from "next-webauthn";

const loginBegin = createLoginBeginHandler();
const loginFinish = createLoginFinishHandler();

export async function POST(req, { params }) {
  const { path } = await params;
  if (path[0] === "login/begin") return loginBegin(req);
  if (path[0] === "login/finish") return loginFinish(req);
}

// 3. Use the component (any page)
import { LoginForm } from "next-webauthn";

export default function LoginPage() {
  return <LoginForm onSuccessAction={() => router.push("/dashboard")} />;
}`;

export function CodeShowcase() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Three steps.{" "}
            <span className="gradient-text">Zero complexity.</span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            Middleware, routes, component. That&apos;s all it takes to add
            biometric authentication to your Next.js app.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="code-block max-w-3xl mx-auto shadow-2xl"
        >
          <div className="flex items-center gap-2 px-5 py-3 bg-zinc-900/80 border-b border-zinc-800/50">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="text-xs text-zinc-500 ml-3 font-mono">
              app/page.tsx
            </span>
          </div>
          <div className="p-5 text-sm leading-relaxed overflow-x-auto">
            {code.split("\n").map((line, i) => (
              <span key={i} className="code-line">
                {line.startsWith("//") ? (
                  <span className="text-zinc-600">{line}</span>
                ) : line.match(/^(import|export)/) ? (
                  <span>
                    <span className="text-purple-400">
                      {line.match(/^(import |export )/)?.[0]}
                    </span>
                    <span className="text-zinc-300">
                      {line.replace(/^(import |export )/, "")}
                    </span>
                  </span>
                ) : line.includes("createWebAuthnMiddleware") ||
                  line.includes("createLoginBeginHandler") ||
                  line.includes("createLoginFinishHandler") ||
                  line.includes("LoginForm") ? (
                  <span>
                    <span className="text-zinc-500">
                      {line.match(/^[\s]*/)?.[0]}
                    </span>
                    <span className="text-blue-400">
                      {line.match(/create\w+|LoginForm/)}
                    </span>
                    <span className="text-zinc-300">
                      {line.replace(/create\w+|LoginForm/, "")}
                    </span>
                  </span>
                ) : (
                  <span className="text-zinc-300">{line}</span>
                )}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <span className="text-zinc-400 text-sm">Install:</span>
            <code className="text-primary-300 font-mono text-sm bg-primary-500/10 px-3 py-1 rounded-md">
              npm install next-webauthn
            </code>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
