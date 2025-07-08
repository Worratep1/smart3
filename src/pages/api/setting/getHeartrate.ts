import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {setting_id} = req.query

    if (!setting_id) {
         return res.status(400).json({ error: 'Missing setting_id' })
    }

    try {
        const setting = await prisma.heartrate_settings.findUnique({
            where: { id: Number(setting_id) }
        })

        if (!setting) {
            return res.status(404).json({ error: 'Setting not found' })
        }

        return res.status(200).json({ data: setting })
    } catch (error) {
        console.error('❌ error fetching heartrate setting:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
