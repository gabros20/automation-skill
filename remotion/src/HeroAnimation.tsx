import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { themes, MONO, SANS, type ThemeName, type Theme } from "./theme";

// Hero: the through-line of `automation` — you cannot deploy a fix into someone else's system, and
// you cannot un-send. The naive "webhook deployed, done" claim is corrected into three distinct
// facts: an ack, a silence nothing notices, and a reconciliation loop that asks the vendor directly
// (I1); two tracks — your record and the vendor's authoritative state — drift apart silently when a
// delivery is dropped, because nothing failed loudly; the flagship image resolves that drift through
// a periodic reconciliation pass that diffs the ID set first and classifies every discrepancy into
// matched / within-tolerance / exception, never binary; the faceted router composes one primary job
// with at most one base surface, hosted iPaaS by default, plus the additive agentic overlay; three
// real filed GitHub issues show an agentic step fails by continuing unless someone bolts a
// deterministic ceiling onto it (I12); and a bidirectional handoff carries irreversible steps, the
// reconciliation loop, and credential health back to operate and quality, closing on the reason any
// of this matters: the fix has to reach a system you cannot deploy into.
// ~57s, loops (opens/closes empty).
//
// Pacing model (reader-first): every scene animates its content IN, then HOLDS fully still for a
// reading beat (~2.3-3.6s) before the container fades OUT. The fade-out begins at dur - hold, so each
// scene's dur = content-in-end + reading-hold + fade. Never let the next scene start before this one
// has been readable at rest.
//
// Scene map (30fps):
//   S1 correct    0-210       ack / silence / reconcile — the naive "deployed, done" claim, corrected
//   S2 drift      210-500     two tracks — your record vs the vendor's state — diverge silently
//   S3 flagship   500-840     THE centerpiece: the reconciliation sweep classifies matched/tolerance/exception
//   S4 route      840-1180    the faceted router: one job x one surface + additive agentic overlay
//   S5 continues  1180-1470   I12 — an agentic step fails by continuing: three filed issues, one merged fix
//   S6 handoff    1470-1710   you cannot deploy a fix into someone else's system, and you cannot un-send

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

function envelope(frame: number, dur: number, hold = 26) {
  const opIn = interpolate(frame, [0, hold], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const opOut = interpolate(frame, [dur - hold, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const y = interpolate(frame, [0, hold], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  return { opacity: Math.min(opIn, opOut), y };
}

const step = (frame: number, a: number, b: number, ease = false) =>
  interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease ? EASE : undefined });

const SceneTitle: React.FC<{ t: Theme; kicker: string; title: string; accent?: string }> = ({ t, kicker, title, accent }) => (
  <div style={{ textAlign: "center", marginBottom: 30 }}>
    <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600, fontSize: 17, color: accent ?? t.accent, marginBottom: 12 }}>
      {kicker}
    </div>
    <div style={{ fontFamily: MONO, fontSize: 38, color: t.ink, letterSpacing: "-0.02em" }}>{title}</div>
  </div>
);

// -- S1 . ack / silence / reconcile ------------------------------------------------
const ClaimLine: React.FC<{ t: Theme; text: string; frame: number; from: number; color?: string }> = ({ t, text, frame, from, color }) => {
  const chars = Math.floor(interpolate(frame, [from, from + 46], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const typed = text.slice(0, chars);
  const caretOn = Math.floor(frame / 8) % 2 === 0 && chars < text.length && frame > from;
  const op = step(frame, from - 4, from + 6);
  return (
    <div style={{ opacity: op, color: color ?? t.ink }}>
      {typed}
      <span style={{ opacity: caretOn ? 1 : 0, color: t.accent }}>▋</span>
    </div>
  );
};

const TermRow: React.FC<{ t: Theme; label: string; body: string; owner: string; appear: number; labelColor?: string }> = ({ t, label, body, owner, appear, labelColor }) => (
  <div style={{ opacity: appear, translate: `0 ${interpolate(appear, [0, 1], [10, 0])}px`, display: "grid", gridTemplateColumns: "110px 1fr 140px", gap: 16, alignItems: "center", padding: "10px 0", borderTop: `1px solid ${t.line}` }}>
    <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: labelColor ?? t.accent }}>{label}</div>
    <div style={{ fontFamily: SANS, fontSize: 14, color: t.ink, lineHeight: 1.4 }}>{body}</div>
    <div style={{ fontFamily: MONO, fontSize: 12.5, color: t.muted, textAlign: "right" }}>{owner}</div>
  </div>
);

