// 📁 src/pages/api/setting/getHeartrate.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { takecare_id, users_id } = req.query
    console.log('Query params:', req.query)

    // ตรวจสอบว่ามีพารามิเตอร์ครบ
    if (!takecare_id || !users_id) {
      return res.status(400).json({ message: 'Missing takecare_id or users_id' })
    }

    // ดึงข้อมูลจากตาราง heartrate_settings
    const setting = await prisma.heartrate_settings.findFirst({
      where: {
        takecare_id: Number(takecare_id),
        users_id: Number(users_id),
      },
    })

    if (!setting) {
      return res.status(404).json({ message: 'Heart rate setting not found' })
    }

    res.status(200).json({ success: true, data: setting })
  } catch (error) {
    console.error('Error in getHeartrate:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
