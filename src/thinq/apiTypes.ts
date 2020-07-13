export type ThinqPlatformType = 'thinq1' | 'thinq2'

export type GenericResponse = {
  resultCode: string
  result: unknown
}

export type GetDeviceResponse = {
  resultCode: string
  result: {
    appType: string
    modelCountryCode: string
    countryCode: string
    modelName: string
    deviceType: number
    deviceCode: string
    alias: string
    deviceId: string
    fwVer: string
    imageFileName: string
    ssid: string
    softapId: string
    softapPass: string
    macAddress: string
    networkType: string
    timezoneCode: string
    timezoneCodeAlias: string
    utcOffset: number
    utcOffsetDisplay: string
    dstOffset: number
    dstOffsetDisplay: string
    curOffset: number
    curOffsetDisplay: string
    sdsGuide: string
    newRegYn: string
    remoteControlType: string
    userNo: string
    tftYn: string
    deviceState: string
    snapshot: {
      'airState.windStrength': number
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      static: [Record<string, any>]
      'airState.tempState.current': number
      'airState.reservation.sleepTime': number
      'airState.filterMngStates.maxTime': number
      'airState.reservation.targetTimeToStart': number
      'airState.operation': number
      'airState.opMode': number
      'airState.quality.sensorMon': number
      'airState.filterMngStates.useTime': number
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      meta: [Record<string, any>]
      'airState.energy.accumulatedTime': number
      online: true
      timestamp: number
      'airState.energy.accumulated': number
      'airState.reservation.targetTimeToStop': number
      'airState.tempState.target': number
      'airState.diagCode': number
      'airState.wDir.vStep': number
      'airState.energy.onCurrent': number
    }
    online: true
    platformType: ThinqPlatformType
    area: number
    regDt: number
    blackboxYn: string
    modelProtocol: string
    receipeVersion: number
    activeSaving: string
    smartCareV2: string
    order: number
    drServiceYn: string
    regDtUtc: string
    groupableYn: string
    controllableYn: string
    combinedProductYn: string
    masterYn: string
    tclcount: number
  }
}

// Result from POST /api/rti/rtiControl, base64decode(response.lgedmRoot.workList.returnData)
export type GetThinQ1Result = {
  Operation: string
  OpMode: string
  WindStrength: string
  TempUnit: string
  TempCur: string
  TempCfg: string
  GroupType: string
  SleepTime: string
  OnTime: string
  OffTime: string
  RacAddFunc: string
  ExtraOp: string
  DiagCode: string
  TimeBsOn: string
  TimeBsOff: string
  AirClean: string
  AutoDry: string
  PowerSave: string
  WDirVStep: string
  WDirHStep: string
  TempLimitMax: string
  TempLimitMin: string
  DuctZoneType: string
  ZoneControl: string
  DRED: string
  SensorPM1: string
  SensorPM2: string
  SensorPM10: string
  AirPolution: string
  HumidityCfg: string
  WaterTempCoolMin: string
  WaterTempCoolMax: string
  WaterTempHeatMin: string
  WaterTempHeatMax: string
  HotWaterTempMin: string
  HotWaterTempMax: string
  SensorHumidity: string
  TotalAirPolution: string
  SensorMon: string
  CleanDry: string
  ProductStatus: string
  AirMonitoring: string
  Humidification: string
  AirFast: string
  AirRemoval: string
  AirUVDisinfection: string
  WatertankLight: string
  SignalLighting: string
  WDirUpDown: string
  WDirLeftRight: string
  WSwirl: string
  Jet: string
  LowHeating: string
  CirculateStrength: string
  CirculateDir: string
  AntiBugs: string
  IceValley: string
  Humsave: string
  WaterTempCur: string
  HotWaterTempCur: string
  HotWaterTempCfg: string
  HotWaterMode: string
  HotWater: string
  AWHPTempCfgSwitch: string
  AirTempCoolMin: string
  AirTempCoolMax: string
  AirTempHeatMin: string
  AirTempHeatMax: string
  WaterInTempCur: string
  AWHPWATempControlSta: string
  DisplayControl: string
  SmartCare: string
  TwoSetCoolTemp: string
  TwoSetHeatTemp: string
  TwoSetCoolUSL: string
  TwoSetCoolLSL: string
  TwoSetHeatUSL: string
  TwoSetHeatLSL: string
  TwoSetACOState: string
  TwoSetModeDeadband: string
  TwoSetState: string
}

