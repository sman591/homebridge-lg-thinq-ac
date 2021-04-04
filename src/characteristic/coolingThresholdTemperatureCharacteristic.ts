import type { Service } from 'homebridge'
import type { LgAirConditionerPlatformAccessory } from '../platformAccessory'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractSplithresholdCharacteristic from './abstractSplitTemperatureThresholdCharacteristic'

export default class CoolingThresholdCharacteristic extends AbstractSplithresholdCharacteristic {
  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    device: LgAirConditionerPlatformAccessory,
  ) {
    super(platform, service, device, 'cool')
  }
}
