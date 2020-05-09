import axios from 'axios'

import {
  GetDeviceResponse,
  GenericResponse,
  GetDashboardResponse,
} from './apiTypes'
import { valueFromPowerState, valueFromMode, valueFromFan } from './convert'
import ThinqAuth from './auth'

export default class ThinqApi {
  thinqAuth: ThinqAuth

  constructor(thinqAuth: ThinqAuth) {
    this.thinqAuth = thinqAuth
  }

  getIsLoggedIn() {
    return this.thinqAuth.getIsLoggedIn()
  }

  async getDashboard() {
    const response = await axios({
      method: 'GET',
      responseType: 'json',
      url: `https://aic-service.lgthinq.com:46030/v1/service/application/dashboard`,
      headers: this.generateHeaders(),
    })
    return response.data as GetDashboardResponse
  }

  async getDevice(deviceId: string) {
    const response = await axios({
      method: 'GET',
      responseType: 'json',
      url: `https://aic-service.lgthinq.com:46030/v1/service/devices/${deviceId}`,
      headers: this.generateHeaders(),
    })
    return response.data as GetDeviceResponse
  }

  async setPower(deviceId: string, powerState: 'on' | 'off') {
    return await this.sendCommand(
      deviceId,
      'Operation',
      'airState.operation',
      valueFromPowerState(powerState),
    )
  }

  async setMode(deviceId: string, mode: 'fan' | 'dry' | 'cool') {
    return await this.sendCommand(
      deviceId,
      'Set',
      'airState.opMode',
      valueFromMode(mode),
    )
  }

  async setFan(deviceId: string, fan: 'low' | 'medium' | 'high') {
    return await this.sendCommand(
      deviceId,
      'Set',
      'airState.windStrength',
      valueFromFan(fan),
    )
  }

  private async sendCommand(
    deviceId: string,
    command: 'Set' | 'Operation',
    dataKey: string,
    dataValue: string,
  ) {
    const response = await axios({
      method: 'POST',
      responseType: 'json',
      url: `https://aic-service.lgthinq.com:46030/v1/service/devices/${deviceId}/control-sync`,
      headers: this.generateHeaders(),
      data: {
        dataKey,
        dataValue,
        command,
        ctrlKey: 'basicCtrl',
      },
    })
    return response.data as GenericResponse
  }

  private generateHeaders() {
    return {
      'X-Thinq-App-Ver': '3.0.2100',
      'X-Thinq-App-Type': 'NUTS',
      'X-Language-Code': 'en-US',
      'X-Client-Id':
        'dda6bf26a674a02bc1e8612e9884b2253fda2b2fbc57b47702a80011b72f02ca',
      'X-Thinq-App-Level': 'PRD',
      'X-User-No': this.thinqAuth.userNumber,
      'X-Service-Code': 'SVC202',
      'Accept-Language': 'en-us',
      'X-Message-Id': '89ZfpKmsH8qXUmar7uQkX.',
      'X-Emp-Token': this.thinqAuth.accessToken,
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'X-Api-Key': 'VGhpblEyLjAgU0VSVklDRQ==',
      'X-Thinq-App-Os': 'IOS',
      'X-Country-Code': 'US',
      'X-Service-Phase': 'OP',
      'Accept-Encoding': 'gzip',
    }
  }
}
