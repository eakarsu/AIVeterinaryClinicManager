import React from 'react';
import SimpleAIPage from './SimpleAIPage.jsx';
import { api } from '../services/api.js';

export default function AIOutbreakDetection() {
  return (
    <SimpleAIPage
      title="AI Outbreak Detection"
      description="Decision-support: assess outbreak risk from recent case summaries. Final assessment requires a licensed vet."
      apiMethod={api.aiOutbreakDetection}
      fields={[
        { name: 'region', label: 'Region', placeholder: 'e.g. Northeast US' },
        { name: 'lookback_days', label: 'Lookback (days)', type: 'number', placeholder: '30' },
        {
          name: 'recent_cases',
          label: 'Recent Cases (paste text or JSON)',
          type: 'textarea',
          required: true,
          rows: 8,
          placeholder: 'e.g. 12 dogs presenting with persistent cough and fever in past 10 days; 3 cats with diarrhea after boarding.',
        },
      ]}
    />
  );
}
