import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    const inputRef = useRef<HTMLFormElement>(null);

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
    }, []);

    const fetchAvailableEquipment = async () => {
        try {
            const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/getAvailableEquipment`);
            if (response.data?.data) {
                setAvailableEquipment(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching available equipment:", error);
            setAlert({ show: true, message: 'ไม่สามารถโหลดรายการอุปกรณ์ได้' });
        }
    };

    const handleSave = () => {
        if (selectedEquipment) {
            setListItem([...listItem, { 
                equipment_id: selectedEquipment.equipment_id, 
                equipment_name: selectedEquipment.equipment_name, 
                equipment_code: selectedEquipment.equipment_code 
            }]);
            setModalSave(false);
            setValidatedModal(false);
        } else {
            setValidatedModal(true);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

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
                borrow_user_id: 1, // ใส่ user_id ตามจริง
                borrow_address: event.currentTarget['borrow_address'].value,
                borrow_tel: event.currentTarget['borrow_tel'].value,
                borrow_objective: event.currentTarget['borrow_objective'].value,
                borrow_name: event.currentTarget['borrow_name'].value,
                borrow_list: listItem.map(item => ({
                    equipment_id: item.equipment_id,
                    equipment_name: item.equipment_name,
                    equipment_code: item.equipment_code
                }))
            };

            await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/create`, data);
            setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' });
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
