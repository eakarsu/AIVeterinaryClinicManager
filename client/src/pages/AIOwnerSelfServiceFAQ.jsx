import React from 'react';
import SimpleAIPage from './SimpleAIPage.jsx';
import { api } from '../services/api.js';

export default function AIOwnerSelfServiceFAQ() {
  return (
    <SimpleAIPage
      title="AI Owner Self-Service FAQ"
      description="Generates a vetted, escalation-aware response for owner-portal questions. AI ALWAYS escalates serious symptoms to a vet."
      apiMethod={api.aiOwnerSelfServiceFAQ}
      fields={[
        { name: 'question', label: 'Owner Question', required: true, placeholder: 'e.g. My dog has been vomiting since this morning, should I worry?' },
        { name: 'patient_context', label: 'Patient Context (JSON)', type: 'json', rows: 4, placeholder: '{"species":"dog","age":"5y","conditions":["IBD"]}' },
        { name: 'clinic_policies', label: 'Clinic Policies', placeholder: 'standard' },
      ]}
    />
  );
}