const SceneCorrect: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur, 22);
  const r1 = step(frame, 96, 118, true);
  const r2 = step(frame, 112, 134, true);
  const r3 = step(frame, 128, 150, true);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, width: 1020 }}>
        <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600, fontSize: 16, color: t.muted, marginBottom: 20, textAlign: "center" }}>
          the family's through-line, clause two
        </div>
        <div style={{ background: t.codeBg, border: `1px solid ${t.line}`, borderRadius: 12, padding: "26px 32px", fontFamily: MONO, fontSize: 19, lineHeight: 2, color: t.ink }}>
          <ClaimLine t={t} text="✓ webhook handler deployed. done." frame={frame} from={8} color={t.good} />
          <ClaimLine t={t} text="does it know if the vendor's side has no record of this event at all?" frame={frame} from={64} />
        </div>
        <div style={{ marginTop: 22, background: t.panel, border: `1px solid ${t.line}`, borderRadius: 12, padding: "6px 20px" }}>
          <TermRow t={t} label="ack" body="an HTTP 200 tells you the vendor accepted the request — at that moment, nothing more" owner="your logs" appear={r1} />
          <TermRow t={t} label="silence" body="a webhook that never arrives leaves no trace at all — nothing failed loudly" owner="undetected" appear={r2} labelColor={t.bad} />
          <TermRow t={t} label="reconcile" body="ask the vendor directly, on a schedule, what it actually has" owner="automation ⭐" appear={r3} labelColor={t.good} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -- S2 . the drift, and why nothing noticed ---------------------------------------
const N_SLOTS = 6;
const GAP_SLOT = 3;
const TRACK_W = 860;
const slotX = (i: number) => (i / (N_SLOTS - 1)) * TRACK_W;

const Dot: React.FC<{ x: number; color: string; hollow?: boolean; appear: number }> = ({ x, color, hollow, appear }) => (
  <div
    style={{
      position: "absolute",
      left: x - 8,
      top: -8,
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: hollow ? "transparent" : color,
      border: `2px solid ${color}`,
      opacity: appear,
      scale: String(interpolate(appear, [0, 1], [0.4, 1])),
    }}
  />
);

const SceneDrift: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur);
  const headline = step(frame, 8, 32);
  const gapLabel = step(frame, 176, 206, true);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, display: "flex", flexDirection: "column", alignItems: "center", width: 1040 }}>
        <SceneTitle t={t} kicker="reconciliation . the flagship" title="the drift, and why nothing noticed" />
        <div style={{ opacity: headline, fontFamily: MONO, fontSize: 15, color: t.muted, marginBottom: 30, textAlign: "center" }}>
          six events fire on the vendor's side · one webhook never arrives
        </div>
        <div style={{ width: TRACK_W, position: "relative" }}>
          {/* vendor track */}
          <div style={{ position: "relative", height: 0 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: t.line }} />
            {Array.from({ length: N_SLOTS }).map((_, i) => {
              const ap = step(frame, 30 + i * 14, 52 + i * 14, true);
              return <Dot key={i} x={slotX(i)} color={t.good} appear={ap} />;
            })}
            <div style={{ position: "absolute", right: -108, top: -8, fontFamily: MONO, fontSize: 12.5, color: t.muted, opacity: step(frame, 100, 124) }}>vendor state</div>
          </div>

          <div style={{ height: 90 }} />

          {/* your record track */}
          <div style={{ position: "relative", height: 0 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: t.line }} />
            {Array.from({ length: N_SLOTS }).map((_, i) => {
              const isGap = i === GAP_SLOT;
              const ap = step(frame, 46 + i * 14, 68 + i * 14, true);
              return <Dot key={i} x={slotX(i)} color={isGap ? t.glyph : t.good} hollow={isGap} appear={ap} />;
            })}
            <div style={{ position: "absolute", right: -108, top: -8, fontFamily: MONO, fontSize: 12.5, color: t.muted, opacity: step(frame, 100, 124) }}>your record</div>
          </div>

          {/* gap bracket */}
          <div
            style={{
              position: "absolute",
              left: slotX(GAP_SLOT) - 34,
              top: -14,
              width: 68,
              height: 118,
              border: `1.5px dashed ${t.amber}`,
              borderRadius: 10,
              opacity: step(frame, 150, 176, true),
            }}
          />
        </div>
        <div style={{ marginTop: 40, opacity: gapLabel, textAlign: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 17, color: t.amber, fontWeight: 600 }}>nothing failed loudly.</div>
          <div style={{ fontFamily: SANS, fontSize: 14.5, color: t.muted, marginTop: 4 }}>there is nothing here to notice — until something asks the vendor directly.</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -- S3 . THE reconciliation sweep --------------------------------------------------
