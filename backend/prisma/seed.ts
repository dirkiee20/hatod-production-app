import { PrismaClient, UserRole, OrderStatus, RiderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // 1. Create Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hatod.com' },
    update: {},
    create: {
      email: 'admin@hatod.com',
      password,
      role: UserRole.ADMIN,
      admin: {
        create: {
          firstName: 'System',
          lastName: 'Admin',
        },
      },
    },
  });

  // 2. Create Merchant
  const merchantUser = await prisma.user.upsert({
    where: { email: 'merchant@hatod.com' },
    update: {},
    create: {
      email: 'merchant@hatod.com',
      password,
      role: UserRole.MERCHANT,
      merchant: {
        create: {
          name: 'Classic Burger Joint',
          address: '123 Foodie Ave, Metro Manila',
          city: 'Manila',
          state: 'Metro Manila',
          phone: '+639123456780',
          latitude: 14.5995,
          longitude: 120.9842,
        },
      },
    },
    include: { merchant: true },
  });

  const merchantId = merchantUser.merchant!.id;

  // 3. Create Categories & Menu Items
  const burgerCategory = await prisma.category.create({
    data: {
      name: 'Burgers',
      merchantId,
      menuItems: {
        create: [
          { name: 'Classic Cheeseburger', description: 'Beef patty, cheese, lettuce, tomato', price: 150 },
          { name: 'Double Bacon Burger', description: 'Double patty, double bacon, cheese', price: 250 },
        ],
      },
    },
  });

  const drinkCategory = await prisma.category.create({
    data: {
      name: 'Drinks',
      merchantId,
      menuItems: {
        create: [
          { name: 'Iced Tea', description: 'Freshly brewed', price: 50 },
          { name: 'Lemonade', description: 'Freshly squeezed', price: 60 },
        ],
      },
    },
  });

  // 4. Create Customer
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@hatod.com' },
    update: {},
    create: {
      email: 'customer@hatod.com',
      password,
      role: UserRole.CUSTOMER,
      customer: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          addresses: {
            create: {
              label: 'Home',
              street: '456 Residential St',
              city: 'Manila',
              state: 'Metro Manila',
              latitude: 14.6010,
              longitude: 120.9850,
              isDefault: true,
            },
          },
        },
      },
    },
  });

  // 5. Create Rider
  const riderUser = await prisma.user.upsert({
    where: { email: 'rider@hatod.com' },
    update: {},
    create: {
      email: 'rider@hatod.com',
      password,
      role: UserRole.RIDER,
      rider: {
        create: {
          firstName: 'Fast',
          lastName: 'Delivery',
          vehicleType: 'Motorcycle',
          status: RiderStatus.AVAILABLE,
        },
      },
    },
  });

  console.log('✅ Seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
