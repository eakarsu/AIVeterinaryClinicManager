import React from 'react';
import SimpleAIPage from './SimpleAIPage.jsx';
import { api } from '../services/api.js';

export default function AILabResultInterpret() {
  return (
    <SimpleAIPage
      title="AI Lab Result Interpretation"
      description="Decision-support: paste lab results (CBC, chem panel, UA, etc.) for AI interpretation. Confirm with a licensed vet."
      apiMethod={api.aiLabResultInterpret}
      fields={[
        { name: 'species', label: 'Species', placeholder: 'dog' },
        { name: 'breed', label: 'Breed', placeholder: 'Labrador' },
        { name: 'age', label: 'Age', placeholder: '8y' },
        { name: 'weightKg', label: 'Weight (kg)', type: 'number', placeholder: '32' },
        { name: 'clinical_question', label: 'Clinical Question', placeholder: 'e.g. fever of unknown origin workup' },
        {
          name: 'lab_results',
          label: 'Lab Results (paste text or JSON)',
          type: 'textarea',
          required: true,
          rows: 8,
          placeholder: 'e.g. WBC 22.5 x10^9/L (high), Neut 18, Plt 145, ALT 220 IU/L, ALP 410, BUN 38, Cr 1.6 ...',
        },
      ]}
    />
  );
}
