# AGENTS.md

Generalized rules distilled from past mistakes on this project. Keep each as broad as it can be
while still actionable — it should prevent a *class* of mistake, not one instance. When a new
mistake is corrected, add or generalize a rule here (see `CLAUDE.md` → "Learning from mistakes").

1. **Removing or renaming something isn't done until every dependent reference is updated.**
   When you drop/rename a field, column, type, route, or symbol, hunt down and fix everything
   that pointed at it — configs, templates, views/presets, generated artifacts, callers — then
   invalidate any caches. A dangling reference usually fails far from the change you made.

2. **Verify through the surface the user actually uses, not just the path you happened to touch.**
   Passing your own build/API check isn't proof. Exercise the real end-user / admin interface (or
   replay the exact requests it makes) to confirm the change works where it matters.

3. **When configuring a tool's feature programmatically, reproduce the complete structure its own
   UI would create.** Partial or one-sided config often saves and loads without error yet
   silently fails to render or function (e.g. a relation missing its reciprocal link). Compare
   against a known-good example built through the tool's UI.

4. **Find the real root cause before blaming a common scapegoat** (stale cache, flakiness,
   "eventual consistency"). Confirm the actual mechanism with direct evidence, then apply the
   matching fix — don't pattern-match to the easy explanation.

5. **Fix at the source, reproducibly.** When you repair live or generated state, also fix the
   script/config that produces it, so the problem can't return on the next run or a fresh setup.

6. **After several edits to one file, re-read it before building or committing** to catch
   half-applied or stray changes.

7. **A "catch-all" pattern often misses its boundary case — test the edges, especially the
   empty/root input.** Wildcards, globs, and route matchers frequently exclude the exact value
   you assume they cover (e.g. Vercel's `/:path*` does not match the bare root `/`; `/(.*)`
   does). Don't trust "this matches everything" — exercise the smallest and largest inputs.

8. **A config change only takes effect once it's deployed/reloaded — verify against the running
   target, not the edited file.** Editing `vercel.json` (or any config the server reads at build
   time) changes nothing until a new deploy ships it; the live surface keeps the old behavior.
   After pushing, wait for the deploy and re-test the real URL before concluding it works.

9. **A fire-and-forget outbound call can fail silently — confirm delivery at the destination,
   don't treat "nothing logged" as success.** Integrations keyed on a mutable external identifier
   (chat/channel/webhook/queue id, recipient address) break when that id changes, and a step that
   ignores the provider's non-2xx response hides the break. Read the provider's actual response
   (or check the destination) to confirm, and prefer surfacing failures over swallowing them.

10. **Shell metacharacters inside a double-quoted string are evaluated — quote literal text
    accordingly.** Backticks and `$(...)` in a double-quoted argument (e.g. `git commit -m "... `x` ..."`)
    trigger command substitution and silently drop/mangle the text; `$`, `!`, and `\` bite too.
    For literal multi-line content (commit messages, JSON bodies) use single quotes, a heredoc, or
    a `-F`/`--file` flag rather than embedding it in double quotes.

11. **A documented capability can be silently gated by an unrelated-seeming option — when it
    doesn't render/work as the docs imply, read the component's own source, don't keep tweaking
    inputs.** Docs describe what a feature *can* do ("options show text, icons, or both") without
    stating the condition that enables it. If a correctly-configured feature stays dark, find the
    actual conditional in the source/template before suspecting names, data, or cache (e.g.
    Directus renders a dropdown's per-choice icon only when `allowOther === false`). One read of
    the gating code beats a dozen blind config permutations.

12. **A rule scoped by document position or wildcard applies to every match, not just the case
    you wrote it for — prefer an explicit opt-in.** A global CSS rule keyed on structural position
    (`:last-child`, `nth-child`), a broad route glob, or a catch-all handler silently affects
    siblings/pages you never had in mind (e.g. `main > :last-child { flex: 1 0 auto }` stretches
    *every* page's last section, not just the one with the gap). Target the intent with an explicit
    class/exact path, and enumerate what else currently matches before shipping. (Companion to #7,
    which is the under-matching twin: catch-alls also *miss* their boundary case.)

13. **Decide whether to show something using the same data that supplies its content.** When an
    element's visibility is gated on field A but its value/link/behavior comes from field B, the
    two desync — it renders empty, or vanishes despite valid data in B (e.g. a contacts row gated
    on a handle field while its link came from a separate `social_*` URL). Derive the visibility
    condition from *every* source that can supply the output, and keep components fed by the same
    data consistent with each other.

14. **An error-fallback that is indistinguishable from a valid "empty" result makes downstream
    "empty ⇒ hide/skip" logic misfire on failure.** When a fetch/helper returns `[]`/`{}`/`null`
    both for "nothing there" and "request failed" (as `directus()` does), any caller that treats
    empty as "hide it" will blank the UI on a transient error. Distinguish the two, or make the
    empty branch degrade to a safe neutral state rather than nothing.

15. **When you verify a fix by measuring, measure the exact thing the user sees — a proxy can read
    as "fixed" while the real artifact is still broken.** Checking a stand-in (a flex *container*
    box edge instead of the visible child packed inside it by `justify-content`, a build log instead
    of the rendered pixels, an API 200 instead of the saved record) can report success that isn't
    there. Pin the measurement to the actual element/edge/state in question; for visual/layout work,
    drive a real browser (headless screenshot + DOM geometry) at the breakpoints that matter rather
    than reasoning about widths.

16. **Content that exceeds its container can't be centred — centring a too-wide group only relocates
    the overflow.** When a row of items is wider than the space, no flex/grid centring trick removes
    the collision; you must reduce the content (shorten/trim), widen the space (full-bleed instead of
    a capped container), or change *when* it shows (raise the breakpoint that swaps to a compact form).
    Measure total natural width vs. available width first, then pick one of those levers.
