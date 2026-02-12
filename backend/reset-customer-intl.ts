import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  try {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash('password123', salt)

    const updatedUser = await prisma.user.update({
      where: { email: 'customer@hatod.com' },
      data: { 
        phone: '+639123456789', // Updated to international format
        password: hash
      }
    })

    console.log('--- User Updated ---')
    console.log(`Email: ${updatedUser.email}`)
    console.log(`Phone: ${updatedUser.phone}`)
    console.log(`New Password: password123`)
    console.log('--------------------')

  } catch (e) {
    console.error('Error updating user:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