const TOL_SLOT = 2;

const Pill: React.FC<{ color: string; bg: string; label: string; sub: string; appear: number }> = ({ color, bg, label, sub, appear }) => (
  <div style={{ opacity: appear, translate: `0 ${interpolate(appear, [0, 1], [8, 0])}px`, border: `1px solid ${color}`, background: bg, borderRadius: 8, padding: "8px 14px", display: "flex", flexDirection: "column", gap: 2, minWidth: 168 }}>
    <div style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 700, color }}>{label}</div>
    <div style={{ fontFamily: SANS, fontSize: 11.5, color, opacity: 0.85 }}>{sub}</div>
  </div>
);

const SceneFlagship: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur, 24);
  const sweepX = interpolate(frame, [30, 210], [0, TRACK_W], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const sweepOn = frame > 26 && frame < 226;
  const passed = (i: number) => sweepX >= slotX(i) - 4;

  const classColor = (i: number) => {
    if (i === GAP_SLOT) return t.bad;
    if (i === TOL_SLOT) return t.amber;
    return t.good;
  };

  const legend = step(frame, 236, 262, true);
  const caption = step(frame, 236, 262, true);
  const recursion = step(frame, 268, 296, true);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, display: "flex", flexDirection: "column", alignItems: "center", width: 1060 }}>
        <SceneTitle t={t} kicker="I1 . reconcile against the vendor's own state" title="never binary — matched, tolerance, or exception" />
        <div style={{ width: TRACK_W, position: "relative", height: 24 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: t.line }} />
          {Array.from({ length: N_SLOTS }).map((_, i) => {
            const done = passed(i);
            const color = done ? classColor(i) : t.glyph;
            return <Dot key={i} x={slotX(i)} color={color} hollow={i === GAP_SLOT && !done} appear={1} />;
          })}
          {sweepOn && (
            <div
              style={{
                position: "absolute",
                left: sweepX - 1,
                top: -16,
                width: 2,
                height: 42,
                background: t.accent,
                boxShadow: `0 0 14px ${t.accent}`,
              }}
            />
          )}
          <div style={{ position: "absolute", left: sweepX - 44, top: 34, width: 88, textAlign: "center", fontFamily: MONO, fontSize: 11, color: t.accent, opacity: sweepOn ? 1 : 0 }}>
            ID-set diff →
          </div>
        </div>
        <div style={{ height: 22 }} />
        <div style={{ marginTop: 56, display: "flex", gap: 14, opacity: legend }}>
          <Pill color={t.good} bg={t.codeBg} label="matched" sub="auto-close" appear={legend} />
          <Pill color={t.amber} bg={t.amberBg} label="within-tolerance" sub="timing skew, expected" appear={legend} />
          <Pill color={t.bad} bg={t.codeBg} label="exception ⚠" sub="alert-first at n=1" appear={legend} />
        </div>
        <div style={{ marginTop: 20, fontFamily: SANS, fontSize: 13.5, color: t.muted, textAlign: "center", maxWidth: 760, opacity: caption }}>
          ID set first, cheap and decisive · tolerance-banded fields second, on IDs present in both ·
          full-field diff only on suspected drift
        </div>
        <div style={{ marginTop: 18, opacity: recursion, background: t.amberBg, border: `1px solid ${t.amber}`, borderRadius: 8, padding: "10px 18px", fontFamily: SANS, fontSize: 12.5, color: t.ink, maxWidth: 780, textAlign: "center" }}>
          <b style={{ color: t.amber }}>I6 — the recursion:</b> at n=1 there is no second person to reconcile against.
          Independence comes from the vendor's own state, the clock, or a rule committed to in advance — never a body that doesn't exist.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -- S4 . the faceted router --------------------------------------------------------
