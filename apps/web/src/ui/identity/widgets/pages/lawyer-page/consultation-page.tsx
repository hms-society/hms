import { useState } from 'react'
import { ConsultationTabs } from './consultation-tabs'
import { ConsultationDetails } from './consultation-details'
import { AttendanceForm } from './attendance-form'

export function ConsultationPage() {
  const [activeTab, setActiveTab] = useState<'details' | 'form' | 'package'>('details')

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8 font-sans">
      <ConsultationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'details' && (
        <ConsultationDetails
          onContinueForm={() => setActiveTab('form')}
        />
      )}

      {activeTab === 'form' && (
        <AttendanceForm onBack={() => setActiveTab('details')} />
      )}
    </div>
  )
}