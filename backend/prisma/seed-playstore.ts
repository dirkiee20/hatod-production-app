import { MerchantType, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type SeedCategory = {
  name: string;
  sortOrder: number;
};

type SeedMenuItem = {
  name: string;
  description: string;
  price: number;
  image: string;
  categoryName: string;
  preparationTime?: number;
};

type SeedMerchant = {
  email: string;
  phone: string;
  name: string;
  description: string;
  logo: string;
  coverImage: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  categories: SeedCategory[];
  menuItems: SeedMenuItem[];
};

const merchantSeeds: SeedMerchant[] = [
  {
    email: 'playstore.grill@hatod.com',
    phone: '+639110000101',
    name: 'Hatod Grill House',
    description: 'Charcoal grilled favorites and classic Filipino comfort food.',
    logo: 'https://picsum.photos/seed/hatod-grill-logo/400/400',
    coverImage:
      'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=1400',
    address: 'Poblacion, Claver Public Market Road',
    city: 'Claver',
    state: 'Surigao del Norte',
    latitude: 9.5734,
    longitude: 125.7385,
    categories: [
      { name: 'Grilled', sortOrder: 1 },
      { name: 'Rice Meals', sortOrder: 2 },
      { name: 'Drinks', sortOrder: 3 },
    ],
    menuItems: [
      {
        name: 'Pork BBQ Skewers',
        description: 'Three sweet-savory skewers with garlic rice.',
        price: 129,
        image:
          'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Grilled',
        preparationTime: 20,
      },
      {
        name: 'Chicken Inasal Plate',
        description: 'Marinated grilled chicken quarter with atchara.',
        price: 149,
        image:
          'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Grilled',
      },
      {
        name: 'Sisig Rice Bowl',
        description: 'Sizzling pork sisig over steamed rice.',
        price: 139,
        image:
          'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Rice Meals',
      },
      {
        name: 'Beef Tapa Meal',
        description: 'House-cured beef tapa, egg, and garlic rice.',
        price: 169,
        image:
          'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Rice Meals',
      },
      {
        name: 'Calamansi Iced Tea',
        description: 'Fresh brewed tea with calamansi.',
        price: 49,
        image:
          'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Drinks',
      },
      {
        name: 'Mango Shake',
        description: 'Ripe mango blended with ice and milk.',
        price: 79,
        image:
          'https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Drinks',
      },
    ],
  },
  {
    email: 'playstore.seafood@hatod.com',
    phone: '+639110000102',
    name: 'Coastal Seafood Kitchen',
    description: 'Fresh seafood platters and local coastal specialties.',
    logo: 'https://picsum.photos/seed/hatod-seafood-logo/400/400',
    coverImage:
      'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=1400',
    address: 'Baywalk Corner Rizal Street, Claver',
    city: 'Claver',
    state: 'Surigao del Norte',
    latitude: 9.5728,
    longitude: 125.7372,
    categories: [
      { name: 'Seafood Trays', sortOrder: 1 },
      { name: 'Noodles', sortOrder: 2 },
      { name: 'Sides', sortOrder: 3 },
    ],
    menuItems: [
      {
        name: 'Garlic Butter Shrimp Tray',
        description: 'Sauteed shrimp in rich garlic butter sauce.',
        price: 289,
        image:
          'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Seafood Trays',
      },
      {
        name: 'Crispy Calamares',
        description: 'Lightly battered squid rings with spiced mayo.',
        price: 189,
        image:
          'https://images.pexels.com/photos/3616956/pexels-photo-3616956.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Seafood Trays',
      },
      {
        name: 'Seafood Pancit',
        description: 'Stir-fried noodles with mixed seafood and vegetables.',
        price: 169,
        image:
          'https://images.pexels.com/photos/4518845/pexels-photo-4518845.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Noodles',
      },
      {
        name: 'Crab Fat Canton',
        description: 'Egg noodles with crab fat cream sauce.',
        price: 199,
        image:
          'https://images.pexels.com/photos/2703468/pexels-photo-2703468.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Noodles',
      },
      {
        name: 'Steamed Rice',
        description: 'Plain steamed rice.',
        price: 25,
        image:
          'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Sides',
      },
      {
        name: 'Kimchi Slaw',
        description: 'Tangy and spicy cabbage side.',
        price: 59,
        image:
          'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Sides',
      },
    ],
  },
  {
    email: 'playstore.silog@hatod.com',
    phone: '+639110000103',
    name: 'Silog Republic',
    description: 'All-day breakfast meals and quick comfort dishes.',
    logo: 'https://picsum.photos/seed/hatod-silog-logo/400/400',
    coverImage:
      'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=1400',
    address: 'Near Municipal Gym, Claver',
    city: 'Claver',
    state: 'Surigao del Norte',
    latitude: 9.5719,
    longitude: 125.7391,
    categories: [
      { name: 'Silog Meals', sortOrder: 1 },
      { name: 'Snacks', sortOrder: 2 },
      { name: 'Coffee', sortOrder: 3 },
    ],
    menuItems: [
      {
        name: 'Tapsilog',
        description: 'Beef tapa, sinangag, and sunny-side egg.',
        price: 129,
        image:
          'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Silog Meals',
      },
      {
        name: 'Longsilog',
        description: 'Sweet pork longganisa, garlic rice, and egg.',
        price: 119,
        image:
          'https://images.pexels.com/photos/6542794/pexels-photo-6542794.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Silog Meals',
      },
      {
        name: 'Bangsilog',
        description: 'Crispy bangus, garlic rice, and egg.',
        price: 149,
        image:
          'https://images.pexels.com/photos/1510683/pexels-photo-1510683.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Silog Meals',
      },
      {
        name: 'Chicken Sandwich',
        description: 'Toasted brioche with crispy chicken and slaw.',
        price: 109,
        image:
          'https://images.pexels.com/photos/2983098/pexels-photo-2983098.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Snacks',
      },
      {
        name: 'Cappuccino',
        description: 'Espresso with steamed milk foam.',
        price: 89,
        image:
          'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Coffee',
      },
      {
        name: 'Iced Latte',
        description: 'Double-shot espresso over milk and ice.',
        price: 99,
        image:
          'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=1200',
        categoryName: 'Coffee',
      },
    ],
  },
];

async function upsertMerchant(seed: SeedMerchant, passwordHash: string) {
  const user = await prisma.user.upsert({
    where: { email: seed.email },
    update: {
      role: UserRole.MERCHANT,
      phone: seed.phone,
      isActive: true,
      isVerified: true,
    },
    create: {
      email: seed.email,
      phone: seed.phone,
      password: passwordHash,
      role: UserRole.MERCHANT,
      isActive: true,
      isVerified: true,
    },
  });

  const merchant = await prisma.merchant.upsert({
    where: { userId: user.id },
    update: {
      name: seed.name,
      description: seed.description,
      logo: seed.logo,
      coverImage: seed.coverImage,
      address: seed.address,
      city: seed.city,
      state: seed.state,
      phone: seed.phone,
      latitude: seed.latitude,
      longitude: seed.longitude,
      type: MerchantType.RESTAURANT,
      isApproved: true,
      isOpen: true,
    },
    create: {
      userId: user.id,
      name: seed.name,
      description: seed.description,
      logo: seed.logo,
      coverImage: seed.coverImage,
      address: seed.address,
      city: seed.city,
      state: seed.state,
      phone: seed.phone,
      latitude: seed.latitude,
      longitude: seed.longitude,
      type: MerchantType.RESTAURANT,
      isApproved: true,
      isOpen: true,
    },
  });

  const categoryMap = new Map<string, string>();

  for (const category of seed.categories) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        merchantId: merchant.id,
        name: category.name,
      },
    });

    const savedCategory = existingCategory
      ? await prisma.category.update({
          where: { id: existingCategory.id },
          data: { sortOrder: category.sortOrder },
        })
      : await prisma.category.create({
          data: {
            merchantId: merchant.id,
            name: category.name,
            sortOrder: category.sortOrder,
          },
        });

    categoryMap.set(category.name, savedCategory.id);
  }

  for (const item of seed.menuItems) {
    const categoryId = categoryMap.get(item.categoryName);

    if (!categoryId) {
      throw new Error(
        `Category "${item.categoryName}" not found for merchant "${seed.name}".`,
      );
    }

    const existingItem = await prisma.menuItem.findFirst({
      where: {
        merchantId: merchant.id,
        name: item.name,
      },
    });

    const itemData = {
      merchantId: merchant.id,
      categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      preparationTime: item.preparationTime ?? 15,
      isAvailable: true,
      isApproved: true,
    };

    if (existingItem) {
      await prisma.menuItem.update({
        where: { id: existingItem.id },
        data: itemData,
      });
    } else {
      await prisma.menuItem.create({ data: itemData });
    }
  }
}

async function main() {
  console.log('Starting Play Store showcase seed...');
  const passwordHash = await bcrypt.hash('merchant123', 10);

  for (const merchantSeed of merchantSeeds) {
    await upsertMerchant(merchantSeed, passwordHash);
    console.log(`Seeded merchant: ${merchantSeed.name}`);
  }

  console.log('');
  console.log('Play Store showcase seed completed.');
  console.log('Merchant test password for seeded users: merchant123');
}

main()
  .catch((error) => {
    console.error('Failed to run Play Store showcase seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
