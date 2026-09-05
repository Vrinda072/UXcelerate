# Rescue Coordination — Mission Control for a Post-Earthquake Robot Fleet

A working prototype of a disaster-response command system for coordinating a fleet of rescue robots after
an earthquake, built for the UXcelerate challenge.

**Brief:** design an interface for coordinating rescue robots after an earthquake, where maps may be
incomplete, communication may be unreliable, and robots continuously discover survivors, blocked paths,
structural hazards, and new accessible routes.

## Design approach

The map is the interface, not a widget inside a dashboard. Everything else — fleet list, telemetry,
event feed — exists to help an operator act on what the map is showing, under three constraints that
mirror the brief directly:

1. **A real, recognizable map, not an abstract board.** The mission runs on real OpenStreetMap street
   tiles (pan and zoom like any map app). The street layout is always visible, since that part is known
   ahead of time; what a soft haze hides is *current status* — whether a road is actually clear right now.
2. **Confidence, not just coverage.** A cell goes unknown → scanned → verified: a robot's first pass
   flags a block as scanned (still hazy), and only a second physical pass — a robot actually standing
   there again — verifies it. The header's single "map confidence" number is the average of that, so it
   rises as ground truth firms up, not just as raw area gets touched.
3. **Stale data looks stale, and the fleet doesn't stop for it.** A robot's link is tracked separately
   from its task: ONLINE / DEGRADED / AUTONOMOUS, shown as a solid, dashed, or red ring. Losing contact
   doesn't freeze the robot — it switches to autonomous operation and keeps searching, exactly as the
   brief describes, with a growing dashed uncertainty ring around its last confirmed position rather than
   a frozen icon pretending the data is current. A toggleable communication-coverage layer shows the dead
   zones responsible.

**The mission has a beginning.** The fleet starts on standby; a "begin mission" action triggers the
seismic event — magnitude, a brief map shake, an immediate comms hit, instant quake damage discovered
around each unit — rather than the simulation just running from page load. A **survivor detection** is a
full triage card (confidence, condition, nearest unit, distance, one dispatch action) instead of a bare
toast, and dispatch deliberately prefers a *different* unit than the one that found the survivor, so
responding reads as fleet coordination rather than a robot rescuing itself. Once dispatched, a robot draws
a live route line that recalculates every tick — so it visibly bends around a road that turns out to be
blocked, instead of just teleporting there. A **REPLAY** mode with a scrubbable timeline sits alongside
LIVE for reviewing how a mission unfolded.

The simulated mission (robot movement, discoveries, comm dropouts, the quake itself) runs entirely
client-side as mock data standing in for a real fleet telemetry feed, projected onto real map
coordinates — see [`src/sim/engine.js`](src/sim/engine.js) for the simulation and
[`src/components/MapView.jsx`](src/components/MapView.jsx) for the map/fog/route rendering.

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

React + Vite + Tailwind CSS v4 + Leaflet (OpenStreetMap tiles). No backend — all fleet/mission state is
simulated in-browser.

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
