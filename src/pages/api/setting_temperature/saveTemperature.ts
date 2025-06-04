import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { takecare_id, users_id, max_temperature } = req.body

    if (!takecare_id || !users_id || max_temperature === undefined) {
      return res.status(400).json({ message: 'Missing takecare_id, users_id or max_temperature' })
    }

    const existingRecord = await prisma.temperature_settings.findFirst({
      where: {
        takecare_id: Number(takecare_id),
        users_id: Number(users_id),
      }
    })

    if (existingRecord) {
      const updated = await prisma.temperature_settings.update({
        where: { id: existingRecord.id },
        data: {
          max_temperature: Number(max_temperature),
        }
      })
      return res.status(200).json({ success: true, data: updated })
    } else {
      const created = await prisma.temperature_settings.create({
        data: {
          takecare_id: Number(takecare_id),
          users_id: Number(users_id),
          max_temperature: Number(max_temperature),
        }
      })
      return res.status(201).json({ success: true, data: created })
    }
  } catch (error) {
    console.error('Error in saveTemperature:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
