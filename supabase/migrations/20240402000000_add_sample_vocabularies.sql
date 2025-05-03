-- Add sample vocabularies for new users
-- These will only be inserted if they don't already exist

-- Medical terminology sample
INSERT INTO custom_vocabulary (id, user_id, name, terms, is_default, created_at, updated_at)
SELECT 
  'sample-medical-vocab',
  auth.uid,
  'Medical Terminology',
  ARRAY['hypertension', 'myocardial infarction', 'tachycardia', 'dyspnea', 'atherosclerosis', 'metastasis', 'oncology', 'hematology', 'antibiotic', 'prognosis'],
  false,
  NOW(),
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM custom_vocabulary 
  WHERE name = 'Medical Terminology' AND user_id = auth.users.id
) 
LIMIT 10; -- Only add for the first 10 users who don't have medical vocabulary

-- Technical terminology sample
INSERT INTO custom_vocabulary (id, user_id, name, terms, is_default, created_at, updated_at)
SELECT 
  'sample-tech-vocab',
  auth.uid,
  'Technical Terms',
  ARRAY['React.js', 'Kubernetes', 'PostgreSQL', 'API endpoints', 'middleware', 'authentication', 'TypeScript', 'containerization', 'microservices', 'scalability'],
  false,
  NOW(),
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM custom_vocabulary 
  WHERE name = 'Technical Terms' AND user_id = auth.users.id
) 
LIMIT 10;

-- Legal terminology sample
INSERT INTO custom_vocabulary (id, user_id, name, terms, is_default, created_at, updated_at)
SELECT 
  'sample-legal-vocab',
  auth.uid,
  'Legal Terminology',
  ARRAY['habeas corpus', 'voir dire', 'prima facie', 'pro bono', 'subpoena duces tecum', 'res judicata', 'motion in limine', 'stare decisis', 'mens rea', 'de facto'],
  false,
  NOW(),
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM custom_vocabulary 
  WHERE name = 'Legal Terminology' AND user_id = auth.users.id
) 
LIMIT 10;

-- Financial terminology sample
INSERT INTO custom_vocabulary (id, user_id, name, terms, is_default, created_at, updated_at)
SELECT 
  'sample-finance-vocab',
  auth.uid,
  'Financial Terms',
  ARRAY['EBITDA', 'amortization', 'liquidity ratio', 'derivatives', 'quantitative easing', 'securitization', 'fiscal year', 'yield curve', 'arbitrage', 'hedge fund'],
  false,
  NOW(),
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM custom_vocabulary 
  WHERE name = 'Financial Terms' AND user_id = auth.users.id
) 
LIMIT 10; 