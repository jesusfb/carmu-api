import { Types } from 'mongoose';

export type UserRole = 'admin' | 'editor' | 'seller' | 'user';

export interface IImage {
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  type?: string;
  url?: string;
}

export interface IUserModel {
  name: string;
  email: string;
  emailVerifiedAt?: string | Date;
  password: string;
  rememberToken?: string;
  profilePhoto?: IImage;
  role?: UserRole;
  employee?: Types.ObjectId;
  customer?: Types.ObjectId;
}