const Chip: React.FC<{ t: Theme; label: string; on?: boolean; star?: boolean; dim?: boolean; appear: number }> = ({ t, label, on, star, dim, appear }) => {
  const bg = star || on ? t.accent : dim ? "transparent" : t.codeBg;
  const border = dim ? t.dim : star || on ? t.accent : t.line;
  const color = star || on ? t.accentInk : dim ? t.dim : t.muted;
  return (
    <div style={{ opacity: appear, scale: String(interpolate(appear, [0, 1], [0.9, 1])), fontFamily: MONO, fontSize: 12.5, padding: "6px 12px", borderRadius: 8, background: bg, border: `1px solid ${border}`, color, fontWeight: star || on || dim ? 700 : 400, whiteSpace: "nowrap" }}>
      {label}
    </div>
  );
};

const RLane: React.FC<{ t: Theme; label: string; sub: string; children: React.ReactNode; appear: number }> = ({ t, label, sub, children, appear }) => (
  <div style={{ opacity: appear, display: "grid", gridTemplateColumns: "170px 1fr", gap: 18, alignItems: "center", marginTop: 16 }}>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700, fontSize: 12.5, color: t.muted }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.glyph, marginTop: 2 }}>{sub}</div>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{children}</div>
  </div>
);

const JOBS = ["reconciliation ⭐", "integration-reliability", "compensation-and-recovery", "credentials", "approval-and-authority", "trigger-design", "sync-semantics", "observability", "cost-and-quota", "platform-selection", "workflow-testing", "process-capture"];
const SURFACES = ["hosted iPaaS", "self-hosted engine", "code-first durable", "platform-native"];

const SceneRoute: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur, 24);
  const l1 = step(frame, 20, 40);
  const l2 = step(frame, 150, 170);
  const l3 = step(frame, 200, 220);
  const compose = step(frame, 244, 268, true);
  const readset = step(frame, 268, 292, true);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, width: 1040 }}>
        <SceneTitle t={t} kicker="SKILL.md is a router, not a script" title="one job × one surface + an overlay" />
        <RLane t={t} label="① primary job" sub="exactly one, of 12" appear={l1}>
          {JOBS.map((j, i) => {
            const ap = step(frame, 40 + i * 9, 58 + i * 9, true);
            return <Chip key={j} t={t} label={j} star={i === 0} appear={ap} />;
          })}
        </RLane>
        <RLane t={t} label="② base surface" sub="at most one, of 4" appear={l2}>
          {SURFACES.map((s, i) => {
            const ap = step(frame, 170 + i * 10, 190 + i * 10, true);
            return <Chip key={s} t={t} label={s} on={i === 0} appear={ap} />;
          })}
        </RLane>
        <RLane t={t} label="③ agentic overlay" sub="additive ⭐ — a model in the graph" appear={l3}>
          <Chip t={t} label="surface-agentic" dim appear={step(frame, 220, 240, true)} />
          <div style={{ opacity: step(frame, 224, 244, true), fontFamily: MONO, fontSize: 11.5, color: t.muted, border: `1px dashed ${t.line}`, borderRadius: 8, padding: "6px 12px" }}>
            off by default — stacks on only when a model decides or triggers
          </div>
        </RLane>
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 12, opacity: compose }}>
          <div style={{ flex: 1, height: 1, background: t.line }} />
          <div style={{ fontFamily: MONO, fontSize: 12.5, color: t.muted }}>compose →</div>
          <div style={{ flex: 1, height: 1, background: t.line }} />
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 10, opacity: readset, alignItems: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 13, color: t.accent, background: t.codeBg, border: `1px solid ${t.accent}`, borderRadius: 8, padding: "7px 14px" }}>reconciliation.md</div>
          <div style={{ fontFamily: MONO, fontSize: 13, color: t.accent, background: t.codeBg, border: `1px solid ${t.accent}`, borderRadius: 8, padding: "7px 14px" }}>surface-hosted-ipaas.md</div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: t.muted }}><b style={{ color: t.ink }}>2 of 18</b> loaded · read fully</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -- S5 . I12 — an agentic step fails by continuing ---------------------------------
