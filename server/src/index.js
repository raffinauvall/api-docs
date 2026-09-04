import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config.js'
import { sessionMiddleware } from './auth/session.js'
import { errorHandler } from './middleware/error.js'
import { migrate } from './migrate.js'
import { authRouter } from './routes/auth.js'
import { groupsRouter } from './routes/groups.js'
import { apisRouter } from './routes/apis.js'
import { versionsRouter } from './routes/versions.js'
import { endpointsRouter } from './routes/endpoints.js'
import { webhookRouter } from './routes/webhooks.js'
import { proxyRouter } from './routes/proxy.js'

const app = express()
app.set('trust proxy', 1)

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true
  })
)
// Webhooks must read the raw payload before express.json() consumes it.
app.use('/webhooks', webhookRouter)
app.use(express.json({ limit: '1mb' }))
app.use(sessionMiddleware)

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Routes
app.use('/api/auth', authRouter)
app.use('/api/groups', groupsRouter)
app.use('/api/apis', apisRouter)
app.use('/api/versions', versionsRouter)
app.use('/api/endpoints', endpointsRouter)
app.use('/api/proxy', proxyRouter)

app.use(errorHandler)

async function start() {
  await migrate()
  app.listen(config.port, () => {
    console.log(`✓ API Docs server listening on http://localhost:${config.port}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
