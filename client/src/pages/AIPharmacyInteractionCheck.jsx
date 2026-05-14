import React from 'react';
import SimpleAIPage from './SimpleAIPage.jsx';
import { api } from '../services/api.js';

export default function AIPharmacyInteractionCheck() {
  return (
    <SimpleAIPage
      title="AI Pharmacy Interaction Check"
      description="Decision-support: AI flags possible interactions, allergies, and species-specific risks. Final dosing must be confirmed by a licensed vet."
      apiMethod={api.aiPharmacyInteractionCheck}
      fields={[
        { name: 'species', label: 'Species', placeholder: 'cat' },
        { name: 'weightKg', label: 'Weight (kg)', type: 'number', placeholder: '4.5' },
        {
          name: 'medications',
          label: 'Medications (JSON array of strings)',
          type: 'json',
          required: true,
          rows: 4,
          placeholder: '["Enrofloxacin 5 mg/kg PO q24h","Meloxicam 0.05 mg/kg PO q24h","Cerenia 1 mg/kg SC"]',
        },
        { name: 'allergies', label: 'Allergies (CSV)', type: 'csv', placeholder: 'penicillin, sulfa' },
        { name: 'comorbidities', label: 'Comorbidities (CSV)', type: 'csv', placeholder: 'CKD, hyperthyroid' },
      ]}
    />
  );
}
