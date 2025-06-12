import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }>
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' }) // Only allow PUT requests
  }

  const { uId, takecare_id, temperature } = req.body

  if (!uId || !takecare_id || !temperature) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  try {
    await prisma.temperature_records.create({
      data: {
        users_id: Number(uId),
        takecare_id: Number(takecare_id),
        temperature_value: parseFloat(temperature),
        status: 1, // ใส่ logic ตามที่ต้องการ
      },
    })
    return res.status(200).json({ message: 'success' })
  } catch (err) {
    console.error('Error saving temperature:', err)
    return res.status(500).json({ message: 'Error saving temperature' })
  }
}
// This API endpoint saves temperature records to the database.