export type GetDashboardResponse = {
  resultCode: '0000'
  result: {
    langPackCommonVer: string
    langPackCommonUri: string
    item: Array<{
      appType: string
      modelCountryCode: string
      countryCode: string
      modelName: string
      deviceType: number
      deviceCode: string
      alias: string
      deviceId: string
      fwVer: string
      imageFileName: string
      imageUrl: string
      smallImageUrl: string
      ssid: string
      softapId: string
      softapPass: string
      macAddress: string
      networkType: string
      timezoneCode: string
      timezoneCodeAlias: string
      utcOffset: number
      utcOffsetDisplay: string
      dstOffset: number
      dstOffsetDisplay: string
      curOffset: number
      curOffsetDisplay: string
      sdsGuide: string
      newRegYn: string
      remoteControlType: string
      userNo: string
      tftYn: string
      modelJsonVer: number
      modelJsonUri: string
      appModuleVer: number
      appModuleUri: string
      appRestartYn: string
      appModuleSize: number
      langPackProductTypeVer: number
      langPackProductTypeUri: string
      deviceState: string
      snapshot:
        | GetDeviceResponse['result']['snapshot']
        | Record<string, unknown> // could be a different product
      online: true
      platformType: ThinqPlatformType
      area: number
      regDt: number
      blackboxYn: string
      modelProtocol: string
      order: number
      drServiceYn: string
      fwInfoList: Array<{
        order: number
        checksum: string
        partNumber: string
      }>
      modemInfo: {
        modemType: string
        modelName: string
        appVersion: string
      }
      guideTypeYn: string
      guideType: string
      regDtUtc: string
      groupableYn: string
      controllableYn: string
      combinedProductYn: string
      masterYn: string
      tclcount: number
    }>
    group: []
  }
}

export type GetGatewayUriResponse = {
  resultCode: string
  result: {
    countryCode: string
    languageCode: string
    thinq1Uri: string
    thinq2Uri: string
    empUri: string
    empSpxUri: string
    rtiUri: string
    mediaUri: string
    appLatestVer: string
    appUpdateYn: string
    appLink: string
    nestSupportAppVer: string
    uuidLoginYn: string
    lineLoginYn: string
    lineChannelId: string
    cicTel: string
    cicUri: string
    isSupportVideoYn: string
    countryLangDescription: string
    googleAssistantUri: string
    smartWorldUri: string
    racUri: string
    cssUri: string
    cssWebUri: string
    iotssUri: string
    amazonDrsYn: string
    features: {
      amazonDrs: string
      pccPushProd: string
      disableWeatherCard: string
      thinqCss: string
      cicSupport: string
      pccPush: string
      qrRegisterYn: string
      pccWarrantyProd: string
      pccWarranty: string
    }
    serviceCards: Array<Record<string, unknown>>
  }
}

export type ApiHeaders = {
  'X-Thinq-App-Ver': string
  'X-Thinq-App-Type': string
  'X-Language-Code': string
  'X-Client-Id': string
  'X-Thinq-App-Level': string
  'X-Service-Code': string
  'Accept-Language': string
  'X-Message-Id': string
  Accept: string
  'Content-Type': string
  'X-Api-Key': string
  'X-Thinq-App-Os': string
  'X-Country-Code': string
  'X-Service-Phase': string
  'Accept-Encoding': string

  'X-User-No'?: string
  'X-Emp-Token'?: string
}
