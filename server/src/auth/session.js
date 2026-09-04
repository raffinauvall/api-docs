import session from 'express-session'
import pgSession from 'connect-pg-simple'
import { pool } from '../db.js'
import { config } from '../config.js'

const PgSession = pgSession(session)

export const sessionMiddleware = session({
  name: config.session.name,
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  store: new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  cookie: {
    httpOnly: true,
    secure: config.session.secureCookie,
    sameSite: 'lax',
    maxAge: config.session.maxAge
  }
})
