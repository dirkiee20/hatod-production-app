import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const govMerchantId = '57d3838e-0678-4908-ba98-322960675688';

  console.log('Deleting Government Services data...');

  // Delete user related to gov merchant
  const govUser = await prisma.user.findFirst({
      where: { email: 'gov@hatod.com' }
  });

  if (govUser) {
      await prisma.user.delete({
          where: { id: govUser.id }
      });
      console.log('Deleted gov@hatod.com User (cascades to Merchant, Categories, and MenuItems)');
  } else {
      console.log('User gov@hatod.com not found.');
  }
  
  // Double check merchant deletion
  const merchant = await prisma.merchant.findUnique({
      where: { id: govMerchantId }
  });
  
  if (merchant) {
      await prisma.merchant.delete({
          where: { id: govMerchantId }
      });
      console.log('Deleted Government Merchant explicitly.');
  }

  console.log('✅ Government Services Data Deleted');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
