-- Seed Government Services Merchant Account
-- Email: 09525706262
-- Password: CLAVERLGU

-- Use PostgreSQL CTEs to chain inserts and pass IDs through
WITH gov_user AS (
  INSERT INTO "users" (id, email, phone, password, role, "isActive", "isVerified", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid(),
    '09525706262',
    '09525706262',
    '$2b$10$FG8lhC5vUitTzCOedHfBxeXxBeKxStT.WMoBdmAVKNwR51srrAih2',  -- bcrypt hash of 'CLAVERLGU'
    'MERCHANT',
    true,
    true,
    NOW(),
    NOW()
  )
  RETURNING id
),
gov_merchant AS (
  INSERT INTO "merchants" (id, "userId", name, description, address, city, state, "zipCode", phone, latitude, longitude, "isApproved", "isOpen", type, rating, "totalOrders", "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    gov_user.id,
    'Government Services - City Hall',
    'Official government services including permits, licenses, and business documents',
    'City Hall, Claver',
    'Claver',
    'Surigao del Norte',
    NULL,
    '09525706262',
    9.5,
    125.5833,
    true,
    true,
    'GOVERNMENT',
    0,
    0,
    NOW(),
    NOW()
  FROM gov_user
  RETURNING id
),
category AS (
  INSERT INTO "categories" (id, "merchantId", name, "sortOrder", "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    gov_merchant.id,
    'Business Permits',
    0,
    NOW(),
    NOW()
  FROM gov_merchant
  RETURNING id
)
INSERT INTO "menu_items" (id, "merchantId", "categoryId", name, description, price, "isAvailable", "isApproved", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  gov_merchant.id,
  category.id,
  'Business Permit Application',
  'Submit and track your business permit application',
  0,
  true,
  true,
  NOW(),
  NOW()
FROM gov_merchant, category;


