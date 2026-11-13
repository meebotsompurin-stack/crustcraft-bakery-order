import bcrypt from 'bcrypt';
import { prisma } from '../server/src/lib/db';

const SALT_ROUNDS = 10;

export async function seedDatabase() {
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
    throw new Error('Missing ADMIN_PASSWORD');
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'supersecret_admin_pass';
  const demoUserPassword = process.env.DEMO_USER_PASSWORD || 'supersecret_demo_pass';

  const operatorPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
  const customerPasswordHash = await bcrypt.hash(demoUserPassword, SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: 'admin@crustcraft.com' },
    update: {
      name: 'Head Baker Admin',
      passwordHash: operatorPasswordHash,
      role: 'OPERATOR',
    },
    create: {
      name: 'Head Baker Admin',
      email: 'admin@crustcraft.com',
      passwordHash: operatorPasswordHash,
      role: 'OPERATOR',
    },
  });

  const shouldSeedDemo = process.env.SEED_DEMO_DATA !== 'false';
  if (shouldSeedDemo) {
    await prisma.user.upsert({
      where: { email: 'customer1@test.com' },
      update: {
        name: 'Customer One',
        passwordHash: customerPasswordHash,
        role: 'CUSTOMER',
      },
      create: {
        name: 'Customer One',
        email: 'customer1@test.com',
        passwordHash: customerPasswordHash,
        role: 'CUSTOMER',
      },
    });

    await prisma.user.upsert({
      where: { email: 'customer2@test.com' },
      update: {
        name: 'Customer Two',
        passwordHash: customerPasswordHash,
        role: 'CUSTOMER',
      },
      create: {
        name: 'Customer Two',
        email: 'customer2@test.com',
        passwordHash: customerPasswordHash,
        role: 'CUSTOMER',
      },
    });
  }

  const bakeryItems = [
    {
      name: 'Artisan Butter Croissant',
      description: 'Flaky French-style laminated pastry made with cultured Normandy butter.',
      price: 8500, // 85.00 THB in satang
      stockQuantity: 50,
      isAvailable: true,
      category: 'Pastry',
    },
    {
      name: 'Classic Sourdough Loaf',
      description: '36-hour naturally leavened country bread with crisp caramelized crust.',
      price: 22000, // 220.00 THB in satang
      stockQuantity: 20,
      isAvailable: true,
      category: 'Bread',
    },
    {
      name: 'Cinnamon Brioche Roll',
      description: 'Rich butter brioche swirled with Ceylon cinnamon and brown sugar glaze.',
      price: 6500, // 65.00 THB in satang
      stockQuantity: 80,
      isAvailable: true,
      category: 'Sweet Bread',
    },
    {
      name: 'Pain au Chocolat',
      description: 'Crisp laminated pastry filled with two batons of 70% dark Valrhona chocolate.',
      price: 9000, // 90.00 THB in satang
      stockQuantity: 40,
      isAvailable: true,
      category: 'Pastry',
    },
    {
      name: 'Matcha Almond Tart',
      description: 'Buttery pâte sucrée shell baked with Uji matcha almond frangipane and toasted almonds.',
      price: 14500, // 145.00 THB in satang
      stockQuantity: 30,
      isAvailable: true,
      category: 'Tart',
    },
  ];

  for (const item of bakeryItems) {
    await prisma.bakeryItem.upsert({
      where: { name: item.name },
      update: {
        description: item.description,
        price: item.price,
        stockQuantity: item.stockQuantity,
        isAvailable: item.isAvailable,
        category: item.category,
      },
      create: item,
    });
  }
}

async function main() {
  await seedDatabase();
  console.log('Seed completed successfully (Admin & Demo Users, 5 BakeryItems in integer satang).');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
