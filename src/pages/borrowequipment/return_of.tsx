import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
  const [validated, setValidated] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [isLoading, setLoading] = useState(false);
  const [listItem, setListItem] = useState<ListItemType[]>([]);
  const apiEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/borrowequipment/list`; // ตรวจสอบว่า NEXT_PUBLIC_API_URL ตั้งค่าไว้ใน .env

  // ✅ ดึงข้อมูลจากฐานข้อมูลเมื่อ component โหลด
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Fetching data from: ${apiEndpoint}`);
        const response = await axios.get(apiEndpoint);

        if (response.data && response.data.data) {
          console.log("✅ Data received:", response.data.data);
          const formattedData = response.data.data.map((item: any) => ({
            listName: item.borrow_equipment, // ดึงชื่ออุปกรณ์
            numberCard: item.borrow_equipment_number, // ดึงหมายเลขอุปกรณ์
            startDate: item.borrow_date || "N/A",  // แก้ให้ตรงกับฟิลด์จริง
            endDate: item.borrow_return || "N/A"   // แก้ให้ตรงกับฟิลด์จริง
          }));
          setListItem(formattedData);
        } else {
          console.warn("⚠️ No data found in response");
          setAlert({ show: true, message: 'ไม่มีข้อมูลการยืมอุปกรณ์' });
        }
      } catch (error) {
        console.error("❌ Error fetching borrow equipment:", error);
        setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' });
      }
    };

    fetchData();
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    setLoading(true);

    if (!form.checkValidity()) {
      setAlert({ show: true, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      event.preventDefault();
      event.stopPropagation();
    } else {
      setAlert({ show: true, message: 'ระบบยังอยู่ในช่วงพัฒนา' });
      event.preventDefault();
      event.stopPropagation();
    }

    setTimeout(() => {
      setLoading(false);
    }, 2000);
    setValidated(true);
  };

  const removeListener = (index: number) => {
    setListItem(listItem.filter((_, i) => i !== index));
  };

  return (
    <Container>
      <div className={styles.main}>
        <h1 className="py-2">คืนอุปกรณ์ครุภัณฑ์</h1>
      </div>
      <div className="px-5">
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="py-2">
            {listItem.length > 0 ? (
              listItem.map((item, index) => (
                <Toast key={index} onClose={() => removeListener(index)} className="mb-2">
                  <Toast.Header>
                    <strong className="me-auto">{item.listName}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    {item.numberCard}
                    <div className={styles.toastDate}>
                      <span>เริ่ม {item.startDate}</span>
                      <span>สิ้นสุด {item.endDate}</span>
                    </div>
                  </Toast.Body>
                </Toast>
              ))
            ) : (
              <p className="text-center">ไม่มีข้อมูลการยืมอุปกรณ์</p>
            )}
          </Form.Group>

          <Form.Group className="d-flex justify-content-center py-3">
            <ButtonState type="submit" className={styles.button} text={'บันทึก'} icon="fas fa-save" isLoading={isLoading} />
          </Form.Group>
        </Form>
      </div>
    </Container>
  );
};

export default ReturnOf;
