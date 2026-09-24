export function buildDocumentJsonOrganizationPrompt(extractedTextFull: string) {
  return `Organize this OCR text into JSON fields.

Return exactly this JSON shape:
{
  "confidence": 0.45,
  "extractedFields": [
    { "label": "field label", "value": "visible value", "confidence": 0.8 }
  ],
  "evidence": [
    { "field": "field label", "sourceText": "exact source span with the label and complete value" }
  ]
}

Rules:
- Do not classify the document.
- Do not return documentTypeId or documentTypeLabel.
- Do not invent missing fields.
- Only extract a field when its label and its complete value are explicitly present in the OCR.
- Never split a value across adjacent fields or move words from one field into another.
- Keep each value complete; do not shorten, summarize, normalize, or complete it.
- Evidence must reproduce the exact source text, including the field label and the entire value.
- If the field boundary or complete value is ambiguous, omit that field and its evidence.
- Preserve line breaks and page boundaries as structural clues; do not merge nearby lines.
- Treat each OCR line formatted as "Label: Value" as a separate candidate field.
- Never use a document title or section heading as a field label for following content.
- A field value must stop before the next labeled field or section heading.
- If one value appears to contain another field label, omit it instead of returning a combined field.
- Keep labels in Portuguese when the OCR text is Portuguese.
- Return confidence between 0 and 1.
- Return JSON only.

OCR text:
${extractedTextFull}`
}
