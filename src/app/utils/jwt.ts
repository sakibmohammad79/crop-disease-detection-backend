import jwt, {  Secret } from "jsonwebtoken";
import { config } from '../config';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}



export const generateToken = (jwtPayload: JwtPayload, secret: Secret, exp: string) => {
  const token = jwt.sign(jwtPayload, secret as string, {
    algorithm: "HS256",
    expiresIn: exp,
  });
  return token;
};

export const generateRefreshToken = (jwtPayload: JwtPayload, secret: Secret, exp: string) => {
  const token = jwt.sign(jwtPayload, secret as string, {
    algorithm: "HS256",
    expiresIn: exp,
  });
  return token;
};



export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.access_token_secret as Secret) as JwtPayload; 
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.refresh_token_secret as Secret) as JwtPayload; 
};