import type { Service, Characteristic } from 'homebridge'

import type { ThinqPlatformType } from '../thinq/apiTypes'
import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

const MIN_VALUE = 2
const STEP_SIZE = 2

type State = number /** 0-100; 0 is "off" */

type ApiValue = number /** 2, 4, 6, etc */

export default class RotationSpeedCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.RotationSpeed
> {
  numSpeeds: number

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
    thinqPlatform: ThinqPlatformType,
    numSpeeds = 3,
  ) {
    super(
      platform,
      service,
      deviceId,
      thinqPlatform,
      platform.Characteristic.RotationSpeed,
      'Set',
      'airState.windStrength',
    )
    this.numSpeeds = numSpeeds

    const maxValue = numSpeeds * STEP_SIZE
    service
      .getCharacteristic(this.characteristic)
      // minStep 0.1 to help avoid accidentally setting state = 0.
      // If Homekit notices a 0 value, it also sends Active = 0 to shut it off.
      .setProps({ minValue: 0, maxValue, minStep: 0.1 })
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    const normalized = Math.round(apiValue / STEP_SIZE) * STEP_SIZE
    return Math.max(MIN_VALUE, normalized)
  }

  getApiValueFromState(state: State): ApiValue {
    return this.getStateFromApiValue(state)
  }
}
