import ClientOAuth2 from 'client-oauth2'
import { v4 as uuidv4 } from 'uuid'
import querystring from 'querystring'
import { URL } from 'url'

import { generateTokenSignatureTimestamp, generateTimestamp } from './authUtils'
import type { Logger } from 'homebridge'
import { ThinqConfig } from './thinqConfig'

const THINQ_CLIENT_ID = 'LGAO221A02'
const THINQ_SECRET_KEY = 'c053c2a6ddeb7ad97cb0eed0dcb31cf8'

export type ThinqAuthConfig = {
  auth_login_url?: string
  auth_login_state?: string
  auth_access_token?: string
  auth_refresh_token?: string
  auth_user_number?: string
}

export default class ThinqAuth {
  private readonly log: Logger
  private readonly thinqConfig: ThinqConfig

  private auth: ClientOAuth2
  private token?: ClientOAuth2.Token

  public userNumber?: string
  public readonly authState: string

  get accessToken() {
    return this.token?.accessToken
  }

  constructor(logger: Logger, thinqConfig: ThinqConfig, state?: string) {
    this.log = logger
    this.authState = state || uuidv4()
    this.thinqConfig = thinqConfig
    this.auth = new ClientOAuth2({
      clientId: THINQ_CLIENT_ID,
      redirectUri: this.thinqConfig.redirectUri,
      accessTokenUri: this.thinqConfig.accessTokenUri,
      authorizationUri: this.thinqConfig.authorizationUri,
      state: this.authState,
    })
  }

  static fromConfig(
    logger: Logger,
    thinqConfig: ThinqConfig,
    existingConfig: ThinqAuthConfig,
  ) {
    const instance = new ThinqAuth(
      logger,
      thinqConfig,
      existingConfig.auth_login_state,
    )
    if (
      existingConfig.auth_access_token &&
      existingConfig.auth_refresh_token &&
      existingConfig.auth_user_number
    ) {
      instance.userNumber = existingConfig.auth_user_number
      instance.token = new ClientOAuth2.Token(instance.auth, {
        token_type: 'code',
        access_token: existingConfig.auth_access_token,
        refresh_token: existingConfig.auth_refresh_token,
      })
    }
    return instance
  }

  getIsLoggedIn() {
    return this.accessToken && this.userNumber
  }

  getLoginUri() {
    const loginUri = this.auth.code.getUri({
      query: {
        country: this.thinqConfig.countryCode,
        langauge: this.thinqConfig.languageCode,
        svc_list: 'SVC202',
        division: 'ha',
        show_thirdparty_login: 'GGL,AMZ,FBK',
      },
    })
    return loginUri.replace(
      /https:\/\/[\w]+\.m.lgaccount.com/,
      'https://us.m.lgaccount.com',
    )
  }

  async processLoginResult(urlRedirectedTo: string) {
    const parsedUrlRedirectedTo = new URL(urlRedirectedTo)
    // NOTE: This is the body ClientOAuth2 will send
    const mockedBody = {
      // ClientOAuth2 will inject a client_id parameter
      client_id: THINQ_CLIENT_ID,
      code: parsedUrlRedirectedTo.searchParams.get('code') as string,
      grant_type: 'authorization_code',
      redirect_uri: this.thinqConfig.redirectUri,
    }
    try {
      this.token = await this.auth.code.getToken(urlRedirectedTo, {
        headers: this.lgeOauthHeaders(mockedBody),
      })
      this.userNumber =
        parsedUrlRedirectedTo.searchParams.get('user_number') ?? undefined
    } catch (error) {
      this.log.error('Failed to get access token', error)
    }
  }

  async initiateRefreshToken() {
    if (!this.token) {
      this.log.error(`Cannot refreshToken() when a token hasn't been stored`)
      return
    }
    // NOTE: This is the body ClientOAuth2 will send
    const mockedBody = {
      grant_type: 'refresh_token',
      refresh_token: this.token.refreshToken,
    }
    this.token = await this.token.refresh({
      headers: this.lgeOauthHeaders(mockedBody),
    })
  }

  /** Force-clear the stored token information. Useful for clearing known-bad credentials. */
  clearStoredToken() {
    this.token = undefined
  }

  private lgeOauthHeaders(alphaSortedBodyParams: Record<string, string>) {
    const parsedRequestUrl = new URL(this.thinqConfig.accessTokenUri)
    const query = querystring.stringify(alphaSortedBodyParams)
    // NOTE: This is the URL that auth.getToken() will make a request to + a query-string-ified version of its body
    const requestUrl = `${parsedRequestUrl.pathname}?${query}`
    const timestamp = generateTimestamp()
    const signature = generateTokenSignatureTimestamp(
      requestUrl,
      timestamp,
      THINQ_SECRET_KEY,
    )
    return {
      'x-lge-appkey': THINQ_CLIENT_ID,
      'x-lge-oauth-signature': signature,
      'x-lge-oauth-date': timestamp,
      Accept: 'application/json',
      'Accept-Language': this.thinqConfig.languageCode,
    }
  }

  serializeToConfig(): Record<string, string | undefined> {
    // The "keys" of this object map directly to the configs defined in config.shema.json
    return {
      auth_login_url: this.getLoginUri(),
      auth_login_state: this.authState,
      auth_access_token: this.accessToken,
      auth_refresh_token: this.token?.refreshToken,
      auth_user_number: this.userNumber,
    }
  }
}
