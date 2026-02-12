
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing delivery fee configs...');
  await prisma.deliveryFeeConfig.deleteMany({});
  
  console.log('Seeding delivery fee configs...');
  await prisma.deliveryFeeConfig.createMany({
    data: [
      { minDistance: 0, maxDistance: 10, fee: 50 },
      { minDistance: 10, maxDistance: 20, fee: 80 },
      { minDistance: 20, maxDistance: 30, fee: 120 },
      { minDistance: 30, maxDistance: 1000, fee: 200 },
    ],
  });

  console.log('Delivery fees seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
