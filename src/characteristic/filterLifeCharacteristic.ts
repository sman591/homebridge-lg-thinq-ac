import type { Service, Characteristic } from 'homebridge'
import type { GetDeviceResponse } from '../thinq/apiTypes'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State = number

type ApiValue = number

export default class FilterLifeCharacteristic extends AbstractCharacteristic<
  State,
  ApiValue,
  typeof Characteristic.FilterLifeLevel
> {
  constructor(
    platform: HomebridgeLgThinqPlatform,
    service: Service,
    deviceId: string,
  ) {
    super(
      platform,
      service,
      deviceId,
      platform.Characteristic.FilterLifeLevel,
      'Operation',
      // @ts-expect-error This characteristic is a hack
      '_fake_filter_life',
    )
  }

  // Override default handleUpdatedSnapshot() to ignore based on mode
  handleUpdatedSnapshot(snapshot: GetDeviceResponse['result']['snapshot']) {
    const maxTime = snapshot['airState.filterMngStates.maxTime']
    const useTime = snapshot['airState.filterMngStates.useTime']
    const percentUsed = (useTime / maxTime) * 100
    const filterLife = Math.floor(100 - percentUsed)

    if (isNaN(filterLife)) {
      this.logDebug(
        'Filter life is not available for this device (NaN). ' +
          'Follow https://github.com/sman591/homebridge-lg-thinq-ac/issues/94 for an official fix for this.',
      )
      return
    }

    super.handleUpdatedSnapshot({
      ...snapshot,
      // @ts-expect-error This characteristic is a hack
      _fake_filter_life: filterLife,
    })
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    return apiValue
  }

  // this is a read-only characteristic
  handleSet = undefined

  getApiValueFromState(state: State): ApiValue {
    return state
  }
}
