import type { Logger, Service } from 'homebridge'

import type { HomebridgeLgThinqPlatform } from './platform'

import ActiveCharacteristic from './characteristic/activeCharacteristic'
import AbstractCharacteristic from './characteristic/abstractCharacteristic'
import SwingModeCharacteristic from './characteristic/swingModeCharacteristic'
import RotationSpeedCharacteristic from './characteristic/rotationSpeedCharacteristic'
import CoolingThresholdTemperatureCharacteristic from './characteristic/coolingThresholdTemperatureCharacteristic'
import HeatingThresholdTemperatureCharacteristic from './characteristic/heatingThresholdTemperatureCharacteristic'
import TargetHeaterCoolerStateCharacteristic from './characteristic/targetHeaterCoolerStateCharacteristic'
import CurrentHeaterCoolerStateCharacteristic from './characteristic/currentHeaterCoolerStateCharacteristic'
import CurrentTemperatureCharacteristic from './characteristic/currentTemperatureCharacteristic'
import FilterChangeCharacteristic from './characteristic/filterChangeCharacteristic'
import FilterLifeCharacteristic from './characteristic/filterLifeCharacteristic'

export default function getCharacteristicsForModel(
  model: string,
  platform: HomebridgeLgThinqPlatform,
  service: Service,
  deviceId: string,
  log: Logger,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Array<AbstractCharacteristic<any, any, any>> {
  switch (model) {
    case 'RAC_056905_WW':
    case 'CVT_493401_WW':
      return [
        new ActiveCharacteristic(platform, service, deviceId),
        // TODO: These units (or at least RAC_056905_WW does) support variable-position, not just "all or nothing"
        new SwingModeCharacteristic(platform, service, deviceId),
        new RotationSpeedCharacteristic(platform, service, deviceId, 4),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new TargetHeaterCoolerStateCharacteristic(
          platform,
          service,
          deviceId,
          true,
        ),
        new CurrentHeaterCoolerStateCharacteristic(
          platform,
          service,
          deviceId,
          true,
        ),
        new CurrentTemperatureCharacteristic(platform, service, deviceId),
        new FilterChangeCharacteristic(platform, service, deviceId),
        new FilterLifeCharacteristic(platform, service, deviceId),
      ]
    // LW8017ERSM -- 3 fan modes
    // LW1517IVSM -- 4 fan modes
    case 'WIN_056905_WW':
      return [
        new ActiveCharacteristic(platform, service, deviceId),
        new RotationSpeedCharacteristic(platform, service, deviceId),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new TargetHeaterCoolerStateCharacteristic(platform, service, deviceId),
        new CurrentHeaterCoolerStateCharacteristic(platform, service, deviceId),
        new CurrentTemperatureCharacteristic(platform, service, deviceId),
        new FilterChangeCharacteristic(platform, service, deviceId),
        new FilterLifeCharacteristic(platform, service, deviceId),
      ]
    // FQ17SADWEN
    case 'PAC_910604_WW':
      return [
        new ActiveCharacteristic(platform, service, deviceId),
        // TODO: This model uses upDown/left/leftRight values which aren't supported yet
        // new SwingModeCharacteristic(platform, service, deviceId),
        // TODO: This model has rotation speeds in a range not supported yet, such as `2056`
        // new RotationSpeedCharacteristic(platform, service, deviceId),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new TargetHeaterCoolerStateCharacteristic(platform, service, deviceId),
        new CurrentHeaterCoolerStateCharacteristic(platform, service, deviceId),
        new CurrentTemperatureCharacteristic(platform, service, deviceId),
        new FilterChangeCharacteristic(platform, service, deviceId),
        new FilterLifeCharacteristic(platform, service, deviceId),
      ]
    // LP1419IVSM
    case 'POT_056905_WW':
    default:
      if (model !== 'POT_056905_WW') {
        log.error(
          `Unsupported model: ${model}. Please open a GitHub issue at https://github.com/sman591/homebridge-lg-thinq-ac/issues to ` +
            'request support for your model. Falling back to default "POT_056905_WW" model instead.',
        )
      }
      return [
        new ActiveCharacteristic(platform, service, deviceId),
        new SwingModeCharacteristic(platform, service, deviceId),
        new RotationSpeedCharacteristic(platform, service, deviceId),
        new CoolingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new HeatingThresholdTemperatureCharacteristic(
          platform,
          service,
          deviceId,
        ),
        new TargetHeaterCoolerStateCharacteristic(platform, service, deviceId),
        new CurrentHeaterCoolerStateCharacteristic(platform, service, deviceId),
        new CurrentTemperatureCharacteristic(platform, service, deviceId),
        new FilterChangeCharacteristic(platform, service, deviceId),
        new FilterLifeCharacteristic(platform, service, deviceId),
      ]
  }
}
