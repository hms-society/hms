export type CaseTaskReminder = {
  id: string
  value: number
  unit: 'minutes' | 'hours' | 'days'
  sentAt?: Date
  createdAt: Date
}
