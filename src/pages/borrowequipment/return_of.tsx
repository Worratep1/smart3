import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';

import ButtonState from '@/components/Button/ButtonState';
import styles from '@/styles/page.module.css';

interface ListItemType {
    listName: string;
    numberCard: string;
    startDate: string;
    endDate: string;
}

const ReturnOf = () => {
    const router = useRouter();
    const { userId } = router.query; // รับค่า userId จาก URL

    const [validated, setValidated] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '' });
    const [isLoading, setLoading] = useState(false);
    const [listItem, setListItem] = useState<ListItemType[]>([]);

    // 🔹 ดึงข้อมูลอุปกรณ์ที่ถูกยืมมาจากฐานข้อมูล
    useEffect(() => {
        if (userId) {
            fetchBorrowedItems(userId as string);
        }
    }, [userId]);

    const fetchBorrowedItems = async (userId: string) => {
        try {
            const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/getByUser/${userId}`);
            if (response.data?.borrowedItems) {
                setListItem(response.data.borrowedItems);
            } else {
                setAlert({ show: true, message: 'ไม่พบข้อมูลการยืม' });
            }
        } catch (error) {
            setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        try {
            await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, { userId, listItem });
            setAlert({ show: true, message: 'บันทึกการคืนสำเร็จ' });
        } catch (error) {
            setAlert({ show: true, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <h1 className="py-2">คืนอุปกรณ์ครุภัณฑ์</h1>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                {listItem.length > 0 ? listItem.map((item, index) => (
                    <Toast key={index}>
                        <Toast.Header><strong className="me-auto">{item.listName}</strong></Toast.Header>
                        <Toast.Body>
                            {item.numberCard} <br />
                            <span>เริ่ม {item.startDate}</span> | <span>สิ้นสุด {item.endDate}</span>
                        </Toast.Body>
                    </Toast>
                )) : <p>ไม่มีอุปกรณ์ที่ต้องคืน</p>}
                
                <ButtonState type="submit" className={styles.button} text={'บันทึก'} isLoading={isLoading} />
            </Form>
        </Container>
    );
};

export default ReturnOf;
