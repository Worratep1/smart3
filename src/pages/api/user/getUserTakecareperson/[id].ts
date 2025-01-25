import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { decrypt } from '@/utils/helpers';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            // Decrypt and parse the ID from the query
            const id = decrypt(req.query.id as string);
            if (id) {
                const userId = Array.isArray(id) ? parseInt(id[0], 10) : parseInt(id, 10);

                // Validate if the userId is a valid number
                if (!isNaN(userId)) {
                    // Find data from takecareperson table
                    const user = await prisma.takecareperson.findFirst({
                        where: {
                            OR: [
                                { users_id: userId }, // Match users_id
                                { takecare_id: userId }, // Match takecare_id
                            ],
                            takecare_status: 1, // Ensure the status is active
                        },
                        include: { // Include related data from other tables
                            gender_id_ref: {
                                select: {
                                    gender_describe: true,
                                },
                            },
                            marry_id_ref: {
                                select: {
                                    marry_describe: true,
                                },
                            },
                        },
                    });

                    // Return success if user data is found
                    if (user) {
                        return res.status(200).json({ message: 'success', data: user });
                    } else {
                        return res.status(404).json({ message: 'ไม่พบข้อมูลผู้สูงอายุหรือผู้ดูแล' });
                    }
                }
            }

            // If the ID is invalid or user data is not found
            return res.status(400).json({ message: 'error', data: 'ไม่สามารถดึงข้อมูลได้' });
        } catch (error) {
            console.error('Error fetching data:', error);
            return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดภายในระบบ' });
        }
    } else {
        // Return error for unsupported HTTP methods
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
    }
}
