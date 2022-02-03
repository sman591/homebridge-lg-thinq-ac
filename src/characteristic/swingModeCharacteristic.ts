import type { Service, Characteristic } from 'homebridge'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State =
  | typeof Characteristic.SwingMode.SWING_DISABLED
  | typeof Characteristic.SwingMode.SWING_ENABLED

type ApiValue = 0 | 100

export default class SwingModeCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.SwingMode
> {
  private reportedWarningOnce = false

  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
  ) {
    super(
      platform,
      service,
      deviceId,
      platform.Characteristic.SwingMode,
      'Set',
      'airState.wDir.vStep',
    )
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    if (apiValue > 0 && apiValue < 10) {
      if (!this.reportedWarningOnce) {
        this.logError(
          'Warning: Your A/C unit supports variable swing settings, but this is not supported by Homekit. Ignoring desired swing setting.',
        )
        this.reportedWarningOnce = true
      }
      return this.characteristic.SWING_ENABLED
    }

    switch (apiValue) {
      case 0:
        return this.characteristic.SWING_DISABLED
      case 100:
        return this.characteristic.SWING_ENABLED
      default:
        throw new Error('Unsupported API value: ' + JSON.stringify(apiValue))
    }
  }

  getApiValueFromState(state: State): ApiValue {
    switch (state) {
      case this.characteristic.SWING_DISABLED:
        return 0
      case this.characteristic.SWING_ENABLED:
        return 100
      default:
        throw new Error('Unsupported state: ' + JSON.stringify(state))
    }
  }
}