const IssueRow: React.FC<{ t: Theme; tag: string; body: string; note: string; appear: number; ok?: boolean }> = ({ t, tag, body, note, appear, ok }) => (
  <div style={{ opacity: appear, translate: `0 ${interpolate(appear, [0, 1], [10, 0])}px`, display: "flex", gap: 14, alignItems: "flex-start", padding: "13px 0", borderTop: `1px solid ${t.line}` }}>
    <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: ok ? t.good : t.bad, width: 150, flex: "none" }}>{tag}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: SANS, fontSize: 13.5, color: t.ink, lineHeight: 1.4 }}>{body}</div>
      <div style={{ fontFamily: MONO, fontSize: 11.5, color: t.muted, marginTop: 3 }}>{note}</div>
    </div>
  </div>
);

const SceneContinues: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur);
  const headline = step(frame, 8, 30);
  const r1 = step(frame, 44, 66, true);
  const r2 = step(frame, 66, 88, true);
  const r3 = step(frame, 88, 110, true);
  const claim = step(frame, 150, 178, true);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, width: 980 }}>
        <SceneTitle t={t} kicker="agentic overlay . additive" title="an agentic step fails by continuing" />
        <div style={{ opacity: headline, fontFamily: MONO, fontSize: 13.5, color: t.muted, marginBottom: 6, textAlign: "center" }}>
          not vendor claims — filed issues and a merged fix
        </div>
        <div style={{ background: t.panel, border: `1px solid ${t.line}`, borderRadius: 12, padding: "4px 22px" }}>
          <IssueRow t={t} tag="langgraph #7417" body="a long tool call is silently re-executed from checkpoint on replay" note="the textbook duplicate, filed as a live open bug" appear={r1} />
          <IssueRow t={t} tag="autogen #7071" body={'"Termination condition evaluated to: True" — the stream keeps processing anyway'} note="not erroring — continuing after its own stop signal" appear={r2} />
          <IssueRow t={t} tag="CrewAI PR #6370" body="merged: hard ceiling of 500 on max_iter, 100-hop flow-router cap" note="CWE-770 / CWE-835 — the fix is itself a deterministic guardrail" appear={r3} ok />
        </div>
        <div style={{ marginTop: 22, fontFamily: SANS, fontSize: 14.5, color: t.ink, textAlign: "center", opacity: claim, lineHeight: 1.5 }}>
          it fails loudly only to the extent <span style={{ color: t.accent, fontWeight: 700 }}>someone bolted a deterministic ceiling onto it</span> — a spend cap, a step limit, a wall-clock deadline, a kill switch.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -- S6 . the handoff ----------------------------------------------------------------
const NextSkillCol: React.FC<{ t: Theme; label: string; body: string; appear: number }> = ({ t, label, body, appear }) => (
  <div style={{ opacity: appear, translate: `0 ${interpolate(appear, [0, 1], [10, 0])}px`, border: `1px solid ${t.line}`, background: t.panel, borderRadius: 10, padding: "13px 16px", width: 240 }}>
    <div style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 700, color: t.ink, marginBottom: 5 }}>{label}</div>
    <div style={{ fontFamily: SANS, fontSize: 12, color: t.muted, lineHeight: 1.45 }}>{body}</div>
  </div>
);

