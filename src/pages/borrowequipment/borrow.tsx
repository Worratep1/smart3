import React, { useState, useRef, useEffect, useCallback } from 'react';
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

    const [validated, setValidated] = useState(false);
    const [validatedModal, setValidatedModal] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '' });
    const [isLoading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [modalSave, setModalSave] = useState(false);

    const [user, setUser] = useState<any>(null);
    const [availableEquipment, setAvailableEquipment] = useState<EquipmentType[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);
    const [listItem, setListItem] = useState<EquipmentType[]>([]);

    useEffect(() => {
        fetchAvailableEquipment();
        fetchUserData();
    }, []);

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
            const auToken = router.query.auToken;
            if (auToken) {
                const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`);
                if (responseUser.data?.data) {
                    setUser(responseUser.data.data);
                } else {
                    setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setAlert({ show: true, message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้' });
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
    
        // ตรวจสอบค่าของ listItem ก่อนการบันทึก
        console.log("🚀 ~ handleSubmit ~ listItem:", listItem);  // ตรวจสอบค่า listItem ก่อนการบันทึก
    
        // หากไม่มีอุปกรณ์หรือผู้ใช้ไม่ได้รับการโหลด จะมีการแสดงแจ้งเตือน
        if (!listItem.length || !user) {
            setAlert({ show: true, message: 'กรุณาเลือกอุปกรณ์และกรอกข้อมูลให้ครบถ้วน' });
            return;
        }
    
        // การส่งข้อมูลไปยัง API หลังจากการตรวจสอบข้อมูล
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
                borrow_list: listItem.map(item => ({ equipment_id: item.equipment_id }))
            };
    
            await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/create`, data);
            setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' });
        } catch (error) {
            setAlert({ show: true, message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง' });
        } finally {
            setLoading(false);
            setValidated(true);
        }
    };
    
    // แก้ไขใน handleAddEquipment โดยการใช้ prevList เพื่ออัพเดต listItem
    const handleAddEquipment = () => {
        if (selectedEquipment && !listItem.some(item => item.equipment_id === selectedEquipment.equipment_id)) {
            setListItem(prevList => [...prevList, selectedEquipment]);  // ใช้ prevList เพื่ออัพเดตค่าของ listItem
            setModalSave(false);
        } else {
            setValidatedModal(true);
            setAlert({ show: true, message: 'กรุณาเลือกอุปกรณ์ที่แตกต่างกัน' });
        }
    };
    
    // การเลือกอุปกรณ์จาก Form.Select และอัพเดต selectedEquipment
    const handleSelectEquipment = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selected = availableEquipment.find(eq => eq.equipment_id === Number(selectedId));
        if (selected) {
            setSelectedEquipment(selected);
        } else {
            setSelectedEquipment(null);
        }
    };
    

    const removeItem = (index: number) => {
        setListItem(listItem.filter((_, i) => i !== index));
    };

    return (
        <Container>
            <div className={styles.main}>
                <h1 className="py-2">ยืมอุปกรณ์ครุภัณฑ์</h1>
            </div>
            <div className="px-5">
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <InputLabel label='ชื่อผู้ยืม' id="borrow_name" required />
                    <TextareaLabel label='ที่อยู่' id="borrow_address" required />
                    <InputLabel label='หมายเลขโทรศัพท์' id="borrow_tel" required />
                    <InputLabel label='ขอยืมครุภัณฑ์เพื่อ' id="borrow_objective" required />
                    
                    <p className="m-0">วันเดือนปี (เริ่ม)</p>
                    <DatePickerX selected={startDate} onChange={setStartDate} />

                    <p className="m-0">วันเดือนปี (สิ้นสุด)</p>
                    <DatePickerX selected={endDate} onChange={setEndDate} />

                    <Form.Group className="py-2">
                        {listItem.length > 0 && listItem.map((item, index) => (
                            <Toast key={index} onClose={() => removeItem(index)} className="mb-2">
                                <Toast.Header>
                                    <strong className="me-auto">{item.equipment_name}</strong>
                                </Toast.Header>
                                <Toast.Body>{item.equipment_code}</Toast.Body>
                            </Toast>
                        ))}
                        <Col sm={2}>
                            <ButtonAdd onClick={() => setModalSave(true)} title='เพิ่มข้อมูลอุปกรณ์' />
                        </Col>
                    </Form.Group>

                    <Form.Group className="d-flex justify-content-center py-3">
                        <ButtonState type="submit" text={'บันทึก'} isLoading={isLoading} />
                    </Form.Group>
                </Form>
            </div>

            <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />
            
            <ModalActions show={modalSave} title='เพิ่มข้อมูลอุปกรณ์' onClick={handleAddEquipment} onHide={() => setModalSave(false)}>
                <Form noValidate validated={validatedModal}>
                    <Form.Group>
                        <Form.Label>เลือกอุปกรณ์</Form.Label>
                        <Form.Select onChange={(e) => {
                            const selected = availableEquipment.find(eq => eq.equipment_id === Number(e.target.value));
                            if (selected) setSelectedEquipment(selected);
                        }}>
                            <option value="">-- เลือกอุปกรณ์ --</option>
                            {availableEquipment.map(e => (
                                <option key={e.equipment_id} value={e.equipment_id}>
                                    {e.equipment_name} - {e.equipment_code}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Form>
            </ModalActions>
        </Container>
    );
};

export default Borrow;
