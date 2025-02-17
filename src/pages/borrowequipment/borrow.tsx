import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
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
    const [user, setUser] = useState<UserDataProps | null>(null);
    
    // เก็บรายการอุปกรณ์ที่ว่าง
    const [availableEquipment, setAvailableEquipment] = useState<EquipmentType[]>([]);
    
    // เก็บอุปกรณ์ที่เลือก
    const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);

    useEffect(() => {
        fetchAvailableEquipment();
    }, []);

    // โหลดข้อมูลอุปกรณ์ที่สามารถยืมได้
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

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
    
        const form = event.currentTarget;
        if (!form.checkValidity()) {
            setAlert({ show: true, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
            return;
        }
    
        setLoading(true);
    
        try {
            if (listItem.length && user && startDate && endDate) {
                const data = {
                    borrow_date: startDate,
                    borrow_return: endDate,
                    borrow_status: 1,
                    borrow_user_id: user.users_id,
                    borrow_address: form['borrow_address'].value,
                    borrow_tel: form['borrow_tel'].value,
                    borrow_objective: form['borrow_objective'].value,
                    borrow_name: form['borrow_name'].value,
                    borrow_list: listItem.map(item => ({
                        equipment_name: item.listName,
                        equipment_code: item.numberCard
                    }))
                };
    
                await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/create`, data);
                setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' });
            } else {
                setAlert({ show: true, message: 'กรุณาเพิ่มข้อมูลอุปกรณ์' });
            }
        } catch (error) {
            setAlert({ show: true, message: 'ระบบไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง' });
        } finally {
            setLoading(false);
            setValidated(true);
        }
    }, [listItem, user, startDate, endDate]);

    const handleSave = async () => {
        if (selectedEquipment) {
            setListItem([...listItem, { 
                listName: selectedEquipment.equipment_name, 
                numberCard: selectedEquipment.equipment_code 
            }]);
            setModalSave(false);
            setValidatedModal(false);
        } else {
            setValidatedModal(true);
        }
    };

    const removeListener = (index: number) => {
        const newList = listItem.filter((_, i) => i !== index);
        setListItem(newList);
    };

    return (
        <Container>
            <div className={styles.main}>
                <h1 className="py-2">ยืมอุปกรณ์ครุภัณฑ์</h1>
            </div>
            <div className="px-5">
                <Form noValidate validated={validated} onSubmit={(e) => handleSubmit(e)}>
                    <Form.Group>
                        <InputLabel label='ชื่อผู้ยืม' id="borrow_name" placeholder="กรอกชื่อผู้ยืม" required />
                    </Form.Group>
                    <Form.Group>
                        <TextareaLabel label='ที่อยู่' id="borrow_address" placeholder="กรอกที่อยู่" required />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label='หมายเลขโทรศัพท์' id="borrow_tel" placeholder="กรอกหมายเลขโทรศัพท์" type="number" required />
                    </Form.Group>
                    <Form.Group>
                        <InputLabel label='ขอยืมครุภัณฑ์เพื่อ' id="borrow_objective" placeholder="กรอกประสงค์ขอยืม" required />
                    </Form.Group>

                    {/* แสดงรายการอุปกรณ์ที่เลือก */}
                    <Form.Group className="py-2">
                        {listItem.length > 0 && listItem.map((item, index) => (
                            <Toast key={index} onClose={() => removeListener(index)} className="mb-2">
                                <Toast.Header>
                                    <strong className="me-auto">{item.listName}</strong>
                                </Toast.Header>
                                <Toast.Body>{item.numberCard}</Toast.Body>
                            </Toast>
                        ))}

                        <Col sm={2}>
                            <ButtonAdd onClick={() => setModalSave(true)} title='เพิ่มข้อมูลอุปกรณ์' />
                        </Col>
                    </Form.Group>

                    <Form.Group className="d-flex justify-content-center py-3">
                        <ButtonState type="submit" className={styles.button} text={'บันทึก'} icon="fas fa-save" isLoading={isLoading} />
                    </Form.Group>
                </Form>
            </div>

            {/* Modal เลือกอุปกรณ์ */}
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
}

export default Borrow;
