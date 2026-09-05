# Rescue Ops — Coordinating Robots After an Earthquake

A working prototype of a command-center interface for coordinating a fleet of rescue robots after an
earthquake, built for the UXcelerate challenge.

**Brief:** design an interface for coordinating rescue robots after an earthquake, where maps may be
incomplete, communication may be unreliable, and robots continuously discover survivors, blocked paths,
structural hazards, and new accessible routes.

## Design approach

The hard part of this brief isn't showing a map and a robot list — it's designing for an operator who
never has complete, current information. Three decisions follow from that:

1. **The map is drawn as knowledge, not terrain.** Cells are unmapped (fog), explored, blocked, or
   flagged as a hazard — and the boundary between explored and unmapped ("frontier") is highlighted, since
   that's where the next discovery will come from. Nothing is assumed passable until a robot has actually
   been there.
2. **Stale data looks stale.** A robot with full signal renders with a solid ring and a live position. Once
   its signal degrades, the ring goes dashed. Once contact is lost entirely, its last known position stays
   pinned to the map inside an *expanding* dashed circle — representing the operator's growing uncertainty
   about where it actually is — rather than quietly freezing the icon as if the data were still current.
3. **New information interrupts, but doesn't demand instant triage of everything.** A newly discovered
   survivor surfaces as a banner over the map that has to be dispatched or acknowledged; once handled it
   drops into a scrollable, filterable event log instead of disappearing. Blocked-path and hazard reports
   follow the same pattern at lower urgency, and a cleared route is logged as good news, not just a state
   flip.

The rest of the surface — fleet list, per-robot detail, manual waypoint override by clicking any explored
tile — exists to let an operator act on any of that the moment it matters, including routing a robot
manually when they don't trust the fleet's own pathing under unreliable comms.

The simulated mission (robot movement, discoveries, comm dropouts) runs entirely client-side as mock data
standing in for a real fleet telemetry feed — see [`src/sim/engine.js`](src/sim/engine.js).

## Running locally

```bash
npm install
npm run dev
```

> **Note:** if your checkout path contains a colon (`:`), `npm run dev` / `npm run build` will fail with
> `vite: command not found` — npm builds `PATH` by joining directories with `:`, and a colon in the path
> itself breaks that. Run `node node_modules/vite/bin/vite.js` directly instead, or check out the repo
> somewhere without a colon in the path.

## Tech stack

React + Vite + Tailwind CSS v4. No backend — all fleet/mission state is simulated in-browser.

---

## Submission instructions (from the challenge organizers)

Welcome! Follow the steps below to participate and submit your entry.

### How to Participate

1. **Fork this repository**
   Click the **Fork** button at the top right of this repo to create your own copy under your GitHub account.

2. **Build your submission**
   Work entirely within your forked repository. Design and build your UI/UX submission according to the challenge brief. Commit your work as you go so we can see your process.

3. **Deploy your project (optional)**
   If you'd like, deploy your project (e.g. Vercel, Netlify, GitHub Pages) and add the live link to your repo's README or description. This isn't mandatory, but it's a great way to showcase your work.

4. **Submit your forked repo**
   Once you're done, copy the link to your forked repository and submit it via the official submission form:

   👉 **[UXcelerate](https://docs.google.com/forms/d/e/1FAIpQLSdF-HbTXtL_Qk098nPxq8cwys_6ANyRC2fb8I2SQCcYy4XXuQ/viewform?usp=publish-editor)**

### Notes

- Make sure your forked repo is public so we can review it.
- Double-check your form submission includes the correct repo link before the deadline.
- Reach out to the IEI team if you run into any issues.

Good luck, and have fun building! 🎨
