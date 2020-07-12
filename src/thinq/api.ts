import axios from 'axios'

import {
  GetDeviceResponse,
  GenericResponse,
  GetDashboardResponse,
  GetGatewayUriResponse,
  ApiHeaders,
} from './apiTypes'
import ThinqAuth from './auth'
import { PartialThinqConfig, ThinqConfig } from './thinqConfig'

export default class ThinqApi {
  readonly thinqConfig: ThinqConfig
  readonly thinqAuth: ThinqAuth

  constructor(thinqConfig: ThinqConfig, thinqAuth: ThinqAuth) {
    this.thinqConfig = thinqConfig
    this.thinqAuth = thinqAuth
  }

  static async getGatewayUri(thinqConfig: PartialThinqConfig) {
    const response = await axios({
      method: 'GET',
      responseType: 'json',
      url: `https://route.lgthinq.com:46030/v1/service/application/gateway-uri`,
      headers: this.generateHeaders(thinqConfig),
    })
    return response.data as GetGatewayUriResponse
  }

  getIsLoggedIn() {
    return this.thinqAuth.getIsLoggedIn()
  }

  async getDashboard() {
    const response = await axios({
      method: 'GET',
      responseType: 'json',
      url: `${this.thinqConfig.apiBaseUriV2}/service/application/dashboard`,
      headers: this.generateHeaders(),
    })
    return response.data as GetDashboardResponse
  }

  async getDevice(deviceId: string) {
    const response = await axios({
      method: 'GET',
      responseType: 'json',
      url: `${this.thinqConfig.apiBaseUriV2}/service/devices/${deviceId}`,
      headers: this.generateHeaders(),
    })
    return response.data as GetDeviceResponse
  }

  async sendAllEventEnable(deviceId: string) {
    const response = await axios({
      method: 'POST',
      responseType: 'json',
      url: `${this.thinqConfig.apiBaseUriV2}/service/devices/${deviceId}/control`,
      headers: this.generateHeaders(),
      data: {
        ctrlKey: 'allEventEnable',
        command: 'Set',
        dataKey: 'airState.mon.timeout',
        dataValue: '70',
      },
    })
    return response.data as GenericResponse
  }

  async sendCommand(
    deviceId: string,
    command: 'Set' | 'Operation',
    dataKey: string,
    dataValue: string | number,
  ) {
    const response = await axios({
      method: 'POST',
      responseType: 'json',
      url: `${this.thinqConfig.apiBaseUriV2}/service/devices/${deviceId}/control-sync`,
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

  static generateHeaders(
    thinqPartialConfig: PartialThinqConfig,
    thinqAuth?: ThinqAuth,
  ): ApiHeaders {
    const headers: ApiHeaders = {
      'X-Thinq-App-Ver': '3.0.2100',
      'X-Thinq-App-Type': 'NUTS',
      'X-Language-Code': thinqPartialConfig.languageCode,
      'X-Client-Id':
        'dda6bf26a674a02bc1e8612e9884b2253fda2b2fbc57b47702a80011b72f02ca',
      'X-Thinq-App-Level': 'PRD',
      'X-Service-Code': 'SVC202',
      'Accept-Language': thinqPartialConfig.languageCode,
      'X-Message-Id': '89ZfpKmsH8qXUmar7uQkX.',
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'X-Api-Key': 'VGhpblEyLjAgU0VSVklDRQ==',
      'X-Thinq-App-Os': 'IOS',
      'X-Country-Code': thinqPartialConfig.countryCode,
      'X-Service-Phase': 'OP',
      'Accept-Encoding': 'gzip',
    }
    if (thinqAuth) {
      headers['X-User-No'] = thinqAuth.userNumber
      headers['X-Emp-Token'] = thinqAuth.accessToken
    }
    return headers
  }

  generateHeaders() {
    return ThinqApi.generateHeaders(this.thinqConfig, this.thinqAuth)
  }
}
