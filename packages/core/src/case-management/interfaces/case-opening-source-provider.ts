export interface CaseOpeningSourceProvider {
  findByIntakeId(intakeId: string): Promise<
    | {
        intakeId: string
        clientId: string
        assignedLawyerId?: string
      }
    | undefined
  >
}
