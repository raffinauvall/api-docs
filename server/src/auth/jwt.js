import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    },
    config.jwt.secret,
    { expiresIn: '12h' }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret)
}
