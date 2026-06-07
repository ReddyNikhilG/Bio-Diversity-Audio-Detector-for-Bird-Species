import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BirdSense — Hear every bird in the forest" },
      {
        name: "description",
        content:
          "Upload bird audio with overlapping calls. BirdSense separates the sources and identifies every species with a BirdNET + YAMNet + Perch ensemble.",
      },
      { property: "og:title", content: "BirdSense" },
      {
        property: "og:description",
        content: "Bioacoustic species detection powered by an AI ensemble on a Colab GPU.",
      },
    ],
  }),
  component: Landing,
});

const Section = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <section className="section" style={style}>
    {children}
  </section>
);

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const BIRD_PROFILES = [
  {
    name: "Common Nightingale",
    scientific: "Luscinia megarhynchos",
    confidence: "0.93",
    range: "2.0-7.5 kHz",
    image: "/nightingale.png",
    sparkline:
      "M 0 24 C 20 8, 30 28, 50 12 C 70 -4, 80 24, 100 8 C 120 -8, 130 32, 150 16 C 170 0, 180 28, 200 12 C 220 -4, 230 24, 256 8",
    habitat: "DECIDUOUS FOREST",
    status: "STANDBY",
  },
  {
    name: "Barred Owl",
    scientific: "Strix varia",
    confidence: "0.97",
    range: "0.5-4.0 kHz",
    image: "/barred_owl.png",
    sparkline: "M 0 16 C 40 4, 80 28, 120 16 C 160 4, 200 28, 256 16",
    habitat: "OLD-GROWTH FOREST",
    status: "STANDBY",
  },
  {
    name: "Northern Cardinal",
    scientific: "Cardinalis cardinalis",
    confidence: "0.91",
    range: "2.8-6.4 kHz",
    image: "/cardinal.png",
    sparkline:
      "M 0 28 L 12 4 L 24 28 L 36 4 L 48 28 L 60 4 L 72 28 L 84 4 L 96 28 L 108 4 L 120 28 L 132 4 L 144 28 L 156 4 L 168 28 L 180 4 L 192 28 L 204 4 L 216 28 L 228 4 L 240 28 L 256 4",
    habitat: "WOODLAND EDGES",
    status: "ISOLATED",
  },
  {
    name: "Great Horned Owl",
    scientific: "Bubo virginianus",
    confidence: "0.89",
    range: "0.3-3.5 kHz",
    image: "/great_horned_owl.png",
    sparkline: "M 0 20 C 30 8, 50 8, 80 20 C 110 32, 130 32, 160 20 C 190 8, 210 8, 256 20",
    habitat: "MIXED WOODLAND",
    status: "STANDBY",
  },
];

