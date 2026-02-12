import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  let output = '';
  const log = (msg: string) => {
      console.log(msg);
      output += msg + '\n';
  };

  try {
    const addresses = await prisma.address.findMany();
    log(`Total addresses: ${addresses.length}`);
    log(`Addresses: ${JSON.stringify(addresses, null, 2)}`);

    const users = await prisma.user.findMany({
      include: {
        customer: true,
        merchant: true,
        rider: true, // Assuming rider relation exists
      },
    });

    log(`Total users: ${users.length}`);
    users.forEach((user) => {
      log('------------------');
      log(`User ID: ${user.id}`);
      log(`Email: ${user.email}`);
      log(`Role: ${user.role}`);
      if (user.customer) {
          log(`Customer ID: ${user.customer.id}`);
          // Check if this customer has the address
          const customerAddress = addresses.find(a => a.customerId === user.customer?.id);
          if (customerAddress) {
              log(`Has Address: ${customerAddress.id}`);
          } else {
              log('No Address Found');
          }
      }
    });
    
    fs.writeFileSync(path.join(__dirname, 'db-check-output.txt'), output);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main()
