import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import Col from 'react-bootstrap/Col';

import ModalAlert from '@/components/Modals/ModalAlert';
import ModalActions from '@/components/Modals/ModalActions';
import ButtonState from '@/components/Button/ButtonState';
import ButtonAdd from '@/components/Button/ButtonAdd';

import styles from '@/styles/page.module.css';

interface EquipmentType {
    equipment_id: number;
    equipment_name: string;
    equipment_code: string;
}

interface ListItemType {
    equipment_id: number;
    equipment_name: string;
    equipment_code: string;
}

const Borrow = () => {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [validated, setValidated] = useState(false);
    const [validatedModal, setValidatedModal] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '' });
    const [isLoading, setLoading] = useState(false);
    const [modalSave, setModalSave] = useState(false);
    const [listItem, setListItem] = useState<ListItemType[]>([]);
    const [availableEquipment, setAvailableEquipment] = useState<EquipmentType[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);

    useEffect(() => {
        fetchAvailableEquipment();
        const auToken = router.query.auToken;
        if (auToken) {
            onGetUserData(auToken as string);
        }
    }, [router]);

    // ✅ ดึงข้อมูลผู้ใช้ที่ล็อกอิน
    const onGetUserData = async (auToken: string) => {
        try {
            const responseUser = await axios.get(`/api/user/getUser/${auToken}`);
            if (responseUser.data?.data) {
                setUser(responseUser.data.data);
            } else {
                setAlert({ show: true, message: 'ระบบไม่สามารถดึงข้อมูลของท่านได้' });
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
        }
    };

    // ✅ โหลดอุปกรณ์ที่สามารถยืมได้จากฐานข้อมูล
    const fetchAvailableEquipment = async () => {
        try {
            const response = await axios.get('/api/borrowequipment/getAvailableEquipment');
            if (response.data?.data) {
                setAvailableEquipment(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching available equipment:", error);
            setAlert({ show: true, message: 'ไม่สามารถโหลดรายการอุปกรณ์ได้' });
        }
    };

    // ✅ บันทึกอุปกรณ์ที่เลือกไปในรายการ
    const handleSave = () => {
        if (selectedEquipment) {
            setListItem([...listItem, {
                equipment_id: selectedEquipment.equipment_id,
                equipment_name: selectedEquipment.equipment_name,
                equipment_code: selectedEquipment.equipment_code
            }]);
            setSelectedEquipment(null); // ✅ รีเซ็ตค่า
            setModalSave(false);
            setValidatedModal(false);
        } else {
            setValidatedModal(true);
        }
    };

    // ✅ ส่งข้อมูลไปยัง API `create.ts`
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!user) {
            setAlert({ show: true, message: 'กรุณาล็อกอินก่อนทำรายการ' });
            return;
        }

        if (listItem.length === 0) {
            setAlert({ show: true, message: 'กรุณาเพิ่มข้อมูลอุปกรณ์' });
            return;
        }

        setLoading(true);

        try {
            const data = {
                borrow_date: new Date(),
                borrow_return: new Date(),
                borrow_status: 1,
                borrow_user_id: user.users_id,  // ✅ ใช้ ID ของผู้ใช้ที่ล็อกอิน
                borrow_address: event.currentTarget['borrow_address'].value,
                borrow_tel: event.currentTarget['borrow_tel'].value,
                borrow_objective: event.currentTarget['borrow_objective'].value,
                borrow_name: event.currentTarget['borrow_name'].value,
                borrow_list: listItem
            };

            await axios.post('/api/borrowequipment/create', data);
            setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' });

            // ✅ ล้างรายการที่เลือกหลังจากบันทึกสำเร็จ
            setListItem([]);
            fetchAvailableEquipment(); // ✅ โหลดรายการอุปกรณ์ใหม่

        } catch (error) {
            setAlert({ show: true, message: 'ระบบไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง' });
        } finally {
            setLoading(false);
            setValidated(true);
        }
    };

    return (
        <Container>
            <h1 className="py-2">ยืมอุปกรณ์ครุภัณฑ์</h1>

            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group>
                    <Form.Label>ชื่อผู้ยืม</Form.Label>
                    <Form.Control id="borrow_name" placeholder="กรอกชื่อผู้ยืม" required />
                </Form.Group>
                <Form.Group>
                    <Form.Label>ที่อยู่</Form.Label>
                    <Form.Control id="borrow_address" placeholder="กรอกที่อยู่" required />
                </Form.Group>
                <Form.Group>
                    <Form.Label>หมายเลขโทรศัพท์</Form.Label>
                    <Form.Control id="borrow_tel" placeholder="กรอกหมายเลขโทรศัพท์" required />
                </Form.Group>
                <Form.Group>
                    <Form.Label>ขอยืมครุภัณฑ์เพื่อ</Form.Label>
                    <Form.Control id="borrow_objective" placeholder="กรอกประสงค์ขอยืม" required />
                </Form.Group>

                <Form.Group className="py-2">
                    {listItem.map((item, index) => (
                        <Toast key={index}>
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
                    <ButtonState type="submit" text={'บันทึก'} icon="fas fa-save" isLoading={isLoading} />
                </Form.Group>
            </Form>

            <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />

            <ModalActions show={modalSave} title='เพิ่มข้อมูลอุปกรณ์' onClick={handleSave} onHide={() => setModalSave(false)}>
                <Form noValidate validated={validatedModal}>
                    <Form.Group>
                        <Form.Label>รายการอุปกรณ์</Form.Label>
                        <Form.Select onChange={(e) => {
                            const selected = availableEquipment.find(eq => eq.equipment_id === parseInt(e.target.value));
                            if (selected) setSelectedEquipment(selected);
                        }}>
                            <option value="">-- เลือกอุปกรณ์ --</option>
                            {availableEquipment.map(e => <option key={e.equipment_id} value={e.equipment_id}>{e.equipment_name}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Form>
            </ModalActions>
        </Container>
    );
};

export default Borrow;
