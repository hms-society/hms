export function buildDocumentJsonOrganizationPrompt(extractedTextFull: string) {
  return `Organize this OCR text into JSON fields.

Return exactly this JSON shape:
{
  "confidence": 0.45,
  "extractedFields": [
    { "label": "field label", "value": "visible value", "confidence": 0.8 }
  ],
  "evidence": [
    { "field": "field label", "sourceText": "short visible snippet" }
  ]
}

Rules:
- Do not classify the document.
- Do not return documentTypeId or documentTypeLabel.
- Do not invent missing fields.
- Split compound OCR text into the clearest labeled fields.
- Keep labels in Portuguese when the OCR text is Portuguese.
- Return confidence between 0 and 1.
- Return JSON only.

OCR text:
${extractedTextFull}`
}
