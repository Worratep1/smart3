import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import Col from 'react-bootstrap/Col';

import InputLabel from '@/components/Form/InputLabel';
import TextareaLabel from '@/components/Form/TextareaLabel';
import ModalAlert from '@/components/Modals/ModalAlert';
import ModalActions from '@/components/Modals/ModalActions';
import ButtonState from '@/components/Button/ButtonState';
import ButtonAdd from '@/components/Button/ButtonAdd';
import DatePickerX from '@/components/DatePicker/DatePickerX';

import styles from '@/styles/page.module.css';

interface ListItemType {
    listName: string;
    numberCard: string;
}

const Borrow = () => {
    const router = useRouter();
    const inputRef = useRef<HTMLFormElement>(null);

    const [validated, setValidated] = useState(false);
    const [validatedModal, setValidatedModal] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '' });
    const [isLoading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [modalSave, setModalSave] = useState(false);

    const [listItem, setListItem] = useState<ListItemType[]>([]);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const auToken = router.query.auToken;
        if (auToken) {
            onGetUserData(auToken as string);
        }
    }, [router]);

    const onGetUserData = async (auToken: string) => {
        try {
            const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`);
            if (responseUser.data?.data) {
                setUser(responseUser.data.data);
            } else {
                setAlert({ show: true, message: 'ระบบไม่สามารถดึงข้อมูลของท่านได้' });
            }
        } catch (error) {
            setAlert({ show: true, message: 'ระบบมีปัญหา กรุณาลองใหม่' });
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!listItem.length || !user || !startDate || !endDate) {
            setAlert({ show: true, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
            return;
        }

        setLoading(true);

        try {
            const data = {
                borrow_date: startDate,
                borrow_return: endDate,
                borrow_status: 1,
                borrow_user_id: user.users_id,
                borrow_address: event.currentTarget['borrow_address'].value,
                borrow_tel: event.currentTarget['borrow_tel'].value,
                borrow_objective: event.currentTarget['borrow_objective'].value,
                borrow_name: event.currentTarget['borrow_name'].value,
                borrow_list: listItem
            };

            await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/create`, data);
            setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' });

            // นำทางไปยังหน้าการคืนอุปกรณ์
            router.push(`/return_of?userId=${user.users_id}`);
        } catch (error) {
            setAlert({ show: true, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <h1 className="py-2">ยืมอุปกรณ์ครุภัณฑ์</h1>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group><InputLabel label='ชื่อผู้ยืม' id="borrow_name" required /></Form.Group>
                <Form.Group><TextareaLabel label='ที่อยู่' id="borrow_address" required /></Form.Group>
                <Form.Group><InputLabel label='หมายเลขโทรศัพท์' id="borrow_tel" required /></Form.Group>
                <Form.Group><InputLabel label='ขอยืมครุภัณฑ์เพื่อ' id="borrow_objective" required /></Form.Group>
                <Form.Group><DatePickerX selected={startDate} onChange={setStartDate} /></Form.Group>
                <Form.Group><DatePickerX selected={endDate} onChange={setEndDate} /></Form.Group>
                
                <ButtonState type="submit" className={styles.button} text={'บันทึก'} isLoading={isLoading} />
            </Form>
        </Container>
    );
};

export default Borrow;
