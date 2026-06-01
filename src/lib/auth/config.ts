const MIN_SECRET_LENGTH = 32;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET təyin edilməyib və ya çox qısadır (minimum ${MIN_SECRET_LENGTH} simvol). .env.local-ə güclü təsadüfi sətir əlavə edin.`
    );
  }
  return secret;
}

export const JWT_COOKIE_NAME = "greenshop_access_token";

/** 7 gün */
export const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
