import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Government Services Merchant...');

  const password = await bcrypt.hash('gov-password-123', 10);

  // Create or update government services merchant
  const govUser = await prisma.user.upsert({
    where: { email: 'gov@hatod.com' },
    update: {},
    create: {
      email: 'gov@hatod.com',
      phone: '+639000000001',
      password,
      role: UserRole.MERCHANT,
      isActive: true,
      isVerified: true,
      merchant: {
        create: {
          name: 'Government Services - City Hall',
          description: 'Official government services including permits, licenses, and business documents',
          address: 'City Hall, Claver',
          city: 'Claver',
          state: 'Surigao del Norte',
          phone: '+639000000001',
          latitude: 9.5,
          longitude: 125.5833,
          isApproved: true,
          type: 'GOVERNMENT',
        },
      },
    },
    include: { merchant: true },
  });

  const merchantId = (govUser as any).merchant.id;
  console.log('✅ Government merchant created/updated:', merchantId);

  // Create or update Business Permits category
  const permitsCategory = await prisma.category.upsert({
    where: { id: 'gov-permits-category' },
    update: {},
    create: {
      id: 'gov-permits-category',
      name: 'Business Permits',
      merchantId,
    },
  });

  console.log('✅ Business Permits category created/updated');

  // Create Business Permit menu item
  const permitMenuItem = await prisma.menuItem.upsert({
    where: { id: 'gov-business-permit-item' },
    update: {
      name: 'Business Permit Application',
      description: 'Submit and track your business permit application',
      isAvailable: true,
      isApproved: true,
    },
    create: {
      id: 'gov-business-permit-item',
      name: 'Business Permit Application',
      description: 'Submit and track your business permit application',
      price: 0,
      merchantId,
      categoryId: permitsCategory.id,
      isAvailable: true,
      isApproved: true,
    },
  });

  console.log('✅ Business Permit menu item created:', permitMenuItem.id);

  console.log('\n✅ Government Services Merchant seeding completed!');
  console.log('   Email: gov@hatod.com');
  console.log('   Password: gov-password-123');
  console.log('   Merchant ID:', merchantId);
  console.log('   Menu Item ID:', permitMenuItem.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
