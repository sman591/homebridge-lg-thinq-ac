import type { Service } from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractSplithresholdCharacteristic from './abstractSplitTemperatureThresholdCharacteristic'

export default class HeatingThresholdCharacteristic extends AbstractSplithresholdCharacteristic {
  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
  ) {
    super(platform, service, deviceId, 'heat')
  }
}
