# ML Robotics Platform - Minimal Spec v2

## Overview

A platform to accelerate end-to-end robotics research and training. Four components:

1. **Projects** - A task you're trying to solve
2. **Experiments** - Approaches and refinements within a project
3. **Datasets** - Store and manage training data
4. **Model Trainer** - Run templated training jobs

Design principles:
- Virtual links everywhere (reference, don't copy)
- Metadata is mutable, raw data is immutable
- Agent-friendly primitives that compose into arbitrary workflows
- Projects are the shareable unit of progress

---

## Projects

The top-level container. One project = one task you're solving.

**What it stores:**
- Name (the task: "pour milk", "fold towel", "pick-and-place")
- Description (markdown - context about the task, success criteria, notes)
- Showcase videos (up to 5, curated from evals within the project)
- Created timestamp

**What it contains:**
- Multiple experiment trees (each tree is a different approach)
- Each root experiment = different method (Diffusion Policy, ACT, Pi-zero, etc.)
- Trees branch from there for refinements

**Key operations:**
- Create project
- Edit name/description
- Add/remove showcase videos (selected from evals in child experiments)
- Delete project (cascades to all experiments, iterations, assets)

**Structure:**
```
Project ("pour milk")
  ├── Experiment Tree: "Diffusion Policy"
  │     ├── Experiment: "baseline"
  │     │     └── Iterations [0, 1, 2]
  │     ├── Experiment: "more data" (parent: baseline)
  │     │     └── Iterations [0, 1]
  │     └── Experiment: "tuned lr" (parent: baseline)
  │           └── Iterations [0]
  │
  ├── Experiment Tree: "ACT"
  │     └── ...
  │
  └── Experiment Tree: "Pi-zero finetune"
        └── ...
```

---

## Experiments

An approach or refinement within a project.

**What it stores:**
- Name and description (markdown, can serve as agent context)
- Project ID (required - every experiment belongs to a project)
- Parent ID (null = root of a tree, non-null = child in tree)
- Forked-from ID (if forked from another experiment)
- Template ID and config (if created from a template)
- GitHub repo + commit hash
- Links to input datasets

**What it contains:**
- Iterations (the sequential attempts within this experiment)

**Key operations:**
- Create (as root in project, or nested under parent experiment)
- Edit name/description
- Link/unlink datasets
- Fork (creates new experiment with same links, can fork specific iteration)
- Delete (user chooses: this node only, or cascade to children)

**Forking:**
- Creates a new experiment node
- Copies description
- Links to same datasets (virtual, not copied)
- User picks which iteration to fork from
- Forked experiment starts with iteration 0
- Does not fork children

---

## Iterations

A single attempt within an experiment. The unit of "I trained a model."

**What it stores:**
- Index (0, 1, 2... sequential within experiment)
- Created timestamp
- Notes (optional, markdown)
- Input dataset IDs (which datasets this iteration trained on)
- Input asset IDs (e.g., checkpoint to initialize from - can be from other experiments)
- Config overrides (if experiment uses a template)
- Job ID (the training job that produced this, if any)
- Output asset IDs (checkpoints, configs produced)
- Output eval IDs (evals generated)

**Key operations:**
- Create iteration (manual or triggered by job completion)
- Edit notes
- Link inputs (datasets, assets)
- Link outputs (assets, evals - typically done by job)

**Provenance:**
- Eval → Iteration → Experiment → Project
- Can also trace: Eval → Job → Template

---

## Datasets

Structured storage for robot learning data.

**Schema:**
- LeRobot v2.1 as base
- Extended with platform metadata

**Storage model:**
```
dataset/
  chunks/
    chunk_0/   # original upload
    chunk_1/   # first append
    chunk_2/   # second append
  index.json   # episode metadata
```

**Episode metadata:**
- Episode ID
- Chunk ID (which chunk contains it)
- Created timestamp
- Total frames
- Start frame (for trimming, default 0)
- End frame (for trimming, default total_frames)
- Success/failure bool
- Soft-deleted flag

**Key operations:**
- Create dataset (upload folder structure, get presigned URLs, upload to R2)
- Append (creates new chunk, adds episodes to index)
- Trim episode (set start_frame/end_frame - metadata only, raw data untouched)
- Soft delete episodes (mark in index)
- Query episodes (filter by time range, success/failure)

**Evals:**
- Evals are datasets with provenance fields set:
  - `generated_by_experiment_id`
  - `generated_by_iteration_id`
  - `generated_by_job_id`
- Created by jobs, not uploaded by users
- Can be selected for project showcase videos

**Cleanup:**
- Soft delete is immediate
- Hard delete via periodic cron job (compacts chunks, removes soft-deleted episodes)

---

## Model Trainer

Run templated training jobs on managed compute.

**Templates:**
- Pre-defined training recipes (ACT, Diffusion Policy, etc.)
- Each template has a config schema and defaults
- Templates versioned internally (git commit)
- No custom user code for v1

**Jobs:**

A job is one execution of a template, producing one iteration.

What it tracks:
- Experiment ID and Iteration index (what it's producing)
- Template ID (pinned to internal version)
- Config (base from experiment + overrides from iteration)
- Input dataset IDs
- Input asset IDs (e.g., checkpoint to init from)
- GPU type
- Spot vs on-demand
- Status: queued → provisioning → running → completed/failed/cancelled
- Cost: estimated, current (live), final
- Output asset IDs (on success)
- Error message and logs URL (on failure)

**Execution:**
- User requests job → backend generates JWT → SkyPilot launches
- Job authenticates with JWT to pull data and push results
- Job sends heartbeat every few minutes (elapsed time, current epoch, metrics)
- On completion: creates assets, creates evals, links to iteration
- On failure: preserves logs, marks status

**Failure handling:**
- No heartbeat for 10 min → assume dead, kill, cleanup
- Spot preemption → attempt checkpoint save, mark failed
- OOM/crash → save logs, mark failed, cleanup resources
- Cron backstop: any "running" job >24h with no heartbeat → kill

**Cost:**
- Per-second billing
- Live cost tracking (updated via heartbeat)
- User has global spending limit
- Job stops gracefully if user hits limit
- Cron reconciliation against provider billing

**Parallel jobs:**
- Per-user concurrency limit
- FIFO queue if over limit

**Logs:**
- Websocket for live streaming during job
- Dump to R2 on completion for persistence

---

## Assets

Untyped blob storage for outputs.

**What it stores:**
- Name
- Experiment ID (belongs to)
- Iteration ID (produced by)
- Tags (e.g., "checkpoint", "config", "best", "final")
- Storage URL
- Created timestamp

**Key operations:**
- Upload (via presigned URL)
- Download (via presigned URL)
- Tag/untag
- Delete

**Linking:**
- Assets are always virtual links (by reference)
- Forking an experiment links to same assets, doesn't copy bytes
- Iterations can reference assets from any experiment as inputs

---

## What's Explicitly NOT in v1

- **Flows/Pipelines** - Agent or user orchestrates multi-step workflows
- **Custom training code** - Templates only
- **Resume from checkpoint** - Start new iteration with checkpoint as input instead
- **Metadata-only datasets** - Upload data or don't have a dataset
- **Per-job spending limits** - Global limit only
- **Multi-node distributed training** - Single machine jobs only
- **Explicit template versioning UI** - Internal git pinning is enough

---

## Data Model Summary

```
Project
  id
  name
  description
  showcase_video_ids [max 5]
  created_at

Experiment
  id
  project_id
  parent_id (null = root of tree)
  forked_from_id
  template_id
  template_config
  name
  description
  github_repo
  github_commit
  input_dataset_ids []
  created_at

Iteration
  id
  experiment_id
  index
  notes
  input_dataset_ids []
  input_asset_ids []
  config_overrides
  job_id
  output_asset_ids []
  output_eval_ids []
  created_at

Dataset
  id
  name
  description
  generated_by_experiment_id (null if uploaded)
  generated_by_iteration_id
  generated_by_job_id
  created_at
  
  Episodes []
    id
    chunk_id
    created_at
    total_frames
    start_frame
    end_frame
    success
    soft_deleted

Asset
  id
  experiment_id
  iteration_id
  name
  tags []
  storage_url
  created_at

Job
  id
  experiment_id
  iteration_index
  user_id
  template_id
  template_commit
  config
  input_dataset_ids []
  input_asset_ids []
  gpu_type
  spot
  status
  estimated_cost_usd
  current_cost_usd
  final_cost_usd
  started_at
  completed_at
  output_asset_ids []
  output_eval_ids []
  error_message
  logs_url

User
  id
  global_spend_limit_usd
  global_spend_current_usd

Template
  id
  name
  description
  config_schema
  default_config
  git_commit (internal)
```

---

## Relationships

```
User owns Projects
Project contains Experiments (multiple trees)
Experiment belongs to Project
Experiment has parent Experiment (tree within project)
Experiment contains Iterations
Experiment links to Datasets (inputs)
Experiment may use Template
Iteration links to Datasets (inputs for this iteration)
Iteration links to Assets (inputs, e.g., init checkpoint)
Iteration owns Assets (outputs)
Iteration owns Evals (output datasets)
Iteration has Job (what produced it)
Job uses Template
Job consumes Datasets and Assets
Job produces Assets and Evals
Dataset may have generation provenance (experiment, iteration, job)
Asset belongs to Experiment + Iteration
```

---

## UI Structure

**Left sidebar:**
- Projects (list)
- Datasets
- Model Trainer (jobs queue, history)
- Templates

**Project page:**
- Header: name, description
- Showcase: up to 5 curated eval videos
- Experiment trees: visual tree view of all approaches
- Click into experiment → see iterations, assets, evals

**Experiment page:**
- Header: name, description, template info
- Iterations: list/timeline view
- Each iteration shows: inputs, outputs, job status, evals
- Fork button, delete button

---

## Success Criteria

The platform works if a user (or agent) can:

1. Create a project for a task
2. Upload a dataset of demos
3. Create an experiment from a template
4. Run a training job (creates iteration 0)
5. Get a checkpoint back
6. Run eval, get videos
7. Add best video to project showcase
8. Create iteration 1 with more data or different config
9. Fork experiment to try different approach
10. See what worked, share project

Everything else is optimization.