const SceneHandoff: React.FC<{ t: Theme; dur: number }> = ({ t, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, y } = envelope(frame, dur, 22);
  const build = step(frame, 16, 38);
  const arrow = step(frame, 60, 80);
  const cols = step(frame, 78, 100);
  const cap = step(frame, 156, 182, true);

  const yamlLines: [string, string][] = [
    ["irreversible_steps", ": order + compensation"],
    ["reconciliation_loop", ": exists, cadence"],
    ["credentials", ": vendor, expires"],
    ["human_gates", ": approvers, timeout"],
  ];

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ translate: `0 ${y}px`, display: "flex", flexDirection: "column", alignItems: "center", width: 1040 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ opacity: build, border: `1px solid ${t.accent}`, background: t.codeBg, borderRadius: 10, padding: "16px 20px", fontFamily: MONO, fontSize: 12, color: t.muted, width: 330 }}>
            <div style={{ color: t.accent, fontWeight: 700, marginBottom: 8 }}>automation builds</div>
            {yamlLines.map(([k, v], i) => {
              const op = step(frame, 32 + i * 9, 48 + i * 9);
              return (
                <div key={k} style={{ opacity: op, whiteSpace: "nowrap" }}>
                  <span style={{ color: t.accent }}>{k}</span><span style={{ color: t.ink }}>{v}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 30, color: t.accent, opacity: arrow }}>→</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, opacity: cols }}>
            <NextSkillCol t={t} label="operate" body="deploy and watch — plus the missing-heartbeat gap this skill leaves unfilled by default" appear={cols} />
            <NextSkillCol t={t} label="quality" body="independently verify every reliability claim — idempotent, reconciled, timed out" appear={cols} />
          </div>
        </div>
        <div style={{ marginTop: 30, fontFamily: MONO, fontSize: 18, color: t.ink, opacity: cap, textAlign: "center", maxWidth: 880 }}>
          you cannot deploy a fix into someone else's system, and <span style={{ color: t.accent }}>you cannot un-send</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// -- persistent chrome + master timeline ----------------------------------------
const BOUNDS = [210, 500, 840, 1180, 1470, 1710];
const LABELS = ["correct", "drift", "reconcile", "route", "continues", "handoff"];

const PhaseBar: React.FC<{ t: Theme; frame: number }> = ({ t, frame }) => {
  const active = Math.max(0, BOUNDS.findIndex((b) => frame < b));
  return (
    <div style={{ position: "absolute", bottom: 34, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 15 }}>
      {LABELS.map((l, i) => (
        <div key={l} style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === active ? t.accent : t.line, scale: String(i === active ? 1.3 : 1) }} />
          <div style={{ fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.09em", fontSize: 12, fontWeight: 600, color: i === active ? t.ink : t.muted, opacity: i === active ? 1 : 0.55 }}>{l}</div>
        </div>
      ))}
    </div>
  );
};

export const HeroAnimation: React.FC<{ theme: ThemeName }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = themes[theme];

  const intro = step(frame, 0, 14);
  const outro = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const master = Math.min(intro, outro);
  const glow = interpolate(Math.sin(frame / 90), [-1, 1], [0.5, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: t.bg, fontFamily: SANS }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 82% 16%, color-mix(in srgb, ${t.accent} 13%, transparent), transparent 44%), radial-gradient(circle at 8% 92%, color-mix(in srgb, ${t.dim} 10%, transparent), transparent 48%)`, opacity: glow }} />
      <AbsoluteFill style={{ opacity: master }}>
        <Sequence durationInFrames={210}><SceneCorrect t={t} dur={210} /></Sequence>
        <Sequence from={210} durationInFrames={290}><SceneDrift t={t} dur={290} /></Sequence>
        <Sequence from={500} durationInFrames={340}><SceneFlagship t={t} dur={340} /></Sequence>
        <Sequence from={840} durationInFrames={340}><SceneRoute t={t} dur={340} /></Sequence>
        <Sequence from={1180} durationInFrames={290}><SceneContinues t={t} dur={290} /></Sequence>
        <Sequence from={1470} durationInFrames={240}><SceneHandoff t={t} dur={240} /></Sequence>
        <PhaseBar t={t} frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
