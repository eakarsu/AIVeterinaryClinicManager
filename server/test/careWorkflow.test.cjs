const test = require('node:test'); const assert = require('node:assert/strict'); const p = require('../domain/careWorkflow.cjs');
test('observation uncertainty is explicit', () => assert.throws(() => p.validateObservation({ subjectId: 'p' }), /uncertainty/));
test('missing fields are recorded', () => assert.equal(p.validateObservation({ subjectId: 'p', observedAt: '2026-01-01', source: 'owner', uncertainty: 'unknown', missingFields: [] }), true));
test('care state jump fails', () => assert.throws(() => p.transition({ status: 'intake', version: 1 }, 'plan_approved'), /invalid/));
test('clinical approval is independent', () => assert.throws(() => p.transition({ status: 'clinician_review', version: 1, authorId: 'c' }, 'plan_approved', { clinicianId: 'c', humanReviewed: true }), /independent/));
test('clinical fixture covers safeguards', () => assert.equal(p.validateClinicalEvaluation({ calibration: 1, contraindications: [], missingData: [], biasSlice: 'species', escalationExpected: true }), true));
test('notifications support dead letters', () => assert.equal(p.acceptNotification({ channel: 'email', idempotencyKey: 'k', status: 'dead_letter' }), true));
test('pet owner patient scope matches',()=>assert.equal(p.assertScope({tenantId:'t',patientId:'p'},{tenantId:'t',patientId:'p',role:'pet_owner'},['clinician']),true));
test('other patient is hidden',()=>assert.throws(()=>p.assertScope({tenantId:'t',patientId:'p'},{tenantId:'t',patientId:'x',role:'pet_owner'},['clinician']),/patient/));
