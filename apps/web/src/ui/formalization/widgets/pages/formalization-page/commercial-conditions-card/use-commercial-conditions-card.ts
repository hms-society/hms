import { useMemo, useState } from 'react'
import type {
  DynamicFormAnswer,
  DynamicFormAnswerValue,
  DynamicFormField,
} from '@hms/core/shared/domain'

export function useCommercialConditionsCard(
  fields: readonly DynamicFormField[],
  answers: Readonly<Record<string, DynamicFormAnswerValue>>,
) {
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const errors = useMemo(() => {
    const next = { ...serverErrors }
    for (const field of fields) {
      const value = answers[field.id]
      const condition = field.validation?.requiredWhen
      const dependency = condition
        ? fields.find((candidate) => candidate.key === condition.fieldKey)
        : undefined
      const required = condition
        ? dependency !== undefined && answers[dependency.id] === condition.equals
        : field.required
      const empty =
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      if (required && empty) next[`field:${field.id}`] = 'Preencha este campo.'
    }
    return next
  }, [answers, fields, serverErrors])

  function validate() {
    setServerErrors({})
    return Object.keys(errors).length === 0
  }

  function setIssues(issues: Readonly<Record<string, string>>) {
    setServerErrors(issues)
  }

  const answerList: readonly DynamicFormAnswer[] = Object.entries(answers).map(
    ([fieldId, value]) => ({ fieldId, value }),
  )
  const requiredFields = fields.filter((field) => isRequired(field, answers, fields))
  const answeredRequiredFieldsCount = requiredFields.filter((field) =>
    hasAnswer(answers[field.id]),
  ).length

  return {
    errors,
    answerList,
    completion: {
      answeredCount: answeredRequiredFieldsCount,
      requiredCount: requiredFields.length,
    },
    validate,
    setIssues,
  }
}

function isRequired(
  field: DynamicFormField,
  answers: Readonly<Record<string, DynamicFormAnswerValue>>,
  fields?: readonly DynamicFormField[],
) {
  const condition = field.validation?.requiredWhen
  const dependency = condition
    ? fields?.find((candidate) => candidate.key === condition.fieldKey)
    : undefined
  return condition
    ? dependency !== undefined && answers[dependency.id] === condition.equals
    : field.required
}

function hasAnswer(value: DynamicFormAnswerValue | undefined) {
  return (
    value !== null &&
    value !== undefined &&
    value !== '' &&
    (!Array.isArray(value) || value.length > 0)
  )
}
