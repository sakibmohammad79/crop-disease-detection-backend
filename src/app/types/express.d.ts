// import { Request } from 'express';
// import { User } from '@prisma/client'; // যদি Prisma User model use করো

// declare module 'express-serve-static-core' {
//   interface Request {
//     user?: {
//       userId: string;
//       email: string;
//       role: string;
//     };
//   }
// }

declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}