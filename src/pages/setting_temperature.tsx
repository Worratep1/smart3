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

interface DataUserState {
  isLogin: boolean
  userData: any | null
  takecareData: any | null
}

const Setting = () => {
  const router = useRouter()

  const [alert, setAlert] = useState({ show: false, message: '' })
  const [isLoading, setLoading] = useState(true)
  const [temperature, setTemperature] = useState(37.0)
  const [dataUser, setDataUser] = useState<DataUserState>({ isLogin: false, userData: null, takecareData: null })

  useEffect(() => {
    const auToken = router.query.auToken
    if (auToken) {
      onGetUserData(auToken as string)
    }
  }, [router.isReady, router.query.auToken])

  const onGetUserData = async (auToken: string) => {
    try {
      const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`)
      if (responseUser.data?.data) {
        const userData = responseUser.data.data
        const responseTakecareperson = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUserTakecareperson/${userData.users_id}`)
        const takecareData = responseTakecareperson.data?.data
        if (takecareData) {
          setDataUser({ isLogin: true, userData, takecareData })

          // ดึงข้อมูลอุณหภูมิจาก backend
          const resTemp = await axios.get(`${process.env.WEB_DOMAIN}/api/setting_temperature/getTemperature`, {
            params: {
              takecare_id: takecareData.takecare_id,
              users_id: userData.users_id
            }
          })

          if (resTemp.data?.success && resTemp.data.data?.max_temperature) {
            setTemperature(resTemp.data.data.max_temperature)
          }
        } else {
          alertModal()
        }
      } else {
        alertModal()
      }
    } catch (error) {
      console.error(error)
      alertModal()
    } finally {
      setLoading(false)
    }
  }

  const alertModal = () => {
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
        }
      }
    } catch (error) {
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
      <Row>
        <Col sm={12}>
          <p>กรุณาตั้งค่าอุณหภูมิร่างกายสูงสุดที่ต้องการใช้เป็นเกณฑ์แจ้ง</p>
        </Col>
      </Row>
      <Row className="py-3">
        <Col sm={12}>
          <p>
            อุณหภูมิสูงสุด (°C):{' '}
            <span style={{ fontWeight: 'bold', fontSize: 20 }}>{temperature.toFixed(1)}</span>
          </p>
          <input
            type="range"
            min={35}
            max={42}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
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
