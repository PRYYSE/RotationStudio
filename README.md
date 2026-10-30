# RotationStudio 1.0.0

**Public application:** https://pryyse.github.io/RotationStudio/ · [User guide](visualizer/README.md) · [Release record](visualizer/docs/RELEASE_1.0.0.md)

RotationStudio 1.0.0 is the first full software release of a browser-based 3D volleyball rotations and strategy editor. It supports six rotations, both serve owners, 48 authored cases, animated event playback, editable player positions/routes/coverage, local strategy saves, import/export, share links, printable references, Shuffle and the original Set arcs mode.

This repository remains an independent Apache-2.0 [dawsonpar/SetOptics](https://github.com/dawsonpar/SetOptics) adaptation. Original source, Set arcs, licence and attribution are preserved, without implying author endorsement.

**Software versus coaching:** the app is fully released at 1.0.0. The supplied team tactics remain **DRAFT** pending player/coach approval and real-court validation. Saved strategies are browser-local; export them before clearing site data or changing profiles.

---

# Upstream SetOptics information

Volleyball rally detection for any agent harness (Claude Code, Cursor, Codex,
Aider, plain Python). Point it at a video, get back the time ranges where the
ball is actually in play.

This repository is the open-source release of the rally-detection layer of
SetOptics. The hosted product (auth, billing, web UI) is closed-source; the
detection pipelines are here in full.

## 3D Visualizer

An interactive 3D tool for mapping setter distribution and hitter
tendencies on the court. Built to replace the pen-and-paper court
diagrams players and coaches scribble during matches.

Use it at **[setoptics.com/visualizer](https://setoptics.com/visualizer)**.
Source in [`visualizer/`](visualizer/); run it locally with
`cd visualizer && npm install && npm run dev`.

## What's in the box

| Mode | Method | Speed | Accuracy | Cost |
|------|--------|-------|----------|------|
| `signal` | Audio + optical flow heuristics | Fast | F1 ~47% | Free, fully local |
| `videomae` | VideoMAE V2 + MLP head | Medium | High segment recall | Free, fully local, needs trained weights |
| `ensemble` | Signal + VideoMAE (+ optional LLM) | Medium | F1 ~69-72% | Free unless LLM enabled |
| `llm` | Gemini 2.5 Flash, 3-stage sliding window | Slow | F1 ~94% | Free tier, then paid |

The annotation tools (`tools/annotation/`) are the same pipeline SetOptics
uses internally to build ground truth. They are useful even if you do not run
detection at all.

Research: how a small CPU-only TCN detector was built and evaluated, see
[`docs/tcn-rally-detection.md`](docs/tcn-rally-detection.md) (weights and data not released).

## Quickstart

```bash
git clone https://github.com/dawsonpar/SetOptics.git
cd SetOptics
./setup.sh                          # creates .venv, installs deps, prompts for GEMINI_API_KEY
source .venv/bin/activate

# 1. Detect rallies (writes JSON segments)
python scripts/signal_rally_detector.py \
    --video path/to/your/footage.mp4 \
    --output path/to/output.json

# 2. Export a rallies-only MP4 (skips the dead time)
python scripts/export_rallies.py \
    --segments path/to/output.json \
    --video path/to/your/footage.mp4 \
    --output path/to/footage_rallies.mp4
```

Step 1 produces a JSON file listing in-play segments by start/end
milliseconds. Step 2 turns that JSON into an MP4 containing only the
rallies, concatenated back to back, with the breaks cut out.

Want to drive this with an agent instead? See
[`docs/agent-quickstart.md`](docs/agent-quickstart.md) for a single prompt
you can paste into Claude Code / Codex / Cursor / Gemini.

## Annotating footage

Want to label rallies yourself or build ground-truth data? The repo ships a
desktop annotation tool. From a fresh clone:

```bash
cd tools/annotation-ui
npm run local
```

One command installs and launches it; annotate fully by hand (no Python or
API key) or start from an optional AI draft. See
[`tools/annotation-ui/README.md`](tools/annotation-ui/README.md) and
[`docs/annotation.md`](docs/annotation.md).

## Repository layout

```
setoptics/        Importable Python package
  ball_tracker.py            YOLO + BoT-SORT ball tracking
  gemini_rally_detector.py   3-stage Gemini rally pipeline
  gemini_pipeline.py         Clip extraction, timeline merge, IoU helpers
  rally_detector_base.py     Base class
  prompts.py                 Gemini prompt templates
scripts/          Standalone CLI entry points (research-grade)
  signal_rally_detector.py
  ensemble_rally_detector.py
  infer_rally_detector.py    VideoMAE inference (requires user-trained weights)
  signal_rally_evaluate.py
  ensemble_rally_evaluate.py
  export_rallies.py          JSON segments + video → rallies-only MP4
  train_volleyball_yolo.py
  validate_ball_tracking.py
tools/            Annotation and evaluation tooling
  annotation/                Ground-truth labeling (Gemini-driven)
  shared/eval/               Temporal F1, IoU, matching framework
  shared/providers/          LLM provider abstractions (Google only in OSS)
models/           Pretrained weights (YOLO ball detector ships in-repo)
docs/             User guides
```

## Modes in detail

### Signal-based detection
Pure heuristic, no model weights, fully local. Good baseline and useful as
one input to the ensemble. F1 hovers around 47% on indoor footage.

```bash
python scripts/signal_rally_detector.py \
    --video footage.mp4 --output segments.json
```

### Ensemble
Combines signal + VideoMAE (+ optional LLM) with learned fusion weights.
Default mode disables the LLM call. Enable with `--mode accurate` to add
Gemini, which gates the ensemble through an additional API call but
materially improves precision.

```bash
python scripts/ensemble_rally_detector.py \
    --video footage.mp4 --output segments.json --mode fast
```

### VideoMAE
The script (`scripts/infer_rally_detector.py`) ships, but the model weights
do not. Bring your own `rally_detector.pth`, or train one on your own
labeled data (see `docs/training.md`).

### LLM (Gemini) annotation
The highest-quality path. Used internally for ground-truth labeling.

```bash
python tools/annotation/annotate_sliding_window.py path/to/video.mp4
```

Writes `<video>_raw_annotations.json` next to the input video. Requires
`GEMINI_API_KEY`.

## Setup

See [`docs/setup.md`](docs/setup.md) for the long form. The short form:

1. Python 3.11+, `ffmpeg`, and `git` on your path.
2. `./setup.sh` creates a venv, installs locked deps, and prompts for your
   Gemini key.
3. Drop a video at any path and run one of the scripts above.

## Bring your own footage and data

Out of the box, you can run detection on any video. To evaluate a detector
against your own ground truth, see [`docs/annotation.md`](docs/annotation.md)
for the label format and Label Studio workflow.

Training data is not shipped. The YOLO ball-detector weights at
`models/volleyball_yolo26n.pt` are included and ready to use.

## Agent use

This repository is structured to be agent-friendly. Drop it into Claude Code,
Cursor, Codex, or any other harness, and the model can navigate it from
`AGENTS.md`. The conventions there are universal (no harness-specific
features).

## License

Apache 2.0. See [`LICENSE`](LICENSE).

## Trademark

"SetOptics" and the SetOptics logo (the eye-with-volleyball-iris mark) are
trademarks of Dawson Par. The Apache 2.0 license covers the code in this
repository only; it does not grant permission to use the name or logo on
derivative products or services. Forks are welcome, but please rename your
project and remove or replace the logo if you distribute it as your own.

## Roadmap

- A native Claude Code skill that exposes detection as a single
  agent-callable tool. The first attempt did not generalize beyond the
  training set, so the work is paused until the eval dataset grows. Tracked
  as a GitHub issue.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). PRs welcome on detector
improvements, eval framework, and annotation UX. The hosted product layer
(auth, web UI, infra) lives elsewhere and is out of scope.

## Security

See [`SECURITY.md`](SECURITY.md) for vulnerability reporting.
