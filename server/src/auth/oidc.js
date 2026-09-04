import { config } from '../config.js'

let clientPromise = null

// Lazy-load OIDC client hanya jika issuer dikonfigurasi.
export async function getOidcClient() {
  if (!config.oidc.issuer) return null
  if (clientPromise) return clientPromise

  clientPromise = (async () => {
    const { Issuer, generators } = await import('openid-client')
    const issuer = await Issuer.discover(config.oidc.issuer)
    const client = new issuer.Client({
      client_id: config.oidc.clientId,
      client_secret: config.oidc.clientSecret || undefined,
      redirect_uris: [config.oidc.redirectUri],
      response_types: ['code']
    })
    return { client, generators }
  })()

  return clientPromise
}
