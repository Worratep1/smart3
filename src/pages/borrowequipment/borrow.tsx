import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Toast from 'react-bootstrap/Toast';

import InputLabel from '@/components/Form/InputLabel';
import TextareaLabel from '@/components/Form/TextareaLabel';
import ModalAlert from '@/components/Modals/ModalAlert';
import ModalActions from '@/components/Modals/ModalActions';
import ButtonState from '@/components/Button/ButtonState';
import ButtonAdd from '@/components/Button/ButtonAdd';
import DatePickerX from '@/components/DatePicker/DatePickerX';

import styles from '@/styles/page.module.css';

interface EquipmentType {
    equipment_id: number;
    equipment_name: string;
    equipment_code: string;
}

const Borrow = () => {
    const router = useRouter();
    const inputRef = useRef<HTMLFormElement>(null);

    const [alert, setAlert] = useState({ show: false, message: '' });
    const [isLoading, setLoading] = useState(false);
    const [modalSave, setModalSave] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());

    const [user, setUser] = useState<any>(null);
    const [availableEquipment, setAvailableEquipment] = useState<EquipmentType[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);
    const [borrowList, setBorrowList] = useState<EquipmentType[]>([]);

    useEffect(() => {
        fetchAvailableEquipment();
        fetchUserData();
    }, []);

      // ดึงข้อมูลอุปกรณ์ที่สามารถยืมได้
      const fetchAvailableEquipment = async () => {
        try {
            const response = await axios.get(`/api/borrowequipment/getAvailableEquipment`);
            if (response.data?.data) {
                setAvailableEquipment(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching available equipment:", error);
            setAlert({ show: true, message: 'ไม่สามารถโหลดรายการอุปกรณ์ได้' });
        }
    };
    const fetchUserData = async () => {
        try {
            const response = await axios.get('/api/user/getUser');
            setUser(response.data.data);
        } catch (error) {
            setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        try {
            const data = {
                borrow_date: startDate,
                borrow_return: endDate,
                borrow_user_id: user?.users_id,
                borrow_address: event.currentTarget['borrow_address'].value,
                borrow_tel: event.currentTarget['borrow_tel'].value,
                borrow_objective: event.currentTarget['borrow_objective'].value,
                borrow_name: event.currentTarget['borrow_name'].value,
                borrow_list: borrowList.map(item => ({ equipment_id: item.equipment_id })),
            };

            await axios.post('/api/borrowequipment/create', data);
            setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' });
        } catch (error) {
            setAlert({ show: true, message: 'ระบบไม่สามารถบันทึกข้อมูลได้' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <h1 className="py-2">ยืมอุปกรณ์ครุภัณฑ์</h1>
            <Form onSubmit={handleSubmit}>
                <InputLabel label='ชื่อผู้ยืม' id="borrow_name" required />
                <TextareaLabel label='ที่อยู่' id="borrow_address" required />
                <InputLabel label='หมายเลขโทรศัพท์' id="borrow_tel" required />
                <InputLabel label='ขอยืมครุภัณฑ์เพื่อ' id="borrow_objective" required />

                <Form.Select onChange={(e) => {
                    const selected = availableEquipment.find(eq => eq.equipment_id === Number(e.target.value));
                    if (selected) setBorrowList([...borrowList, selected]);
                }}>
                    <option value="">-- เลือกอุปกรณ์ --</option>
                    {availableEquipment.map(e => <option key={e.equipment_id} value={e.equipment_id}>{e.equipment_name}</option>)}
                </Form.Select>

                <ButtonState type="submit" text={'บันทึก'} isLoading={isLoading} />
            </Form>
        </Container>
    );
};

export default Borrow;
