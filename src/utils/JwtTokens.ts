import { env } from "node:process"
import { decodeJwt, type JWTPayload, jwtVerify, SignJWT } from "jose"

export interface JwtUser extends JWTPayload {
  id: string
}

class JwtTokens {
  async generateToken(id: JwtUser["id"]): Promise<string> {
    const token = await new SignJWT({ id: id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("12h") // Token expires in 12 hours
      .sign(new TextEncoder().encode(env.JWT_SECRET))

    return token
  }

  async verifyToken(token: string): Promise<JwtUser | null> {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(env.JWT_SECRET),
      )
      return payload as JwtUser
    } catch (_) {
      return null
    }
  }

  decodeToken(token: string): JwtUser | null {
    try {
      const payload = decodeJwt(token)
      return payload as JwtUser
    } catch (_) {
      return null
    }
  }
}

export default new JwtTokens()
