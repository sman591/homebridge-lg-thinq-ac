import axios from 'axios'

import {
  GetDeviceResponse,
  GenericResponse,
  GetDashboardResponse,
} from './apiTypes'

const X_USER_NO = ''
const X_EMP_TOKEN = ''

function generateHeaders() {
  return {
    'X-Thinq-App-Ver': '3.0.2100',
    'X-Thinq-App-Type': 'NUTS',
    'X-Language-Code': 'en-US',
    'X-Client-Id':
      'dda6bf26a674a02bc1e8612e9884b2253fda2b2fbc57b47702a80011b72f02ca',
    'X-Thinq-App-Level': 'PRD',
    'X-User-No': X_USER_NO,
    'X-Service-Code': 'SVC202',
    'Accept-Language': 'en-us',
    'X-Message-Id': '89ZfpKmsH8qXUmar7uQkX.',
    'X-Emp-Token': X_EMP_TOKEN,
    Accept: 'application/json',
    'Content-Type': 'application/json;charset=UTF-8',
    'X-Api-Key': 'VGhpblEyLjAgU0VSVklDRQ==',
    'X-Thinq-App-Os': 'IOS',
    'X-Country-Code': 'US',
    'X-Service-Phase': 'OP',
    'Accept-Encoding': 'gzip',
  }
}

export async function getDashboard() {
  const response = await axios({
    method: 'GET',
    responseType: 'json',
    url: `https://aic-service.lgthinq.com:46030/v1/service/application/dashboard`,
    headers: generateHeaders(),
  })
  return response.data as GetDashboardResponse
}

export async function getDevice(deviceId: string) {
  const response = await axios({
    method: 'GET',
    responseType: 'json',
    url: `https://aic-service.lgthinq.com:46030/v1/service/devices/${deviceId}`,
    headers: generateHeaders(),
  })
  return response.data as GetDeviceResponse
}

async function sendCommand(
  deviceId: string,
  command: 'Set' | 'Operation',
  dataKey: string,
  dataValue: string,
) {
  const response = await axios({
    method: 'POST',
    responseType: 'json',
    url: `https://aic-service.lgthinq.com:46030/v1/service/devices/${deviceId}/control-sync`,
    headers: generateHeaders(),
    data: {
      dataKey,
      dataValue,
      command,
      ctrlKey: 'basicCtrl',
    },
  })
  return response.data as GenericResponse
}

const powerStateValueMap = {
  on: '1',
  off: '0',
} as const
export async function setPower(deviceId: string, powerState: 'on' | 'off') {
  return await sendCommand(
    deviceId,
    'Operation',
    'airState.operation',
    powerStateValueMap[powerState],
  )
}

const modeValueMap = {
  cool: '0',
  dry: '1',
  fan: '2',
} as const
export async function setMode(deviceId: string, mode: 'fan' | 'dry' | 'cool') {
  return await sendCommand(
    deviceId,
    'Set',
    'airState.opMode',
    modeValueMap[mode],
  )
}

const fanValueMap = {
  low: '2',
  medium: '4',
  high: '6',
} as const
export async function setFan(deviceId: string, fan: 'low' | 'medium' | 'high') {
  return await sendCommand(
    deviceId,
    'Set',
    'airState.windStrength',
    fanValueMap[fan],
  )
}
