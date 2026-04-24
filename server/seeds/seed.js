import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    // Drop tables
    await client.query(`
      DROP TABLE IF EXISTS visits CASCADE;
      DROP TABLE IF EXISTS vaccinations CASCADE;
      DROP TABLE IF EXISTS communications CASCADE;
      DROP TABLE IF EXISTS lab_results CASCADE;
      DROP TABLE IF EXISTS billing CASCADE;
      DROP TABLE IF EXISTS appointments CASCADE;
      DROP TABLE IF EXISTS diagnostics CASCADE;
      DROP TABLE IF EXISTS medications CASCADE;
      DROP TABLE IF EXISTS inventory CASCADE;
      DROP TABLE IF EXISTS patients CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create tables
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE patients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        species VARCHAR(100) NOT NULL,
        breed VARCHAR(100),
        age VARCHAR(50),
        weight DECIMAL(10,2),
        owner_name VARCHAR(255) NOT NULL,
        owner_phone VARCHAR(50),
        owner_email VARCHAR(255),
        medical_history TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE diagnostics (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        symptoms TEXT NOT NULL,
        species VARCHAR(100),
        diagnosis TEXT,
        treatment_plan TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE medications (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        dosage_unit VARCHAR(50),
        species_specific VARCHAR(255),
        contraindications TEXT,
        side_effects TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        vet_name VARCHAR(255),
        appointment_date DATE NOT NULL,
        appointment_time TIME,
        type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE billing (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        services JSONB,
        total_amount DECIMAL(10,2) NOT NULL,
        tax DECIMAL(10,2) DEFAULT 0,
        discount DECIMAL(10,2) DEFAULT 0,
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE inventory (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        quantity INTEGER DEFAULT 0,
        unit VARCHAR(50),
        unit_price DECIMAL(10,2),
        supplier VARCHAR(255),
        reorder_level INTEGER DEFAULT 10,
        expiry_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE lab_results (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        test_type VARCHAR(100),
        test_name VARCHAR(255) NOT NULL,
        results TEXT,
        reference_range TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        lab_name VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE communications (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        type VARCHAR(50),
        subject VARCHAR(255),
        message TEXT,
        recipient_email VARCHAR(255),
        recipient_phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE vaccinations (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        vaccine_name VARCHAR(255) NOT NULL,
        vaccine_type VARCHAR(100),
        batch_number VARCHAR(100),
        administered_date DATE,
        next_due_date DATE,
        administered_by VARCHAR(255),
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE visits (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        visit_date DATE NOT NULL,
        visit_type VARCHAR(100),
        reason TEXT,
        vet_name VARCHAR(255),
        weight_at_visit DECIMAL(10,2),
        temperature DECIMAL(5,2),
        heart_rate INTEGER,
        respiratory_rate INTEGER,
        examination_notes TEXT,
        treatment_provided TEXT,
        prescriptions TEXT,
        follow_up_date DATE,
        follow_up_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed users
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) VALUES
      ('admin@vetclinic.com', $1, 'Dr. Sarah Johnson', 'admin'),
      ('vet@vetclinic.com', $1, 'Dr. Michael Chen', 'veterinarian'),
      ('staff@vetclinic.com', $1, 'Emily Rodriguez', 'staff')
    `, [hashedPassword]);

    // Seed 16 patients
    await client.query(`
      INSERT INTO patients (name, species, breed, age, weight, owner_name, owner_phone, owner_email, medical_history) VALUES
      ('Buddy', 'Dog', 'Golden Retriever', '5 years', 32.5, 'John Smith', '555-0101', 'john@email.com', 'Annual vaccinations up to date. Hip dysplasia diagnosed at age 3.'),
      ('Whiskers', 'Cat', 'Siamese', '3 years', 4.2, 'Jane Doe', '555-0102', 'jane@email.com', 'Neutered. History of urinary tract infections.'),
      ('Max', 'Dog', 'German Shepherd', '7 years', 38.0, 'Robert Brown', '555-0103', 'robert@email.com', 'Arthritis in hind legs. On daily glucosamine supplements.'),
      ('Luna', 'Cat', 'Maine Coon', '2 years', 5.8, 'Maria Garcia', '555-0104', 'maria@email.com', 'All vaccinations current. Healthy weight.'),
      ('Charlie', 'Dog', 'Beagle', '4 years', 12.3, 'David Wilson', '555-0105', 'david@email.com', 'Allergies to certain grains. On hypoallergenic diet.'),
      ('Cleo', 'Cat', 'Persian', '6 years', 4.5, 'Susan Miller', '555-0106', 'susan@email.com', 'Chronic eye discharge. Regular eye cleaning required.'),
      ('Rocky', 'Dog', 'Rottweiler', '3 years', 45.0, 'James Taylor', '555-0107', 'james@email.com', 'Heart murmur grade 2. Annual echocardiogram recommended.'),
      ('Milo', 'Rabbit', 'Holland Lop', '2 years', 1.8, 'Lisa Anderson', '555-0108', 'lisa@email.com', 'Neutered. Dental check every 6 months.'),
      ('Bella', 'Dog', 'Labrador Retriever', '8 years', 29.0, 'Tom Harris', '555-0109', 'tom@email.com', 'Hypothyroidism. On levothyroxine daily.'),
      ('Oliver', 'Cat', 'British Shorthair', '4 years', 5.2, 'Karen White', '555-0110', 'karen@email.com', 'Overweight. On calorie-restricted diet.'),
      ('Daisy', 'Dog', 'Poodle', '6 years', 8.5, 'Chris Martin', '555-0111', 'chris@email.com', 'Luxating patella grade 1. Monitor for progression.'),
      ('Shadow', 'Cat', 'Russian Blue', '5 years', 4.0, 'Nancy Clark', '555-0112', 'nancy@email.com', 'Anxiety issues. On feliway diffuser therapy.'),
      ('Thor', 'Dog', 'Husky', '2 years', 25.0, 'Mike Johnson', '555-0113', 'mike@email.com', 'Zinc-responsive dermatosis. Zinc supplements daily.'),
      ('Tweety', 'Bird', 'Cockatiel', '3 years', 0.09, 'Amy Lee', '555-0114', 'amy@email.com', 'Wing clipped. Annual beak and nail trim.'),
      ('Scales', 'Reptile', 'Bearded Dragon', '4 years', 0.45, 'Brian Jones', '555-0115', 'brian@email.com', 'Previous metabolic bone disease. UVB lighting corrected.'),
      ('Nemo', 'Fish', 'Goldfish', '2 years', 0.03, 'Sarah Kim', '555-0116', 'sarah.k@email.com', 'Treated for fin rot 6 months ago. Fully recovered.')
    `);

    // Seed 16 diagnostics
    await client.query(`
      INSERT INTO diagnostics (patient_id, symptoms, species, diagnosis, treatment_plan, notes) VALUES
      (1, 'Limping on right hind leg, reluctance to jump', 'Dog', 'Hip dysplasia flare-up', 'NSAIDs for 2 weeks, restricted exercise, joint supplements', 'X-ray confirmed mild progression'),
      (2, 'Frequent urination, blood in urine, crying in litter box', 'Cat', 'Feline Lower Urinary Tract Disease (FLUTD)', 'Antibiotics 10 days, prescription urinary diet, increase water intake', 'Culture sent to lab'),
      (3, 'Excessive scratching, hair loss on flanks', 'Dog', 'Atopic dermatitis', 'Apoquel daily, medicated baths weekly, allergen testing recommended', 'Seasonal pattern noted'),
      (4, 'Sneezing, nasal discharge, decreased appetite', 'Cat', 'Upper respiratory infection', 'L-lysine supplement, steam therapy, monitor for 5 days', 'Likely viral origin'),
      (5, 'Vomiting after meals, diarrhea for 3 days', 'Dog', 'Dietary indiscretion / Food sensitivity', 'Bland diet for 5 days, probiotics, gradual food reintroduction', 'Fecal test negative for parasites'),
      (6, 'Watery eyes, pawing at face, squinting', 'Cat', 'Corneal ulcer', 'Antibiotic eye drops q6h, cone collar, recheck in 3 days', 'Fluorescein stain positive'),
      (7, 'Exercise intolerance, coughing after activity', 'Dog', 'Dilated cardiomyopathy progression', 'Pimobendan, enalapril, furosemide, restricted sodium diet', 'Echocardiogram scheduled'),
      (8, 'Head tilt, loss of balance, rolling', 'Rabbit', 'E. cuniculi infection', 'Fenbendazole 28 days, supportive care, assist feeding', 'Blood test confirms antibodies'),
      (9, 'Weight gain despite normal appetite, lethargy, skin changes', 'Dog', 'Hypothyroidism - dose adjustment needed', 'Increase levothyroxine to 0.1mg/kg BID, recheck T4 in 4 weeks', 'Current T4 below therapeutic range'),
      (10, 'Increased thirst, frequent urination, weight loss', 'Cat', 'Early stage diabetes mellitus', 'Insulin glargine 1U BID, prescription diabetic diet, glucose curve in 1 week', 'Fructosamine elevated'),
      (11, 'Intermittent skipping on right hind leg', 'Dog', 'Luxating patella - grade 2 progression', 'Weight management, joint supplements, surgical consultation recommended', 'Bilateral involvement now'),
      (12, 'Hiding, not eating, overgrooming belly', 'Cat', 'Psychogenic alopecia / Stress-related', 'Environmental enrichment, feliway multicat, gabapentin PRN', 'New cat in household triggering'),
      (13, 'Crusty nose, hair loss around eyes, itchy paws', 'Dog', 'Zinc-responsive dermatosis flare', 'Increase zinc sulfate dose, omega-3 fatty acids, topical zinc cream', 'Common in northern breeds'),
      (14, 'Fluffed feathers, decreased vocalization, drooping wing', 'Bird', 'Respiratory infection', 'Doxycycline oral drops, nebulization, warm environment', 'Chlamydia test pending'),
      (15, 'Lethargy, not eating, swollen joints', 'Reptile', 'Metabolic bone disease recurrence', 'Calcium glubionate oral, increase UVB exposure, diet correction', 'Insufficient supplementation'),
      (16, 'White spots on body, clamped fins, rubbing on objects', 'Fish', 'Ichthyophthirius (Ich)', 'Raise water temp to 86F, aquarium salt treatment, water changes daily', 'Treat entire tank')
    `);

    // Seed 16 medications
    await client.query(`
      INSERT INTO medications (name, category, dosage_unit, species_specific, contraindications, side_effects, notes) VALUES
      ('Carprofen (Rimadyl)', 'NSAID', 'mg/kg', 'Dogs', 'Not for cats, renal disease, liver disease', 'GI upset, liver toxicity, kidney damage', 'Give with food. Monitor liver values every 6 months.'),
      ('Amoxicillin-Clavulanate', 'Antibiotic', 'mg/kg', 'Dogs, Cats', 'Penicillin allergy', 'Diarrhea, vomiting, allergic reaction', 'Complete full course. Available in liquid and tablet.'),
      ('Metronidazole', 'Antibiotic/Antiprotozoal', 'mg/kg', 'Dogs, Cats', 'Liver disease, pregnancy', 'Neurological signs at high doses, nausea', 'Do not crush tablets. Bitter taste.'),
      ('Apoquel (Oclacitinib)', 'Anti-itch/Immunomodulator', 'mg', 'Dogs only', 'Under 12 months, serious infections', 'Increased susceptibility to infections, vomiting', 'Not for use in cats. Monitor CBC.'),
      ('Gabapentin', 'Analgesic/Anxiolytic', 'mg/kg', 'Dogs, Cats', 'Severe renal impairment', 'Sedation, ataxia', 'Great for chronic pain and anxiety. Dose varies by indication.'),
      ('Pimobendan (Vetmedin)', 'Cardiac', 'mg/kg', 'Dogs', 'Hypertrophic cardiomyopathy, aortic stenosis', 'Anorexia, diarrhea, lethargy', 'Give 1 hour before food. For congestive heart failure.'),
      ('Insulin Glargine (Lantus)', 'Hormone', 'IU', 'Cats, Dogs', 'Hypoglycemia', 'Hypoglycemia, injection site reactions', 'Store refrigerated. Preferred insulin for cats.'),
      ('Levothyroxine', 'Hormone', 'mcg/kg', 'Dogs', 'Untreated adrenal insufficiency', 'Restlessness, increased thirst if overdosed', 'Give on empty stomach. Recheck T4 in 4-6 weeks.'),
      ('Doxycycline', 'Antibiotic', 'mg/kg', 'Dogs, Cats, Birds', 'Pregnancy, young animals', 'Esophageal stricture in cats, nausea', 'Follow with water/food in cats. Broad spectrum.'),
      ('Furosemide (Lasix)', 'Diuretic', 'mg/kg', 'Dogs, Cats', 'Dehydration, electrolyte imbalance', 'Electrolyte loss, dehydration, ototoxicity', 'Monitor kidney values and electrolytes regularly.'),
      ('Fenbendazole (Panacur)', 'Antiparasitic', 'mg/kg', 'Dogs, Cats, Rabbits', 'None significant', 'Rare vomiting', 'Safe at recommended doses. Give with food for best absorption.'),
      ('Meloxicam', 'NSAID', 'mg/kg', 'Dogs, Cats (single dose)', 'Renal disease, dehydration, GI ulceration', 'GI upset, renal toxicity', 'One-time use only in cats. Oral or injectable.'),
      ('Clavamox Drops', 'Antibiotic', 'ml', 'Dogs, Cats', 'Penicillin allergy', 'Diarrhea, vomiting', 'Refrigerate after reconstitution. Palatable liquid.'),
      ('Cerenia (Maropitant)', 'Anti-emetic', 'mg/kg', 'Dogs, Cats', 'None significant', 'Pain at injection site, drooling', 'Can give for motion sickness. Injectable and oral.'),
      ('Prednisolone', 'Corticosteroid', 'mg/kg', 'Dogs, Cats', 'Systemic fungal infections, diabetes', 'PU/PD, weight gain, immunosuppression', 'Use prednisolone (not prednisone) in cats. Taper dose.'),
      ('Trazodone', 'Anxiolytic', 'mg/kg', 'Dogs', 'MAO inhibitor use, liver disease', 'Sedation, GI upset, serotonin syndrome', 'Great for situational anxiety. Can combine with gabapentin.')
    `);

    // Seed 16 appointments
    await client.query(`
      INSERT INTO appointments (patient_id, vet_name, appointment_date, appointment_time, type, status, notes) VALUES
      (1, 'Dr. Sarah Johnson', '2026-03-20', '09:00', 'Follow-up', 'scheduled', 'Hip dysplasia recheck. Review x-rays.'),
      (2, 'Dr. Michael Chen', '2026-03-20', '09:30', 'Recheck', 'scheduled', 'FLUTD follow-up. Repeat urinalysis.'),
      (3, 'Dr. Sarah Johnson', '2026-03-20', '10:00', 'Dermatology', 'scheduled', 'Allergen testing results review.'),
      (4, 'Dr. Michael Chen', '2026-03-20', '10:30', 'Sick Visit', 'scheduled', 'URI follow-up if not improved.'),
      (5, 'Dr. Sarah Johnson', '2026-03-21', '09:00', 'Wellness Exam', 'scheduled', 'Annual checkup and vaccinations.'),
      (6, 'Dr. Michael Chen', '2026-03-21', '09:30', 'Ophthalmology', 'scheduled', 'Corneal ulcer recheck. Fluorescein stain.'),
      (7, 'Dr. Sarah Johnson', '2026-03-21', '10:00', 'Cardiology', 'scheduled', 'Echocardiogram and medication review.'),
      (8, 'Dr. Michael Chen', '2026-03-21', '11:00', 'Neurology', 'scheduled', 'E. cuniculi treatment progress check.'),
      (9, 'Dr. Sarah Johnson', '2026-03-22', '09:00', 'Lab Recheck', 'scheduled', 'T4 level recheck after dose adjustment.'),
      (10, 'Dr. Michael Chen', '2026-03-22', '09:30', 'Glucose Curve', 'scheduled', 'Full day glucose monitoring.'),
      (11, 'Dr. Sarah Johnson', '2026-03-22', '14:00', 'Orthopedic Consult', 'scheduled', 'Surgical evaluation for patella.'),
      (12, 'Dr. Michael Chen', '2026-03-23', '09:00', 'Behavioral', 'scheduled', 'Follow-up on stress management plan.'),
      (13, 'Dr. Sarah Johnson', '2026-03-23', '10:00', 'Dermatology', 'scheduled', 'Zinc therapy progress evaluation.'),
      (14, 'Dr. Michael Chen', '2026-03-23', '11:00', 'Avian Exam', 'scheduled', 'Respiratory infection recheck.'),
      (15, 'Dr. Sarah Johnson', '2026-03-24', '09:00', 'Reptile Exam', 'scheduled', 'MBD follow-up, calcium levels.'),
      (1, 'Dr. Michael Chen', '2026-03-19', '14:00', 'Vaccination', 'completed', 'Annual DHPP booster administered.')
    `);

    // Seed 16 billing records
    await client.query(`
      INSERT INTO billing (patient_id, services, total_amount, tax, discount, payment_status, payment_method, notes) VALUES
      (1, '[{"service":"Office Visit","amount":65},{"service":"X-Ray (Hip)","amount":185},{"service":"Carprofen 30-day","amount":45}]', 295.00, 23.60, 0, 'paid', 'credit_card', 'Insurance claim submitted'),
      (2, '[{"service":"Office Visit","amount":65},{"service":"Urinalysis","amount":55},{"service":"Antibiotics","amount":35}]', 155.00, 12.40, 0, 'paid', 'debit_card', 'Paid in full at visit'),
      (3, '[{"service":"Dermatology Consult","amount":95},{"service":"Skin Scraping","amount":45},{"service":"Apoquel 30-day","amount":85}]', 225.00, 18.00, 10, 'paid', 'credit_card', 'Loyalty discount applied'),
      (4, '[{"service":"Sick Visit","amount":75},{"service":"L-Lysine Supplement","amount":22}]', 97.00, 7.76, 0, 'paid', 'cash', 'Quick visit'),
      (5, '[{"service":"Wellness Exam","amount":55},{"service":"DHPP Vaccine","amount":35},{"service":"Bordetella Vaccine","amount":28},{"service":"Fecal Test","amount":40}]', 158.00, 12.64, 0, 'pending', 'invoice', 'Invoice sent to owner'),
      (6, '[{"service":"Eye Exam","amount":85},{"service":"Fluorescein Stain","amount":25},{"service":"Antibiotic Eye Drops","amount":42}]', 152.00, 12.16, 0, 'paid', 'credit_card', NULL),
      (7, '[{"service":"Cardiology Consult","amount":150},{"service":"Echocardiogram","amount":350},{"service":"ECG","amount":95},{"service":"Medications","amount":120}]', 715.00, 57.20, 50, 'partial', 'payment_plan', 'Payment plan: 3 installments'),
      (8, '[{"service":"Exotic Pet Exam","amount":85},{"service":"Blood Panel","amount":125},{"service":"Fenbendazole 28-day","amount":38}]', 248.00, 19.84, 0, 'paid', 'credit_card', NULL),
      (9, '[{"service":"Office Visit","amount":65},{"service":"T4 Blood Test","amount":75},{"service":"Levothyroxine 60-day","amount":32}]', 172.00, 13.76, 0, 'paid', 'debit_card', NULL),
      (10, '[{"service":"Office Visit","amount":65},{"service":"Blood Glucose","amount":35},{"service":"Fructosamine Test","amount":55},{"service":"Insulin Starter Kit","amount":95}]', 250.00, 20.00, 0, 'pending', 'invoice', 'Will begin insulin therapy'),
      (11, '[{"service":"Orthopedic Consult","amount":120},{"service":"Knee X-Rays","amount":165},{"service":"Joint Supplements","amount":38}]', 323.00, 25.84, 15, 'paid', 'credit_card', 'Multi-pet discount'),
      (12, '[{"service":"Behavioral Consult","amount":110},{"service":"Gabapentin","amount":28},{"service":"Feliway Kit","amount":45}]', 183.00, 14.64, 0, 'paid', 'cash', NULL),
      (13, '[{"service":"Dermatology Recheck","amount":55},{"service":"Zinc Supplement 60-day","amount":42}]', 97.00, 7.76, 0, 'paid', 'debit_card', NULL),
      (14, '[{"service":"Avian Exam","amount":95},{"service":"Chlamydia Test","amount":65},{"service":"Doxycycline Drops","amount":35}]', 195.00, 15.60, 0, 'pending', 'invoice', 'Awaiting test results'),
      (15, '[{"service":"Reptile Exam","amount":95},{"service":"Calcium Blood Test","amount":55},{"service":"UVB Bulb","amount":45},{"service":"Calcium Supplement","amount":22}]', 217.00, 17.36, 0, 'paid', 'credit_card', NULL),
      (16, '[{"service":"Fish Consult","amount":45},{"service":"Water Test Kit","amount":25},{"service":"Ich Treatment","amount":18}]', 88.00, 7.04, 0, 'paid', 'cash', NULL)
    `);

    // Seed 16 inventory items
    await client.query(`
      INSERT INTO inventory (name, category, quantity, unit, unit_price, supplier, reorder_level, expiry_date, notes) VALUES
      ('Carprofen 75mg Tablets', 'Medications', 500, 'tablets', 1.25, 'VetPharm Supply Co.', 100, '2027-06-15', 'Most prescribed NSAID for dogs'),
      ('Amoxicillin 250mg Capsules', 'Medications', 300, 'capsules', 0.85, 'VetPharm Supply Co.', 50, '2027-03-20', 'Broad spectrum antibiotic'),
      ('Surgical Gloves (Medium)', 'Supplies', 2000, 'pairs', 0.15, 'MedSupply Inc.', 500, '2028-12-01', 'Latex-free nitrile'),
      ('Syringes 3ml', 'Supplies', 1500, 'units', 0.12, 'MedSupply Inc.', 300, '2028-06-01', 'Luer lock tip'),
      ('IV Catheter 22ga', 'Supplies', 200, 'units', 2.50, 'MedSupply Inc.', 50, '2027-09-15', 'For cats and small dogs'),
      ('Rabies Vaccine (Imrab 3)', 'Vaccines', 150, 'doses', 8.50, 'Boehringer Ingelheim', 30, '2027-01-30', 'Store at 2-7°C'),
      ('DHPP Vaccine', 'Vaccines', 120, 'doses', 12.00, 'Zoetis', 25, '2026-12-15', 'Canine distemper combo'),
      ('FVRCP Vaccine', 'Vaccines', 100, 'doses', 11.50, 'Zoetis', 20, '2026-11-30', 'Feline core vaccine'),
      ('Surgical Sutures (3-0 PDS)', 'Surgical', 75, 'packs', 18.00, 'Ethicon Veterinary', 15, '2028-03-01', 'Absorbable monofilament'),
      ('Isoflurane 250ml', 'Anesthesia', 12, 'bottles', 95.00, 'Piramal Healthcare', 3, '2027-08-20', 'Inhalation anesthetic'),
      ('Blood Collection Tubes (EDTA)', 'Lab Supplies', 400, 'units', 0.45, 'BD Vacutainer', 100, '2027-05-01', 'Purple top for CBC'),
      ('Flea/Tick Prevention (NexGard)', 'Preventatives', 200, 'chews', 15.00, 'Boehringer Ingelheim', 40, '2027-04-15', 'Monthly chewable for dogs'),
      ('Hill''s Prescription Diet k/d', 'Therapeutic Diet', 45, 'bags', 42.00, 'Hill''s Pet Nutrition', 10, '2027-02-28', 'Renal support formula'),
      ('Wound Dressing Pads', 'Supplies', 350, 'pads', 0.75, 'MedSupply Inc.', 75, '2028-01-15', 'Non-adherent sterile'),
      ('Digital Thermometer Covers', 'Supplies', 800, 'units', 0.08, 'MedSupply Inc.', 200, '2028-06-30', 'Disposable probe covers'),
      ('Elizabethan Collars (Medium)', 'Supplies', 30, 'units', 5.50, 'KVP International', 10, NULL, 'Reusable transparent e-collars')
    `);

    // Seed 16 lab results
    await client.query(`
      INSERT INTO lab_results (patient_id, test_type, test_name, results, reference_range, status, lab_name, notes) VALUES
      (1, 'Hematology', 'Complete Blood Count (CBC)', 'WBC: 12.5, RBC: 7.2, Hgb: 15.8, HCT: 46%, Platelets: 285', 'WBC: 5.5-16.9, RBC: 5.5-8.5, Hgb: 12-18, HCT: 37-55%, Plt: 175-500', 'completed', 'IDEXX Reference Lab', 'All values within normal range'),
      (2, 'Urinalysis', 'Complete Urinalysis', 'pH: 7.5, SG: 1.035, Protein: 2+, Blood: 3+, WBC: 15-20/HPF, Bacteria: moderate', 'pH: 6.0-7.0, SG: 1.035-1.060, Protein: neg, Blood: neg, WBC: 0-5/HPF', 'completed', 'In-House Lab', 'Consistent with UTI/FLUTD'),
      (3, 'Allergy', 'Allergen Panel - Environmental', 'Positive: Dust mites (4+), Grass pollen (3+), Mold spores (2+). Negative: Tree pollen, Wool', 'Negative for all allergens', 'completed', 'Spectrum Veterinary', 'Immunotherapy recommended'),
      (4, 'Serology', 'FeLV/FIV Snap Test', 'FeLV: Negative, FIV: Negative', 'Negative for both', 'completed', 'In-House Lab', 'Good news for owner'),
      (5, 'Parasitology', 'Fecal Float/Direct Smear', 'No ova or parasites detected. No Giardia antigen detected.', 'Negative for parasites', 'completed', 'In-House Lab', 'Clear - dietary cause most likely'),
      (6, 'Ophthalmology', 'Schirmer Tear Test + IOP', 'STT OD: 18mm/min, OS: 16mm/min. IOP OD: 14mmHg, OS: 15mmHg', 'STT: 15-25mm/min, IOP: 10-20mmHg', 'completed', 'In-House Lab', 'Tear production normal'),
      (7, 'Cardiology', 'ProBNP + Troponin I', 'ProBNP: 1800 pmol/L, Troponin I: 0.15 ng/mL', 'ProBNP: <900 pmol/L, Troponin I: <0.10 ng/mL', 'completed', 'Cardiopet Lab', 'Both elevated - confirms cardiac disease progression'),
      (8, 'Serology', 'E. cuniculi IgG/IgM', 'IgG: Positive (high titer), IgM: Positive', 'Negative', 'completed', 'IDEXX Reference Lab', 'Active infection confirmed'),
      (9, 'Endocrinology', 'Total T4 + Free T4', 'Total T4: 0.8 µg/dL, Free T4: 0.6 ng/dL', 'Total T4: 1.0-4.0 µg/dL, Free T4: 0.7-2.0 ng/dL', 'completed', 'IDEXX Reference Lab', 'Below range - dose increase needed'),
      (10, 'Biochemistry', 'Glucose + Fructosamine', 'Glucose: 350 mg/dL, Fructosamine: 450 µmol/L', 'Glucose: 74-159 mg/dL, Fructosamine: 175-350 µmol/L', 'completed', 'In-House Lab', 'Confirms diabetes mellitus'),
      (11, 'Imaging', 'Knee X-Ray Report', 'Bilateral medial patellar luxation. Grade 2 right, Grade 1 left. Mild osteoarthritis changes.', 'Normal patellar alignment', 'completed', 'In-House Radiology', 'Digital images stored in PACS'),
      (12, 'Biochemistry', 'Comprehensive Metabolic Panel', 'BUN: 22, Creat: 1.4, ALT: 45, ALP: 38, Glucose: 95, Total Protein: 7.2', 'BUN: 16-36, Creat: 0.8-2.4, ALT: 12-130, ALP: 14-111, Glucose: 74-159, TP: 5.7-8.9', 'completed', 'In-House Lab', 'All normal - no metabolic cause for behavior'),
      (13, 'Dermatology', 'Zinc Level + Skin Biopsy', 'Serum Zinc: 55 µg/dL (low). Biopsy: Marked parakeratosis consistent with zinc-responsive dermatosis', 'Zinc: 70-120 µg/dL', 'completed', 'Dermatopathology Lab', 'Increase supplementation'),
      (14, 'Microbiology', 'Chlamydia PCR', 'Chlamydia psittaci: POSITIVE', 'Negative', 'completed', 'IDEXX Reference Lab', 'Zoonotic risk - inform owner of precautions'),
      (15, 'Biochemistry', 'Calcium/Phosphorus Panel', 'Total Ca: 8.2 mg/dL, Ionized Ca: 0.9 mmol/L, Phosphorus: 7.5 mg/dL', 'Ca: 10-13 mg/dL, iCa: 1.1-1.4 mmol/L, Phos: 2.5-5.0 mg/dL', 'completed', 'IDEXX Reference Lab', 'Low calcium, high phosphorus - classic MBD'),
      (9, 'Hematology', 'CBC with Differential', 'WBC: 8.5, Neutrophils: 65%, Lymphocytes: 25%, Monocytes: 7%, Eosinophils: 3%', 'WBC: 5.5-16.9, Neut: 60-77%, Lymph: 12-30%, Mono: 3-10%, Eos: 2-10%', 'pending', 'In-House Lab', 'Requested with T4 recheck')
    `);

    // Seed 16 communications
    await client.query(`
      INSERT INTO communications (patient_id, type, subject, message, recipient_email, recipient_phone, status) VALUES
      (1, 'email', 'Appointment Reminder - Buddy', 'Dear John, this is a reminder that Buddy has a follow-up appointment on March 20th at 9:00 AM with Dr. Johnson for his hip dysplasia recheck. Please bring any recent x-rays.', 'john@email.com', '555-0101', 'sent'),
      (2, 'sms', 'Lab Results Ready - Whiskers', 'Hi Jane, Whiskers'' urinalysis results are in. Please call us at 555-VET1 to discuss the findings. - VetClinic', NULL, '555-0102', 'sent'),
      (3, 'email', 'Allergy Test Results - Max', 'Dear Robert, Max''s allergen panel results show positive reactions to dust mites, grass pollen, and mold spores. We recommend starting immunotherapy. Please schedule a consultation.', 'robert@email.com', '555-0103', 'sent'),
      (5, 'email', 'Invoice #INV-005 - Charlie', 'Dear David, please find attached your invoice for Charlie''s wellness exam. Total: $158.00 + tax. Payment due within 30 days. Pay online at our patient portal.', 'david@email.com', '555-0105', 'sent'),
      (7, 'email', 'Payment Plan Confirmation - Rocky', 'Dear James, this confirms your payment plan for Rocky''s cardiology services. 3 monthly installments of $240.73. First payment due March 25, 2026.', 'james@email.com', '555-0107', 'sent'),
      (8, 'email', 'Treatment Update - Milo', 'Dear Lisa, Milo is responding well to the fenbendazole treatment. Please continue the medication for the full 28 days. We''ll schedule a follow-up to assess progress.', 'lisa@email.com', '555-0108', 'sent'),
      (10, 'email', 'Diabetes Management Guide - Oliver', 'Dear Karen, as discussed, Oliver has been diagnosed with diabetes. Attached is our comprehensive guide for managing feline diabetes at home, including insulin administration instructions.', 'karen@email.com', '555-0110', 'sent'),
      (14, 'email', 'IMPORTANT: Zoonotic Disease Notice - Tweety', 'Dear Amy, Tweety has tested positive for Chlamydia psittaci. This can be transmitted to humans. Please read the attached precautions carefully and consult your physician if you develop flu-like symptoms.', 'amy@email.com', '555-0114', 'sent'),
      (4, 'sms', 'Wellness Reminder - Luna', 'Hi Maria, Luna is due for her annual wellness exam and vaccinations. Call 555-VET1 to schedule. - VetClinic', NULL, '555-0104', 'sent'),
      (6, 'email', 'Post-Op Care Instructions - Cleo', 'Dear Susan, please continue Cleo''s eye drops every 6 hours. Keep the e-collar on at all times. If you notice increased squinting or discharge, contact us immediately.', 'susan@email.com', '555-0106', 'sent'),
      (9, 'email', 'Medication Adjustment - Bella', 'Dear Tom, Bella''s T4 levels indicate we need to increase her levothyroxine dose. New prescription: 0.1mg/kg twice daily. Please pick up the updated medication.', 'tom@email.com', '555-0109', 'sent'),
      (11, 'email', 'Surgical Consultation Summary - Daisy', 'Dear Chris, following today''s evaluation, we recommend corrective surgery for Daisy''s bilateral luxating patella. The procedure has a 90%+ success rate. Please review the attached estimate.', 'chris@email.com', '555-0111', 'sent'),
      (12, 'sms', 'Check-in: Shadow', 'Hi Nancy, how is Shadow doing with the Feliway diffuser? Any improvement in eating/behavior? Please update us. - VetClinic', NULL, '555-0112', 'sent'),
      (13, 'email', 'Supplement Refill Reminder - Thor', 'Dear Mike, Thor''s zinc supplement prescription is due for refill. You can order through our online pharmacy or pick up at the clinic. Continue daily as prescribed.', 'mike@email.com', '555-0113', 'sent'),
      (15, 'email', 'Husbandry Guide - Scales', 'Dear Brian, attached is an updated care guide for Scales including proper UVB lighting schedules, calcium supplementation protocol, and diet recommendations for bearded dragons with MBD history.', 'brian@email.com', '555-0115', 'sent'),
      (16, 'sms', 'Treatment Update - Nemo', 'Hi Sarah, continue the Ich treatment for 3 more days. Water temp should stay at 86°F. Do 25% water changes daily. Call if no improvement by Friday. - VetClinic', NULL, '555-0116', 'sent')
    `);

    // Seed vaccinations
    await client.query(`
      INSERT INTO vaccinations (patient_id, vaccine_name, vaccine_type, batch_number, administered_date, next_due_date, administered_by, status, notes) VALUES
      (1, 'DHPP', 'Core', 'DHPP-2025-1842', '2025-03-15', '2026-03-15', 'Dr. Sarah Johnson', 'administered', 'Annual booster. No adverse reactions.'),
      (1, 'Rabies (3-year)', 'Core', 'RAB-2024-9021', '2024-06-10', '2027-06-10', 'Dr. Michael Chen', 'administered', '3-year vaccine administered.'),
      (1, 'Bordetella', 'Non-core', 'BORD-2025-3310', '2025-09-20', '2026-03-20', 'Dr. Sarah Johnson', 'administered', 'Intranasal. For boarding.'),
      (2, 'FVRCP', 'Core', 'FVRCP-2025-4421', '2025-04-10', '2026-04-10', 'Dr. Michael Chen', 'administered', 'Annual booster.'),
      (2, 'Rabies (1-year)', 'Core', 'RAB-2025-5502', '2025-04-10', '2026-04-10', 'Dr. Michael Chen', 'administered', 'First adult rabies.'),
      (3, 'DHPP', 'Core', 'DHPP-2025-2201', '2025-02-28', '2026-02-28', 'Dr. Sarah Johnson', 'overdue', 'Due for booster - OVERDUE'),
      (3, 'Rabies (3-year)', 'Core', 'RAB-2023-7703', '2023-08-15', '2026-08-15', 'Dr. Sarah Johnson', 'administered', 'Valid until Aug 2026.'),
      (4, 'FVRCP', 'Core', 'FVRCP-2025-6634', '2025-06-01', '2026-06-01', 'Dr. Michael Chen', 'administered', 'Young cat - annual schedule.'),
      (5, 'DHPP', 'Core', 'DHPP-2026-0101', '2026-01-15', '2027-01-15', 'Dr. Sarah Johnson', 'administered', 'On schedule.'),
      (5, 'Leptospirosis', 'Non-core', 'LEPT-2026-0102', '2026-01-15', '2027-01-15', 'Dr. Sarah Johnson', 'administered', 'Outdoor exposure risk.'),
      (5, 'Lyme', 'Non-core', 'LYME-2025-8801', '2025-05-01', '2026-05-01', 'Dr. Michael Chen', 'administered', 'Tick-endemic area.'),
      (7, 'DHPP', 'Core', 'DHPP-2025-5501', '2025-11-10', '2026-11-10', 'Dr. Sarah Johnson', 'administered', 'Given at cardiology visit.'),
      (7, 'Rabies (3-year)', 'Core', 'RAB-2025-6601', '2025-11-10', '2028-11-10', 'Dr. Sarah Johnson', 'administered', 'No issues.'),
      (9, 'DHPP', 'Core', 'DHPP-2025-3301', '2025-06-20', '2026-06-20', 'Dr. Michael Chen', 'administered', 'Senior dog - monitor for reactions.'),
      (10, 'FVRCP', 'Core', NULL, NULL, '2026-04-15', 'Dr. Michael Chen', 'scheduled', 'Due next month. Schedule with glucose curve.'),
      (13, 'DHPP', 'Core', 'DHPP-2025-1101', '2025-01-20', '2026-01-20', 'Dr. Sarah Johnson', 'overdue', 'OVERDUE - contact owner to reschedule.')
    `);

    // Seed visits (medical records)
    await client.query(`
      INSERT INTO visits (patient_id, visit_date, visit_type, reason, vet_name, weight_at_visit, temperature, heart_rate, respiratory_rate, examination_notes, treatment_provided, prescriptions, follow_up_date, follow_up_notes) VALUES
      (1, '2026-03-10', 'Follow-up', 'Hip dysplasia recheck', 'Dr. Sarah Johnson', 32.5, 101.2, 88, 18, 'Patient weight stable. Mild discomfort on hip extension right side. Good muscle mass. Gait slightly asymmetric.', 'Joint manipulation, cold laser therapy on right hip.', 'Carprofen 75mg BID x 14 days, Dasuquin chews daily', '2026-03-20', 'Recheck hip mobility and pain level.'),
      (1, '2025-09-20', 'Vaccination', 'Annual vaccines and wellness check', 'Dr. Sarah Johnson', 31.8, 101.5, 82, 16, 'Overall healthy. Dental tartar grade 1. Ears clear. Eyes bright. Heart and lungs normal.', 'DHPP booster, Bordetella intranasal, nail trim.', NULL, NULL, NULL),
      (2, '2026-03-05', 'Sick Visit', 'Frequent urination, blood in urine', 'Dr. Michael Chen', 4.2, 101.8, 180, 28, 'Bladder palpation painful. Small firm bladder. Mild dehydration. Otherwise alert and responsive.', 'Subcutaneous fluids 100ml. Urinalysis collected via cystocentesis.', 'Amoxicillin-Clavulanate 62.5mg BID x 10 days, Royal Canin Urinary SO diet', '2026-03-15', 'Repeat urinalysis to confirm resolution.'),
      (3, '2026-03-08', 'Dermatology', 'Excessive scratching, hair loss', 'Dr. Sarah Johnson', 37.5, 101.3, 90, 20, 'Bilateral flank alopecia. Erythematous skin on ventral abdomen. Hot spots on both ears. No fleas observed.', 'Skin scraping performed - negative for mites. Cytology: mild bacterial overgrowth. Medicated bath in clinic.', 'Apoquel 16mg daily, Chlorhexidine shampoo 2x/week', '2026-03-20', 'Review allergen panel results.'),
      (4, '2026-02-25', 'Sick Visit', 'Sneezing and nasal discharge', 'Dr. Michael Chen', 5.7, 102.5, 200, 36, 'Bilateral serous nasal discharge. Mild conjunctivitis. Decreased appetite per owner. Lungs clear on auscultation.', 'FeLV/FIV snap test - negative. Started supportive care.', 'L-lysine 250mg daily, Clavamox drops 1ml BID x 7 days', '2026-03-04', 'Recheck if not improving in 5 days.'),
      (5, '2026-01-15', 'Wellness Exam', 'Annual checkup', 'Dr. Sarah Johnson', 12.5, 101.0, 100, 22, 'Healthy and energetic. Weight appropriate. Teeth clean. No abnormalities detected on physical exam.', 'DHPP vaccine, Leptospirosis vaccine, fecal test (negative).', 'Continue hypoallergenic diet, NexGard monthly', NULL, NULL),
      (7, '2026-02-15', 'Cardiology', 'Exercise intolerance, coughing', 'Dr. Sarah Johnson', 44.5, 101.1, 110, 30, 'Grade 3/6 systolic murmur. Mild jugular distension. Increased respiratory effort. Peripheral edema absent.', 'Echocardiogram performed - DCM with mild chamber dilation. ECG: occasional VPCs.', 'Pimobendan 5mg BID, Enalapril 10mg BID, Furosemide 40mg BID', '2026-03-21', 'Recheck echo and adjust meds.'),
      (8, '2026-02-20', 'Neurology', 'Head tilt and loss of balance', 'Dr. Michael Chen', 1.8, 102.0, 220, 50, 'Right head tilt. Horizontal nystagmus. Ataxic gait. Good body condition. Eating when assisted.', 'Blood draw for E. cuniculi serology. Supportive care demonstrated to owner.', 'Fenbendazole 20mg/kg daily x 28 days, Meloxicam 0.3mg/kg single dose', '2026-03-21', 'Assess neurological improvement.'),
      (9, '2026-02-28', 'Lab Recheck', 'T4 level recheck', 'Dr. Sarah Johnson', 30.2, 101.0, 78, 16, 'Weight increased 1.2kg since last visit. Coat still thin. Mild lethargy reported by owner. Skin slightly thickened.', 'Blood draw for T4 and CBC.', 'Levothyroxine increased to 0.1mg/kg BID', '2026-03-22', 'Recheck T4 in 4 weeks.'),
      (10, '2026-03-01', 'Internal Medicine', 'Increased thirst and urination', 'Dr. Michael Chen', 5.8, 101.5, 190, 24, 'Mildly dehydrated. Weight loss of 0.6kg over 2 months. Hepatomegaly on palpation. Otherwise unremarkable.', 'Blood glucose and fructosamine drawn. Diabetes management education with owner.', 'Insulin Glargine 1U BID, Royal Canin Diabetic diet', '2026-03-22', 'Glucose curve day - bring cat fasted.'),
      (11, '2026-03-05', 'Orthopedic Consult', 'Intermittent limping', 'Dr. Sarah Johnson', 8.8, 101.2, 110, 20, 'Grade 2 luxating patella right. Grade 1 left. Crepitus on flexion right knee. Good muscle tone otherwise.', 'Knee x-rays taken. Surgical correction discussed with owner.', 'Dasuquin daily, weight management plan', '2026-03-22', 'Owner to decide on surgery.'),
      (14, '2026-03-12', 'Avian Exam', 'Fluffed feathers, drooping wing', 'Dr. Michael Chen', 0.088, 105.0, 300, 60, 'Feathers fluffed. Left wing slightly drooping. Decreased vocalization. Weight slightly below normal. Mild nasal discharge.', 'Chlamydia PCR swab collected. Nebulization treatment in clinic.', 'Doxycycline oral drops 0.1ml daily x 45 days', '2026-03-23', 'Recheck and assess treatment response.')
    `);

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
