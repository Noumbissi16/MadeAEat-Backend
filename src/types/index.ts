import { Request } from "express";

export interface IReq extends Request {
  user: {
    userId: string;
  };
}

export interface IGenericUser {
  name: string;
  email: string;
  password: string;
  createJWT(): string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  profileImage?: string;
  phoneNumber?: string;
}
export interface IAdminRestaurant extends IGenericUser {
  ownedRestaurant?: any;
}

export interface IClient extends IGenericUser {
  town?: string;
}

export interface IAgence extends IGenericUser {
  agence: string;
  profileAgence: string
}

export interface UploadedFiles {
  profileImage?: Express.Multer.File[];
  profileAgence?: Express.Multer.File[];
}

