import type { Service } from 'homebridge'

import type { ThinqPlatformType } from '../thinq/apiTypes'
import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractSplithresholdCharacteristic from './abstractSplitTemperatureThresholdCharacteristic'

export default class CoolingThresholdCharacteristic extends AbstractSplithresholdCharacteristic {
  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
    thinqPlatform: ThinqPlatformType,
  ) {
    super(platform, service, deviceId, thinqPlatform, 'cool')
  }
}
