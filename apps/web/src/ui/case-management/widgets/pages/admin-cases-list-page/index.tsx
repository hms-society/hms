import { CasesListPage } from '../cases-list-page'
import { useAdminCasesListPage } from './use-admin-cases-list-page'

export const AdminCasesListPage = () => <CasesListPage {...useAdminCasesListPage()} />
