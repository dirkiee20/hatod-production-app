import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting Government Services Merchant seed...');

    const password = await bcrypt.hash('gov-password-123', 10);

    // Check if gov merchant already exists
    const existing = await prisma.merchant.findFirst({
      where: {
        type: 'GOVERNMENT',
      },
    });

    if (existing) {
      console.log('✅ Government merchant already exists:', existing.id);
      return;
    }

    // Create user for government merchant
    const govUser = await prisma.user.create({
      data: {
        email: 'gov@hatod.com',
        phone: '+639000000001',
        password,
        role: UserRole.MERCHANT,
        isActive: true,
        isVerified: true,
      },
    });

    console.log('✅ Government user created:', govUser.id);

    // Create merchant with GOVERNMENT type
    const merchant = await prisma.merchant.create({
      data: {
        userId: govUser.id,
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
    });

    console.log('✅ Government merchant created:', merchant.id);

    // Create Business Permits category
    const category = await prisma.category.create({
      data: {
        name: 'Business Permits',
        merchantId: merchant.id,
      },
    });

    console.log('✅ Business Permits category created:', category.id);

    // Create Business Permit menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        name: 'Business Permit Application',
        description: 'Submit and track your business permit application',
        price: 0,
        merchantId: merchant.id,
        categoryId: category.id,
        isAvailable: true,
        isApproved: true,
      },
    });

    console.log('✅ Business Permit menu item created:', menuItem.id);

    console.log('\n✨ Government Services Merchant seeding completed!');
    console.log('   User Email: gov@hatod.com');
    console.log('   User Password: gov-password-123');
    console.log('   Merchant ID:', merchant.id);
    console.log('   Menu Item ID:', menuItem.id);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('✅ Government merchant already exists (unique constraint)');
    } else {
      console.error('❌ Error seeding government merchant:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