function Landing() {
  const [startIndex, setStartIndex] = useState(0);
  const handleNext = () => {
    setStartIndex((prev) => Math.min(prev + 1, BIRD_PROFILES.length - 1));
  };
  const handlePrev = () => {
    setStartIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div>
      {/* ── HERO ────────────────────────────────────────────────────── */}
      <Section>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            {/* Badge */}
            <div className="pill pill-accent" style={{ marginBottom: 32 }}>
              <span className="status-dot status-dot-ok anim-pulse" />
              GPU-Accelerated · BirdNET + YAMNet + Perch
            </div>

            {/* Headline */}
            <h1
              className="font-display"
              style={{
                fontWeight: 900,
                fontSize: "clamp(2.8rem, 8vw, 6rem)",
                lineHeight: 1.0,
                marginBottom: 28,
                maxWidth: 860,
              }}
            >
              Hear every bird
              <br />
              in the <span className="gradient-text">forest</span>.
            </h1>

            {/* Subtitle */}
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "1.18rem",
                lineHeight: 1.75,
                maxWidth: 560,
                marginBottom: 40,
              }}
            >
              Upload field audio with overlapping calls. We separate the sources and identify every
              species with a weighted neural ensemble running on a Colab GPU.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link to="/app" className="btn btn-primary btn-lg" style={{ textDecoration: "none" }}>
                🚀 Launch the analyzer
              </Link>
              <Link
                to="/about"
                className="btn btn-ghost"
                style={{ textDecoration: "none", padding: "13px 24px" }}
              >
                How it works ↓
              </Link>
            </div>

            {/* Floating stats row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 56 }}
            >
              {[
                { value: "6,000+", label: "Bird species" },
                { value: "3", label: "Neural models" },
                { value: "NMF", label: "Source separation" },
                { value: "GPU", label: "Colab backend" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 14,
                    padding: "12px 20px",
                    minWidth: 110,
                  }}
                >
                  <p
                    className="font-display"
                    style={{ fontWeight: 800, fontSize: "1.3rem", color: "var(--accent)" }}
                  >
                    {stat.value}
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: ".78rem", marginTop: 2 }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
        <ScrollHint />
      </Section>

      {/* ── PROBLEM ─────────────────────────────────────────────────── */}
      <Section
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(10,22,40,0.4) 50%, transparent)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
          <motion.div {...fadeUp}>
            <p className="label-overline" style={{ marginBottom: 18 }}>
              The challenge
            </p>
            <h2
              className="font-display"
              style={{
                fontWeight: 800,
                fontSize: "clamp(2rem, 5vw, 3.6rem)",
                marginBottom: 24,
                lineHeight: 1.08,
              }}
            >
              One forest. Dozens of species.
              <br />
              <span className="gradient-text">All singing at once.</span>
            </h2>
          </motion.div>
          <motion.p
            {...fadeUp}
            transition={{ delay: 0.12 }}
            style={{
              color: "var(--text-muted)",
              fontSize: "1.12rem",
              maxWidth: 640,
              lineHeight: 1.8,
            }}
          >
            Off-the-shelf classifiers collapse on overlapping calls. Single-stream inference picks
            the loudest bird and misses the rest. We solve that with{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              source separation first
            </span>
            , then ensemble inference — so every voice in the recording gets heard.
          </motion.p>
        </div>
      </Section>

      {/* ── PIPELINE ─────────────────────────────────────────────────── */}
      <Section>
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
          <motion.div {...fadeUp}>
            <p className="label-overline" style={{ marginBottom: 14 }}>
              The pipeline
            </p>
            <h2
              className="font-display"
              style={{
                fontWeight: 800,
                fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                marginBottom: 52,
                maxWidth: 680,
                lineHeight: 1.1,
              }}
            >
              Five stages from raw audio
              <br />
              to ranked species list.
            </h2>
          </motion.div>

          <div style={{ display: "grid", gap: 0 }}>
            {[
              {
                n: "01",
                label: "Preprocess",
                icon: "🔧",
                body: "Resample to 32 kHz mono, normalize, denoise. Reject silent / corrupted clips.",
              },
              {
                n: "02",
                label: "NMF separation",
                icon: "🎛️",
                body: "Non-negative matrix factorization splits the spectrogram into N source stems.",
              },
              {
                n: "03",
                label: "BirdNET (lead)",
                icon: "🐦",
                body: "Cornell's BirdNET runs per stem, with geographic + temporal filtering.",
              },
              {
                n: "04",
                label: "YAMNet + Perch",
                icon: "🎵",
                body: "YAMNet validates that the stem is bird-like; Google Perch provides peer review.",
              },
              {
                n: "05",
                label: "Temporal vote",
                icon: "🗳️",
                body: "Weighted ensemble + per-window voting produces the final ranked predictions.",
              },
            ].map((s, i) => (
              <div key={s.n} style={{ position: "relative" }}>
                {i < 4 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 44,
                      top: "100%",
                      width: 2,
                      height: 16,
                      background:
                        "linear-gradient(to bottom, rgba(30,215,96,0.4), rgba(30,215,96,0.08))",
                      zIndex: 1,
                    }}
                  />
                )}
                <motion.div
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="glass"
                  style={{
                    padding: "20px 28px",
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    borderRadius: 16,
                    marginBottom: i < 4 ? 0 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      flexShrink: 0,
                      background: "rgba(30,215,96,0.07)",
                      border: "1px solid rgba(30,215,96,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.4rem",
                    }}
                  >
                    {s.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      className="font-display"
                      style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 4 }}
                    >
                      {s.label}
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.6 }}>
                      {s.body}
                    </p>
                  </div>
                  <span
                    className="font-display gradient-text"
                    style={{
                      fontSize: "2rem",
                      fontWeight: 900,
                      minWidth: 50,
                      textAlign: "right",
                      opacity: 0.7,
                    }}
                  >
                    {s.n}
                  </span>
                </motion.div>
                {i < 4 && <div style={{ height: 16 }} />}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── MODELS ───────────────────────────────────────────────────── */}
      <Section>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 64,
              alignItems: "center",
            }}
          >
            {/* Left Column: Interactive/Realistic Hardware Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              style={{ position: "relative" }}
            >
              <div className="glass" style={{ overflow: "hidden", borderRadius: 24, padding: 12 }}>
                <img
                  src="/sensor.png"
                  alt="Bioacoustic sensor active in forest"
                  style={{
                    width: "100%",
                    height: 380,
                    objectFit: "cover",
                    borderRadius: 18,
                    display: "block",
                  }}
                />
                <div
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 14,
                    padding: "16px 20px",
                    marginTop: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span
                      className="status-dot status-dot-ok anim-pulse"
                      style={{ backgroundColor: "#1ed760", boxShadow: "0 0 10px #1ed760" }}
                    />
                    <span
                      className="font-display"
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: "var(--accent)",
                        letterSpacing: 1.5,
                      }}
                    >
                      SENSOR ACTIVE · FIELD STATION 7
                    </span>
                  </div>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    48.8566°N, 2.3522°E · 230m ASL · 32kHz
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Models & Verdict */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="label-overline" style={{ marginBottom: 12 }}>
                BIRD AI ENSEMBLE
              </p>
              <h2
                className="font-display"
                style={{
                  fontWeight: 800,
                  fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
                  lineHeight: 1.08,
                  marginBottom: 40,
                }}
              >
                Three models.
                <br />
                One <span style={{ color: "var(--accent)", fontStyle: "italic" }}>verdict</span>.
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  {
                    name: "BirdNET",
                    weight: "0.55",
                    role: "Lead classifier",
                    icon: "🐦",
                    color: "#1ed760",
                    body: "Cornell Lab's specialist bird model — 6,000+ species, geographic & temporal priors.",
                    hasIndicator: true,
                  },
                  {
                    name: "Perch",
                    weight: "0.25",
                    role: "Peer review",
                    icon: "🔬",
                    color: "#a3e635",
                    body: "Google Perch cross-checks predictions with a second specialist embedding.",
                    hasIndicator: false,
                  },
                  {
                    name: "YAMNet",
                    weight: "0.20",
                    role: "Audio gatekeeper",
                    icon: "🎵",
                    color: "#0ea5e9",
                    body: "Google's general audio model verifies stems actually contain bird vocalizations.",
                    hasIndicator: false,
                  },
                ].map((m) => (
                  <div
                    key={m.name}
                    className="glass"
                    style={{ padding: "20px 24px", borderRadius: 18 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: `${m.color}14`,
                            border: `1px solid ${m.color}30`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.1rem",
                          }}
                        >
                          {m.icon}
                        </div>
                        <div>
                          <h3
                            className="font-display"
                            style={{
                              fontWeight: 800,
                              fontSize: "1.1rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {m.name}
                            {m.hasIndicator && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  width: 14,
                                  height: 14,
                                  borderRadius: "50%",
                                  border: "1px solid rgba(255,255,255,0.2)",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <span
                                  style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: "50%",
                                    backgroundColor: "var(--accent)",
                                  }}
                                />
                              </span>
                            )}
                          </h3>
                          <p
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            {m.role}
                          </p>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontFamily: "var(--font-display)",
                          fontWeight: 800,
                          color: "var(--accent)",
                        }}
                      >
                        w = {m.weight}
                      </span>
                    </div>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.82rem",
                        lineHeight: 1.5,
                        marginBottom: 14,
                      }}
                    >
                      {m.body}
                    </p>
                    <div
                      className="conf-bar-track"
                      style={{ height: 4, background: "rgba(255,255,255,0.05)" }}
                    >
                      <div
                        className="conf-bar-fill"
                        style={{
                          height: "100%",
                          width: `${parseFloat(m.weight) * 100}%`,
                          background: m.color,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ── BIRD FREQUENCY PROFILES ─────────────────────────────────── */}
      <Section>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", position: "relative" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 40,
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <motion.div {...fadeUp}>
              <p className="label-overline" style={{ marginBottom: 12 }}>
                BIRD FREQUENCY PROFILES
              </p>
              <h2
                className="font-display"
                style={{
                  fontWeight: 800,
                  fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
                  lineHeight: 1.08,
                  margin: 0,
                }}
              >
                Every call has a{" "}
                <span style={{ color: "var(--accent)", fontStyle: "italic" }}>signature</span>.
                <br />
                We find it.
              </h2>
            </motion.div>

            {/* Carousel controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span
                style={{
                  display: "inline-flex",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    backgroundColor: "var(--accent)",
                  }}
                />
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={startIndex > 0 ? handlePrev : undefined}
                  className="btn btn-ghost"
                  style={{
                    width: 40,
                    height: 40,
                    padding: 0,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: startIndex === 0 ? 0.35 : 1,
                    cursor: startIndex === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  ←
                </button>
                <button
                  onClick={startIndex < BIRD_PROFILES.length - 1 ? handleNext : undefined}
                  className="btn btn-ghost"
                  style={{
                    width: 40,
                    height: 40,
                    padding: 0,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: startIndex === BIRD_PROFILES.length - 1 ? 0.35 : 1,
                    cursor: startIndex === BIRD_PROFILES.length - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Cards Container */}
          <div style={{ overflow: "hidden", padding: "10px 0", width: "100%" }}>
            <motion.div
              animate={{ x: -startIndex * 320 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              style={{ display: "flex", gap: 24 }}
            >
              {BIRD_PROFILES.map((bird) => (
                <div
                  key={bird.name}
                  className="species-card glass"
                  style={{
                    width: 296,
                    flexShrink: 0,
                    borderRadius: 20,
                    overflow: "hidden",
                  }}
                >
                  {/* Image Wrapper */}
                  <div style={{ position: "relative", height: 260 }}>
                    <img
                      src={bird.image}
                      alt={bird.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    {/* Frequency range badge */}
                    <span
                      style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        background: "rgba(0,0,0,0.6)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(6px)",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: "0.72rem",
                        fontFamily: "var(--font-display)",
                        fontWeight: 800,
                        color: "var(--accent)",
                      }}
                    >
                      {bird.range}
                    </span>
                  </div>

                  {/* Info Content */}
                  <div style={{ padding: 20 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 4,
                      }}
                    >
                      <h3
                        className="font-display"
                        style={{
                          fontWeight: 800,
                          fontSize: "1.15rem",
                          margin: 0,
                          color: "var(--text-primary)",
                        }}
                      >
                        {bird.name}
                      </h3>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 800,
                          fontSize: "1.05rem",
                          color: "var(--accent)",
                        }}
                      >
                        {bird.confidence}
                      </span>
                    </div>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.78rem",
                        fontStyle: "italic",
                        marginBottom: 20,
                      }}
                    >
                      {bird.scientific}
                    </p>

                    {/* Sparkline (frequency signature) */}
                    <div
                      style={{
                        marginBottom: 20,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <svg
                        width="100%"
                        height="32"
                        viewBox="0 0 256 32"
                        style={{ overflow: "visible" }}
                      >
                        <motion.path
                          d={bird.sparkline}
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="1.5"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </svg>
                    </div>

                    {/* Card Footer */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        paddingTop: 14,
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        letterSpacing: 0.8,
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>HABITAT · {bird.habitat}</span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          color: bird.status === "ISOLATED" ? "#fbbf24" : "var(--accent)",
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            backgroundColor:
                              bird.status === "ISOLATED" ? "#fbbf24" : "var(--accent)",
                          }}
                        />
                        {bird.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <Section style={{ minHeight: "70vh", justifyContent: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", width: "100%" }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "linear-gradient(135deg, rgba(30,215,96,0.15), rgba(30,215,96,0.05))",
                border: "1px solid rgba(30,215,96,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                margin: "0 auto 28px",
                boxShadow: "0 0 40px rgba(30,215,96,0.15)",
              }}
            >
              🌿
            </div>
            <h2
              className="font-display"
              style={{
                fontWeight: 900,
                fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
                marginBottom: 20,
                lineHeight: 1.05,
              }}
            >
              Spin up your Colab.
              <br />
              <span className="gradient-text">Hear the forest.</span>
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "1.08rem",
                marginBottom: 38,
                maxWidth: 500,
                marginInline: "auto",
                lineHeight: 1.75,
              }}
            >
              Plug in your tunnel URL, drop an audio file, and watch the pipeline run in real time.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/app" className="btn btn-primary btn-lg" style={{ textDecoration: "none" }}>
                Launch the analyzer →
              </Link>
              <Link
                to="/about"
                className="btn btn-ghost"
                style={{ textDecoration: "none", padding: "15px 26px" }}
              >
                Learn more
              </Link>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer
        style={{
          padding: "32px",
          textAlign: "center",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: "linear-gradient(135deg, #1ed760, #a3e635)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "#04140a",
              fontWeight: 900,
            }}
          >
            B
          </span>
          <span className="font-display" style={{ fontWeight: 700, fontSize: ".9rem" }}>
            BirdSense
          </span>
        </div>
        <p style={{ color: "var(--text-subtle)", fontSize: ".75rem" }}>
          Bioacoustic species detection · BirdNET + YAMNet + Perch ensemble ·{" "}
          {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

function ScrollHint() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        color: "var(--text-muted)",
        fontSize: ".72rem",
        letterSpacing: 2.5,
        textTransform: "uppercase",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        className="anim-float"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
      >
        <div
          style={{
            width: 1,
            height: 28,
            background: "linear-gradient(to bottom, transparent, var(--accent))",
            opacity: 0.5,
          }}
        />
        Scroll
      </div>
    </div>
  );
}
