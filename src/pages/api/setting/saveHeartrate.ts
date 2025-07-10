// 📁 src/pages/api/setting/saveHeartrate.ts
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import _ from 'lodash'

type Data = {
    message: string;
    data?: any;
}

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            if (req.body) {
                const body = req.body

                if (_.isNaN(Number(body.takecare_id)) || _.isNaN(Number(body.users_id))) {
                    return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ takecare_id หรือ users_id ไม่ใช่ตัวเลข' })
                }

                // เช็คค่าที่ส่งมาว่าเป็นตัวเลข
                if (body.id && _.isNaN(Number(body.id))) {
                    return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ id ไม่ใช่ตัวเลข' })
                }
                if (body.id) {
                    await prisma.heartrate_settings.update({
                        where: { id: Number(body.id) },
                        data: {
                            max_bpm: Number(body.max_bpm),
                            // min_bpm: Number(body.min_bpm)
                        },
                    });
                    return res.status(200).json({ message: 'success' });
                }

                const existing = await prisma.heartrate_settings.findFirst({
                    where: {
                        users_id: Number(body.users_id),
                        takecare_id: Number(body.takecare_id),
                    },
                });

                if (existing) {
                    await prisma.heartrate_settings.update({
                        where: { id: existing.id },
                        data: {
                            max_bpm: Number(body.max_bpm),
                            // min_bpm: Number(body.min_bpm),
                        },
                    });
                    return res.status(200).json({ message: 'success', id: existing.id });
                } else {
                    const createdHeartRate = await prisma.heartrate_settings.create({
                        data: {
                            takecare_id: Number(body.takecare_id),
                            users_id: Number(body.users_id),
                            max_bpm: Number(body.max_bpm),
                            // min_bpm: Number(body.min_bpm),
                        }
                    });
                    return res.status(200).json({ message: 'success', id: createdHeartRate.id });
                }
            }
            return res.status(400).json({ message: 'error', data: 'error' });
        } catch (error) {
            console.error("Error in heartrate settings API:", error);
            return res.status(400).json({ message: 'error', data: error });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(400).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
    }
}

// import type { NextApiRequest, NextApiResponse } from 'next'
// import { PrismaClient } from '@prisma/client'

// const prisma = new PrismaClient()

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     res.setHeader('Allow', ['POST'])
//     return res.status(405).end(`Method ${req.method} Not Allowed`)
//   }

//   try {
//     const { takecare_id, users_id, max_bpm } = req.body   //min_bpm, 
    

//     // ✅ ตรวจสอบว่าข้อมูลครบ// min_bpm === undefined
//     if (!takecare_id ||!users_id ||max_bpm === undefined) {
//       return res.status(400).json({ message: 'Missing takecare_id, users_id, min_bpm or max_bpm' })
//     }

//     // ✅ ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือยัง
//     const existingRecord = await prisma.heartrate_settings.findFirst({
//       where: {
//         takecare_id: Number(takecare_id),
//         users_id: Number(users_id),
//       },
//     })

//     if (existingRecord) {
//       // ✅ มีแล้ว → อัปเดต
//       const updated = await prisma.heartrate_settings.update({
//         where: { id: existingRecord.id },
//         data: {
//           // min_bpm: Number(min_bpm),
//           max_bpm: Number(max_bpm),
//         },
//       })
//       return res.status(200).json({ success: true, data: updated })
//     } else {
//       // ✅ ยังไม่มี → เพิ่มใหม่
//       const created = await prisma.heartrate_settings.create({
//         data: {
//           takecare_id: Number(takecare_id),
//           users_id: Number(users_id),
//           // min_bpm: Number(min_bpm),
//           max_bpm: Number(max_bpm),
//         },
//       })
//       return res.status(201).json({ success: true, data: created })
//     }
//   } catch (error) {
//     console.error('Error in saveHeartrate:', error)
//     res.status(500).json({ message: 'Internal Server Error' })
//   }
// }
