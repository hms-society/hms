import { useState } from 'react'
import { ClientsListPage } from '../client-page'
import { ConsultationTabs } from './consultation-tabs'
import { ConsultationDetails } from './consultation-details'
import { AttendanceForm } from './attendance-form'

export function ConsultationPage() {
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'form' | 'package'>('details')
  if (!selectedClient) {
    return (
      <ClientsListPage
        showAddButton={false} 
        onSelectClient={(clientData: any) => {
          setSelectedClient(clientData)
        }}
      />
    )
  }
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 font-sans">
      <ConsultationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'details' && (
        <ConsultationDetails
          client={selectedClient.client}
          intakeSource={selectedClient.intakeSource}
          demandContext={selectedClient.demandContext}
          onBack={() => setSelectedClient(null)} 
          onContinueForm={() => setActiveTab('form')}
        />
      )}

      {activeTab === 'form' && (
        <AttendanceForm onBack={() => setActiveTab('details')} />
      )}
    </div>
  )
}