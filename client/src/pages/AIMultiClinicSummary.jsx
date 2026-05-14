import React from 'react';
import SimpleAIPage from './SimpleAIPage.jsx';
import { api } from '../services/api.js';

export default function AIMultiClinicSummary() {
  return (
    <SimpleAIPage
      title="AI Multi-Clinic Summary"
      description="Roll up per-clinic stats into an executive summary. Multi-tenant data isolation is on the roadmap; this endpoint accepts caller-supplied stats."
      apiMethod={api.aiMultiClinicSummary}
      fields={[
        { name: 'period', label: 'Period', placeholder: 'last_quarter' },
        {
          name: 'clinic_stats',
          label: 'Clinic Stats (JSON array)',
          type: 'json',
          required: true,
          rows: 10,
          placeholder: '[{"name":"Downtown","visits":420,"revenue_usd":86500,"appointments_no_show":12},{"name":"Westside","visits":310,"revenue_usd":62000}]',
        },
      ]}
    />
  );
}
