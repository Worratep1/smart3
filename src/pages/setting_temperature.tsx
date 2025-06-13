'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'

import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import ButtonState from '@/components/Button/ButtonState'
import ModalAlert from '@/components/Modals/ModalAlert'

import styles from '@/styles/page.module.css'
import { encrypt } from '@/utils/helpers'

interface DataUserState {
  isLogin: boolean
  userData: any | null
  takecareData: any | null
}

const Setting = () => {
  const router = useRouter()

  const [alert, setAlert] = useState({ show: false, message: '' })
  const [isLoading, setLoading] = useState(false)
  const [temperature, setTemperature] = useState(30) // ค่าเริ่มต้นอุณหภูมิ
  const [dataUser, setDataUser] = useState<DataUserState>({ isLogin: false, userData: null, takecareData: null })

  useEffect(() => {
    if (!router.isReady) return

    const auToken = router.query.auToken
    if (auToken) {
      onGetUserData(auToken as string)
    }
  }, [router.isReady, router.query.auToken])

  const onGetUserData = async (auToken: string) => {
    try {
      console.log("เรียก API getUser with auToken:", auToken)
      const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`)
      if (responseUser.data?.data) {
        const userData = responseUser.data.data
        console.log("ข้อมูล userData:", userData)
        
        // เรียก API getUserTakecareperson โดยใช้ path param ตามที่แก้ไข
        const responseTakecareperson = await axios.get(
          `${process.env.WEB_DOMAIN}/api/user/getUserTakecareperson/${encrypt(userData.users_id.toString())}`
        )
        console.log("เรียก API getUserTakecareperson with userData.users_id:", userData.users_id)

        const takecareData = responseTakecareperson.data?.data
        console.log("ข้อมูล takecareData:", takecareData)

        if (takecareData) {
          setDataUser({ isLogin: true, userData, takecareData })

          // ดึงข้อมูลอุณหภูมิจาก backend
          const resTemp = await axios.get(`${process.env.WEB_DOMAIN}/api/setting_temperature/getTemperature`, {
            params: {
              takecare_id: takecareData.takecare_id,
              users_id: userData.users_id
            }
          })
          console.log("ข้อมูล temperature:", resTemp.data)

          if (resTemp.data?.success && resTemp.data.data?.max_temperature) {
            setTemperature(resTemp.data.data.max_temperature)
          } else {
            console.log('ไม่พบข้อมูลอุณหภูมิ หรือ API response ไม่สำเร็จ', resTemp.data)
          }
        } else {
          alertModal()
        }
      } else {
        alertModal()
      }
    } catch (error) {
      console.error('onGetUserData error:', error)
      alertModal()
    } finally {
      setLoading(false)
    }
  }

  const alertModal = () => {
    console.log("🚀 ~ file: registration.tsx:66 ~ onGetUserData ~ error:")
    setAlert({ show: true, message: 'ระบบไม่สามารถดึงข้อมูลของท่านได้ กรุณาลองใหม่อีกครั้ง' })
    setDataUser({ isLogin: false, userData: null, takecareData: null })
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      if (dataUser.takecareData && dataUser.userData) {
        const data = {
          takecare_id: dataUser.takecareData.takecare_id,
          users_id: dataUser.userData.users_id,
          max_temperature: temperature,
        }
        const res = await axios.post(`${process.env.WEB_DOMAIN}/api/setting_temperature/saveTemperature`, data)
        if (res.data?.success) {
          setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' })
        } else {
          setAlert({ show: true, message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่' })
          console.log('API saveTemperature response error:', res.data)
        }
      }
    } catch (error) {
      console.error('handleSave error:', error)
      setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' })
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  return (
   <Container className="py-3" style={{ maxWidth: 400 }}>
  <Row className="mb-4">
    <Col sm={12}>
      <p>กรุณาตั้งค่าอุณหภูมิร่างกายที่ต้องการใช้เป็นเกณฑ์แจ้ง</p>
      <div className="d-flex align-items-center justify-content-between">
        {/* ส่วนแสดงค่าอุณหภูมิด้านซ้าย */}
        <div className="text-start">
          <p className="mb-1">อุณหภูมิ(°C)</p>
          <span style={{ fontWeight: 'bold', fontSize: 30 }}>
            {temperature.toFixed(1)}
          </span>
        </div>

        {/* ส่วนปุ่มด้านขวา */}
        <div className="d-flex flex-column gap-2">
          <button 
            className="btn btn-outline-primary" 
            onClick={() => setTemperature(prev => Math.min(42, prev + 0.1))}
            style={{ width: '40px', height: '40px' }}
          >
            <i className="fas fa-plus"></i>
          </button>
          
          <button 
            className="btn btn-outline-primary"
            onClick={() => setTemperature(prev => Math.max(35, prev - 0.1))}
            style={{ width: '40px', height: '40px' }}
          >
            <i className="fas fa-minus"></i>
          </button>
        </div>
      </div>
    </Col>
  </Row>
      <Row>
        <Col sm={12}>
          <ButtonState
            className={styles.button}
            text={'บันทึก'}
            icon="fas fa-save"
            isLoading={isLoading}
            onClick={handleSave}
          />
        </Col>
      </Row>
      <ModalAlert
        show={alert.show}
        message={alert.message}
        handleClose={() => setAlert({ show: false, message: '' })}
      />
    </Container>
  )
}

export default Setting
