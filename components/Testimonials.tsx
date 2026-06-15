"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "We replaced our entire password auth flow with next-webauthn in under an hour. The biometric UX is so smooth our support tickets about forgotten passwords dropped to zero.",
    name: "Sarah Chen",
    role: "Lead Engineer, Fintech Corp",
    avatar: "SC",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    quote:
      "Finally, a WebAuthn package that doesn't require a PhD to configure. The middleware just works, and the SQLite-backed sessions mean no Redis or external DB needed.",
    name: "Marcus Johnson",
    role: "Full-Stack Developer, SaaS Co",
    avatar: "MJ",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    quote:
      "The privacy-first approach sold us. No browser storage, no tracking, no analytics. Just pure WebAuthn with sensible defaults. This is how auth should be done.",
    name: "Priya Patel",
    role: "CTO, PrivacyFirst Inc",
    avatar: "PP",
    gradient: "from-emerald-500 to-emerald-600",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-32 px-6 section-gradient">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Loved by <span className="gradient-text">developers</span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
            Teams around the world are shipping biometric auth faster than ever.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="testimonial-card rounded-2xl p-8 flex flex-col"
            >
              <svg className="w-8 h-8 text-zinc-600 mb-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
              </svg>
              <p className="text-zinc-300 text-sm leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 pt-6 border-t border-zinc-800/60 flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
