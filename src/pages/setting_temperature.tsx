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
import RangeSlider from '@/components/RangeSlider/RangeSlider'

import styles from '@/styles/page.module.css'

interface DataUserState {
  isLogin: boolean
  userData: any | null
  takecareData: any | null
}

interface SafezoneStage {
  takecare_id: number
  users_id: number
  safezone_id?: number
  safez_radiuslv1: number
}

const Setting = () => {
  const router = useRouter()

  const [alert, setAlert] = useState({ show: false, message: '' })
  const [isLoading, setLoading] = useState(false)
  const [range, setRange] = useState(10)  // เหลือแค่ range เดียว
  const [dataUser, setDataUser] = useState<DataUserState>({ isLogin: false, userData: null, takecareData: null })
  const [idSafezoneStage, setIdSafezoneStage] = useState(0)

  useEffect(() => {
    const auToken = router.query.auToken
    if (auToken) {
      onGetUserData(auToken as string)
    }
  }, [router.query.auToken])

  const onGetSafezone = async (idSafezone: string, takecareData: any, userData: any) => {
    try {
      const resSafezone = await axios.get(`${process.env.WEB_DOMAIN}/api/setting/getSafezone?takecare_id=${takecareData.takecare_id}&users_id=${userData.users_id}&id=${idSafezone}`)
      if (resSafezone.data?.data) {
        const data = resSafezone.data?.data
        setRange(data.safez_radiuslv1)
        setIdSafezoneStage(Number(idSafezone))
      }
    } catch (error) {
      console.log('Error onGetSafezone:', error)
      setDataUser({ isLogin: false, userData: null, takecareData: null })
      setAlert({ show: true, message: 'ระบบไม่สามารถดึงข้อมูลของท่านได้ กรุณาลองใหม่อีกครั้ง' })
    }
  }

  const onGetUserData = async (auToken: string) => {
    try {
      const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`)
      if (responseUser.data?.data) {
        const responseTakecareperson = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUserTakecareperson/${responseUser.data.data.users_id}`)
        const data = responseTakecareperson.data?.data
        if (data) {
          setDataUser({ isLogin: true, userData: responseUser.data.data, takecareData: data })
          const idSafezone = router.query.idsafezone
          if (Number(idSafezone) > 0) {
            onGetSafezone(idSafezone as string, data, responseUser.data.data)
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
        let data: SafezoneStage = {
          takecare_id: dataUser.takecareData.takecare_id,
          users_id: dataUser.userData.users_id,
          safez_radiuslv1: range,
        }
        if (idSafezoneStage > 0) {
          data['safezone_id'] = idSafezoneStage
        }
        const res = await axios.post(`${process.env.WEB_DOMAIN}/api/setting/saveSafezone`, data)
        if (res.data?.id) {
          router.push(`/setting?auToken=${router.query.auToken}&idsafezone=${res.data.id}`)
          setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' })
        } else {
          setAlert({ show: true, message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่' })
        }
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
      setAlert({ show: true, message: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่' })
    }
  }

  return (
    <>
      {!dataUser.isLogin ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Container className="py-3" style={{ maxWidth: 400 }}>
          <Row>
            <Col sm={12}>
              <p>กรุณาตั้งค่าอุณหภูมิร่างกายสูงสุดที่ต้องการใช้เป็นเกณฑ์เตือน</p>
            </Col>
          </Row>
          <Row className="py-3">
            <Col sm={12}>
              <p>
                อุณหภูมิสูงสุด(°C) :{' '}
                <span style={{ fontSize: 20, color: '#000' }}>{range}</span> ()
              </p>
              <RangeSlider max={10000} value={range} onChange={(e) => setRange(e)} />
            </Col>
          </Row>
          {dataUser.takecareData && dataUser.userData ? (
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
          ) : null}

          <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />
        </Container>
      )}
    </>
  )
}

export default Setting
