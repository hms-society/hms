export interface DailyCountersRepository {
  incrementAndGet(context: string, date: string): Promise<number>
}