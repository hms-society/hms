---
name: grilling
description: Relentlessly stress-test a plan, decision, or idea through fact-finding and round-based design-tree questions before any contract or delivery artifact is created or changed.
---

# Grill a Decision

Use this protocol when a workflow must stress-test a plan, decision, or idea before
creating or changing an issue, PRD, Spec, Plan, or other contract artifact.

Interview the user until there is shared understanding. Model the decision as a design tree:
each decision branches into the decisions that depend on it.

## Fact-finding

Facts are the Orchestrator's responsibility. Inspect the repository, connected systems,
authorities, tools, and existing artifacts; dispatch bounded read-only research when useful.
Never ask the user for a fact that can be looked up. A running research task is an unsettled
prerequisite, so defer only questions that depend on its result and ask the rest of the current
frontier.

## Question rounds

Work in rounds. The frontier is every decision whose prerequisites are settled and that can be
answered without guessing at an unresolved decision. Recompute the frontier after every user
answer. Ask the whole frontier in one round; do not ask a downstream question while one of its
prerequisites is still open in the same round.

For each frontier question, provide the recommendation and use this exact format:

```md
❓ **Q1** - **<question title>**: <question body, including relevant choices and impact>

➡️ <recommended answer>

---

❓ **Q2** - **<question title>**: <question body, including relevant choices and impact>

➡️ <recommended answer>
```

Number questions within each round. Make each question decision-oriented, expose materially
different alternatives, and explain the effect on scope, ownership, behavior, validation, or
delivery risk. Do not hide decisions inside a draft artifact.

## Stop condition

Do not create, update, publish, or mutate the target artifact until the frontier is empty and
the user confirms that the shared understanding is complete. The session is complete only when
every branch of the design tree has been visited or explicitly ruled out; do not silently assume
unvisited decisions. Once confirmed, record the resolved decisions and accepted assumptions in
the target workflow's prescribed artifact section, not as an interview transcript.
