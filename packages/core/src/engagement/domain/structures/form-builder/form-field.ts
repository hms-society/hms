import type { BooleanField } from './boolean-field'
import type { DateField } from './date-field'
import type { LongTextField } from './long-text-field'
import type { MultiSelectField } from './multi-select-field'
import type { NumberField } from './number-field'
import type { SelectField } from './select-field'
import type { TextField } from './text-field'

export type FormField =
  | TextField
  | LongTextField
  | NumberField
  | DateField
  | SelectField
  | MultiSelectField
  | BooleanField
