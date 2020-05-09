import ClientOAuth2 from 'client-oauth2'
import { v4 as uuidv4 } from 'uuid'
import querystring from 'querystring'
import { URL } from 'url'

import { generateTokenSignatureTimestamp, generateTimestamp } from './authUtils'
import { Logger } from 'homebridge'

const THINQ_CLIENT_ID = 'LGAO221A02'
const THINQ_SECRET_KEY = 'c053c2a6ddeb7ad97cb0eed0dcb31cf8'

export default class ThinqAuth {
  log: Logger
  accessTokenUri: string
  redirectUri: string
  auth: ClientOAuth2.CodeFlow
  token?: ClientOAuth2.Token

  constructor(logger: Logger) {
    this.log = logger
    this.accessTokenUri = 'https://us.lgeapi.com/oauth/1.0/oauth2/token'
    this.redirectUri = 'https://kr.m.lgaccount.com/login/iabClose'
    this.auth = new ClientOAuth2({
      clientId: THINQ_CLIENT_ID,
      redirectUri: this.redirectUri,
      accessTokenUri: this.accessTokenUri,
      authorizationUri: 'https://us.m.lgaccount.com/spx/login/signIn',
      state: uuidv4(),
    }).code
  }

  getLoginUri() {
    return this.auth.getUri({
      query: {
        country: 'US',
        langauge: 'en-US',
        // eslint-disable-next-line @typescript-eslint/camelcase
        svc_list: 'SVC202',
        division: 'ha',
        // eslint-disable-next-line @typescript-eslint/camelcase
        show_thirdparty_login: 'GGL,AMZ,FBK',
      },
    })
  }

  async processLoginResult(urlRedirectedTo: string) {
    const parsedUrlRedirectedTo = new URL(urlRedirectedTo)
    // NOTE: This is the body ClientOAuth2 will send
    const mockedBody = {
      // ClientOAuth2 will inject a client_id parameter
      // eslint-disable-next-line @typescript-eslint/camelcase
      client_id: THINQ_CLIENT_ID,
      code: parsedUrlRedirectedTo.searchParams.get('code') as string,
      // eslint-disable-next-line @typescript-eslint/camelcase
      grant_type: 'authorization_code',
      // eslint-disable-next-line @typescript-eslint/camelcase
      redirect_uri: this.redirectUri,
    }
    try {
      this.token = await this.auth.getToken(urlRedirectedTo, {
        headers: this.lgeOauthHeaders(mockedBody),
      })
    } catch (error) {
      this.log.error('Failed to get access token', error)
    }
  }

  async refreshToken() {
    if (!this.token) {
      this.log.error(`Cannot refreshToken() when a token hasn't been stored`)
      return
    }
    // NOTE: This is the body ClientOAuth2 will send
    const mockedBody = {
      // eslint-disable-next-line @typescript-eslint/camelcase
      grant_type: 'refresh_token',
      // eslint-disable-next-line @typescript-eslint/camelcase
      refresh_token: this.token.refreshToken,
    }
    try {
      this.token = await this.token.refresh({
        headers: this.lgeOauthHeaders(mockedBody),
      })
    } catch (error) {
      this.log.error('Failed to refresh token', error)
    }
  }

  private lgeOauthHeaders(alphaSortedBodyParams: Record<string, string>) {
    const parsedRequestUrl = new URL(this.accessTokenUri)
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
      'Accept-Language': 'en-us',
    }
  }
}
