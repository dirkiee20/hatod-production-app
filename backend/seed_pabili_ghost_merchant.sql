-- 1. Create Ghost User (Admin - We Buy For You)
INSERT INTO "users" ("id", "email", "password", "role", "isActive", "isVerified", "updatedAt") 
VALUES ('11111111-1111-1111-1111-111111111111', 'pabili-ghost@hatod.com', '$2b$10$abcdefghijklmnopqrstuv', 'MERCHANT', true, true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- 2. Create Ghost Merchant
INSERT INTO "merchants" ("id", "userId", "name", "description", "address", "city", "state", "latitude", "longitude", "phone", "isApproved", "isOpen", "type", "updatedAt")
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Hatod - We Buy For You', 'System merchant for custom shopping requests', 'Hatod HQ', 'Koronadal', 'South Cotabato', 6.4950, 124.8480, '00000000000', true, true, 'GROCERY', NOW())
ON CONFLICT ("id") DO NOTHING;

-- 3. Create Ghost Category
INSERT INTO "categories" ("id", "merchantId", "name", "sortOrder", "updatedAt")
VALUES ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Custom Requests', 0, NOW())
ON CONFLICT ("id") DO NOTHING;

-- 4. Create Ghost Menu Item
INSERT INTO "menu_items" ("id", "merchantId", "categoryId", "name", "description", "price", "isAvailable", "isApproved", "updatedAt")
VALUES ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Custom Pabili Items', 'Dynamic pricing item for custom shopping', 0, true, true, NOW())
ON CONFLICT ("id") DO NOTHING;
