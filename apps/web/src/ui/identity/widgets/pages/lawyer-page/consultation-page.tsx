import { useState } from 'react'
import { ConsultationTabs } from './consultation-tabs'
import { ConsultationDetails } from './consultation-details'
import { AttendanceForm } from './attendance-form/attendance-form'

export function ConsultationPage() {
  const [activeTab, setActiveTab] = useState<'details' | 'form' | 'package'>('details')
  const testConsultationId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 font-sans">
      <ConsultationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'details' && (
        <ConsultationDetails
          consultationId={testConsultationId}
          onContinueForm={() => setActiveTab('form')}
        />
      )}

      {activeTab === 'form' && (
        <AttendanceForm
          consultationId={testConsultationId}
          onBack={() => setActiveTab('details')}
        />
      )}
    </div>
  )
}