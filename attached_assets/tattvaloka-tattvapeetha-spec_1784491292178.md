# Tattvaloka & Tattvapeetha — Working Specification

**Status:** This is the single real specification for Tattvaloka, Tattvapeetha, and the TMP→TRK identity journey. It supersedes the 12-Book Constitution, `canon/institutional-constitution.md`, and any other prior document where they conflict with what's written here. Nothing in this document is "frozen" or "permanent" — it changes when this file is deliberately edited, by the person who owns Tattvashila, after a real conversation. No new constitutional document, book, or canon file should be created instead of editing this one.

**Last updated:** 20 July 2026

---

## 1. What each thing is

- **Tattvaloka** — the participation layer. Where people post, respond, and are present with each other. Governed entirely by Section 2 below.
- **Tattvapeetha** — the growth layer. Structured learning content: paths made of modules made of units, with per-person progress tracking. Stands entirely on its own — it does not require Tattvaloka participation or membership to access.
- **TRK** — the verified, permanent identity every person or institution can earn. Governed by Section 3.
- **Raksha** and the **session-based correspondence messenger** — explicitly not being built yet. See Section 4.

---

## 2. Tattvaloka — the ten principles

1. **No algorithmic feed.** Chronological or topic-filtered only. Nothing ranks content by what keeps someone scrolling.
2. **No vanity metrics.** No public like-count, no follower-count as status, no "trending." A response requires an actual sentence, not a tap.
3. **Claims are labeled by the poster, on the post itself, unhideable** — Personal Claim / Sourced (with a link) / Question. Not buried in a description box.
4. **A public retraction ledger, not a score.** If a "Sourced" claim is later proven wrong, it's logged on the poster's profile — dated, factual, no number attached.
5. **No frictionless resharing.** Sharing requires adding your own line about why. No one-tap repost.
6. **Moderation is limited to illegality and genuine safety harm — never "this is wrong" or "I disagree."** The platform never rules on truth.
7. **Data minimalism everywhere**, not just in identity verification: collect only what's needed, discard the rest.
8. **Revenue never touches reach.** No ads, no pay-for-visibility. If Tattvashila ever needs money, it's patronage or membership that changes nothing about whose post anyone sees.
9. **Real exit rights.** Full data export, full deletion, no dark patterns to retain anyone.
10. **No DMs, no groups, no open messaging.** The only person-to-person contact mechanism is the Correspondence Request (below) — and even that hands off to email or, eventually, a bounded session messenger (Section 4), not an in-app inbox.

### Correspondence Request (in scope now)
- Any **TRK** member (not TMP — verified identity only) can send another TRK member a single, one-time request: a short stated reason plus one message.
- The recipient accepts (revealing a contact method, likely email) or declines. No thread inside the app, no read receipts, no typing indicators, no unread badge.
- A sensible rate limit applies (e.g. a handful of requests per week) to prevent spam/harassment at scale.
- Accept/decline is logged plainly and factually (dated), the same way the retraction ledger works — available if abuse ever needs investigating.

---

## 3. TMP → TRK identity journey

**Registration.** A person gives legal name, mobile number, email, and gender. The system issues a `TMP-XXXXXXXXXXXX` identity immediately, and sends a welcome mail with the TMP ID, the TRK path, and the constitutional principles.

**While TMP.** The person can explore and use Tattvaloka and Tattvapeetha freely. The UI reflects that the identity is provisional.

**Eligibility for TRK** is earned through **verified authenticity and time — not activity quotas.** No post-count requirement, no daily-streak requirement, no engagement quota. Given no current budget for paid document-verification services, and a global (not single-country) applicant base, the bar starts lighter and deepens later:
- Email verification
- Mobile verification (OTP)
- Live selfie with a liveness check (confirms a real, present person — not yet matched against a government document)
- Completed onboarding
- A fixed minimum waiting period as TMP (a matter of time passing, not days-active or posts-made)
- **Government ID verification is deferred** — to be added once it can be funded through a real verification vendor (or, for Indian users specifically, a low-cost route like DigiLocker/Aadhaar e-KYC). Public-facing copy (e.g. the Constitution page) should describe TRK's current bar accurately rather than implying document verification already happens.

**Verification data handling.** Nothing beyond email, mobile, and the live-selfie check is collected today. For de-duplication (one person, one identity), a one-way, encrypted reference derived from the selfie is kept — never the raw photo — used only to catch a second signup attempt. Once government ID verification is added, the same principle applies to it: verify, extract only what confirms authenticity and uniqueness, discard the raw document and photo.

**Issuance.** Once eligible, the system informs the person their Constitutional Identity has been approved and will be issued at midnight — then, at 00:00, TMP retires permanently and `TRK-XXXXXXXXXXXX` is issued: immutable, never reused, never purchasable, one per person or institution. A second mail confirms it. The UI transforms to reflect the new identity.

**Principle carried through everywhere:** a post is judged by what it is, not by whether its author is TMP or TRK. TRK marks verified, accountable identity — it is not a ranking, a privilege over content visibility, or a popularity signal.

---

## 4. Explicitly deferred — approved in principle, not being built

- **Raksha** (women's safety: SOS, safe-location/dark-zone mapping, volunteer network, self-defense training, AI assistant). Deferred until it can be developed and tested with real safety-sector experts and real, willing testers — never shipped to someone in real danger untested. Has never been tested with any real person as of this writing.
- **Session-based correspondence messenger** (Traksha-level, separate from Tattvaloka). Approved in principle: bounded sessions rather than a persistent inbox, either party can end a session, no alarms or countdown pressure, a calm notice instead. Still undecided: message retention policy after a session ends and who can access it under a legal request, and the exact quiet-notification behavior for an open session. Not started until TRK, Tattvaloka, and Tattvapeetha are complete.

---

## 5. Standing rule for any future agent session

Do not create any new constitutional document, book, canon file, or module unless explicitly asked for, in this exact conversation, by the person who owns Tattvashila. If something here is ambiguous, stop and ask rather than guessing or expanding scope. This document is edited, not replaced.
