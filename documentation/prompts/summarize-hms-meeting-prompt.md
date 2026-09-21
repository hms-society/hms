---
name: summarize-hms-meeting
description: Transform HMS meeting transcripts into concise, actionable summaries compatible with the Confluence Daily structure.
---

# Summarize an HMS Meeting

Transform an HMS meeting transcript into a reliable, clear, and actionable
summary. Write all content in Brazilian Portuguese (pt-BR), except for proper
names, product names, branches, commands, identifiers, technical terms, and
official titles that should remain unchanged.

## Input

Use the transcript and, when available:

- meeting title;
- date;
- participants provided in the metadata;
- context from previous meetings;
- links to Jira, Confluence, pull requests, or related documents.

If the transcript mentions participants who do not appear in the metadata,
list the names identified in the transcript and flag the discrepancy only when
it is relevant. Do not invent participants, owners, deadlines, decisions, or
requirements.

## Interpretation rules

- Separate confirmed facts, decisions, proposals, questions, and open items.
- Do not turn a hypothesis or suggestion into a decision.
- When the owner is unclear, use `[Responsável não identificado]`.
- When a statement is inaudible, truncated, or ambiguous, preserve only the
  meaning supported by context and flag the uncertainty when necessary.
- Consolidate repetitions, interruptions, greetings, and irrelevant content.
- Preserve module names, features, people, branches, tools, tickets, and domain
  terms.
- Describe actions with an infinitive verb, owner, and deadline only when the
  deadline was explicitly mentioned.
- Do not include credentials, tokens, unnecessary personal data, or sensitive
  content that is not required for the meeting record.
- If speakers disagree, record the conflict in `Details` or as an open item
  without choosing a version that lacks evidence.

## Required structure

Use the structure below. Keep the headings in pt-BR and omit a section only when
there is no reliable content to fill it.

```md
<day> <month> <year>

## Reunião em <day> de <month> de <year>

**Participantes:** <confirmed names or names identified in the transcript>.

### Resumo

<Short paragraph describing the purpose and main outcomes of the meeting in pt-BR.>

**<Main topic>**
<Objective summary of the topic.>

**<Another relevant topic>**
<Objective summary of the topic.>

### Decisões

**Alinhadas**

- <Confirmed decision stated objectively in pt-BR.>
- <Confirmed decision stated objectively in pt-BR.>

### Próximas etapas

- **[<Responsável>]** <Concrete action, with the deadline when confirmed>.
- **[<Responsável>]** <Concrete action, with the deadline when confirmed>.

### Detalhes

- <Relevant evidence, context, example, dependency, or caveat.>
- <Information that helps explain a decision or action.>
```

## Guidance for each section

### Summary

In a few sentences, present the purpose of the meeting, the central topics, and
the overall outcome. Then organize the topics into short blocks with bold
titles. Prioritize what changed, what was decided, and what needs to happen.

### Decisions

Include only decisions that were actually agreed by the participants. If the
meeting ended without a decision, state that explicitly and move the issue to
`Next steps` or `Details` as an open item.

### Next steps

Convert commitments into verifiable actions in pt-BR. Use this pattern:

```text
- [Responsável] Verbo no infinitivo + entrega esperada + prazo confirmado.
```

Do not assign an action to someone merely because they spoke about the topic.
When the group is responsible, use `[Equipe]`. When the responsibility cannot be
determined, use `[Responsável não identificado]`.

### Details

Record information that supports the summary: discussed examples, constraints,
dependencies, rationale, open questions, risks, technical context, and
disagreements. Do not repeat the summary in full.

## Confluence creation or update

Always produce the Markdown summary in pt-BR and publish it to Confluence. The
user's standing instruction authorizes this publication; do not wait for a
separate confirmation for each meeting.

When publishing the summary:

1. Consult the closest reference Daily page to confirm the current structure,
   space, and hierarchy.
2. Search for an existing page for the same date before creating a new one to
   avoid duplicates.
3. Use the title `Daily - DD-MM-YYYY`.
4. Preserve this instruction's structure and convert the content to a format
   accepted by Confluence.
5. Report the title and link of the created or updated page to the user.

If Confluence access is unavailable, report the publication blocker and still
return the Markdown summary. Do not create Jira tickets, pull requests,
commits, or code changes as an automatic consequence of the summary. Execute
those actions only when they are explicitly requested.

## Quality checklist

Before delivering the summary, confirm that:

- [ ] the language is pt-BR;
- [ ] the date and title match the meeting;
- [ ] participants were extracted without invention;
- [ ] the summary distinguishes decisions from discussions;
- [ ] every next step has an owner or is marked as unidentified;
- [ ] deadlines appear only when confirmed;
- [ ] technical names and identifiers were preserved;
- [ ] relevant questions and conflicts were retained;
- [ ] there are no unnecessary credentials or sensitive data;
- [ ] the summary was published to Confluence, or the publication blocker was
      reported;
- [ ] no Jira ticket, pull request, commit, or code change was created without
      explicit authorization.
