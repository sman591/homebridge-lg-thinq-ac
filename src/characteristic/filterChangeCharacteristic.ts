import type { Service, Characteristic } from 'homebridge'
import type { GetDeviceResponse } from '../thinq/apiTypes'

import { HomebridgeLgThinqPlatform } from '../platform'
import AbstractCharacteristic from './abstractCharacteristic'

type State = 0 | 1

type ApiValue = boolean

export default class FilterChangeCharacteristic extends AbstractCharacteristic<
  State,
  // @ts-expect-error This characteristic is a hack
  ApiValue,
  typeof Characteristic.FilterChangeIndication
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
      platform.Characteristic.FilterChangeIndication,
      'Operation',
      // @ts-expect-error This characteristic is a hack
      '_fake_filter_change_value',
    )
  }

  // Override default handleUpdatedSnapshot() to ignore based on mode
  handleUpdatedSnapshot(snapshot: GetDeviceResponse['result']['snapshot']) {
    const maxTime = snapshot['airState.filterMngStates.maxTime']
    const useTime = snapshot['airState.filterMngStates.useTime']
    const shouldFilterBeChanged = useTime >= maxTime

    super.handleUpdatedSnapshot({
      ...snapshot,
      // @ts-expect-error This characteristic is a hack
      _fake_filter_change_value: shouldFilterBeChanged,
    })
  }

  getStateFromApiValue(apiValue: ApiValue): State {
    return apiValue
      ? this.characteristic.CHANGE_FILTER
      : this.characteristic.FILTER_OK
  }

  handleSet = undefined

  getApiValueFromState(state: State): ApiValue {
    if (state === this.characteristic.CHANGE_FILTER) {
      return true
    }
    return false
  }
}
