import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

const getEncryptionKey = (): Buffer => {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
        return crypto.scryptSync('default-dev-key', 'salt', KEY_LENGTH);
    }

    if (/^[0-9a-fA-F]{64}$/.test(key)) {
        return Buffer.from(key, 'hex');
    }

    return crypto.scryptSync(key, 'people-platform-salt', KEY_LENGTH);
};

export const encrypt = (plaintext: string): string => {
    if (!plaintext) return plaintext;

    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch {
        throw new Error('Encryption failed');
    }
};

export const decrypt = (ciphertext: string): string => {
    if (!ciphertext) return ciphertext;

    try {
        const parts = ciphertext.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid ciphertext format');
        }

        const [ivHex, authTagHex, encrypted] = parts;

        const key = getEncryptionKey();
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch {
        throw new Error('Decryption failed');
    }
};

export const hashPassword = (password: string): string => {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const hash = crypto.scryptSync(password, salt, 64);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
};

export const verifyPassword = (password: string, storedHash: string): boolean => {
    try {
        const [saltHex, hashHex] = storedHash.split(':');
        const salt = Buffer.from(saltHex, 'hex');
        const hash = crypto.scryptSync(password, salt, 64);
        return hash.toString('hex') === hashHex;
    } catch {
        return false;
    }
};

export const generateToken = (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};

export const generateOTP = (length: number = 6): string => {
    const max = Math.pow(10, length);
    const min = Math.pow(10, length - 1);
    const otp = crypto.randomInt(min, max);
    return otp.toString();
};

export const hash = (data: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string => {
    return crypto.createHash(algorithm).update(data).digest('hex');
};

export const createHmac = (data: string, secret: string = process.env.HMAC_SECRET || 'default-hmac-secret'): string => {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

export const verifyHmac = (data: string, signature: string, secret?: string): boolean => {
    const expected = createHmac(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};

export const mask = (data: string, visibleChars: number = 4): string => {
    if (!data || data.length <= visibleChars * 2) {
        return '*'.repeat(data?.length || 0);
    }
    const start = data.slice(0, visibleChars);
    const end = data.slice(-visibleChars);
    const middle = '*'.repeat(Math.min(data.length - visibleChars * 2, 8));
    return `${start}${middle}${end}`;
};

export const encryptSensitiveFields = <T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
): T => {
    const result = { ...obj };
    for (const field of fields) {
        if (result[field] && typeof result[field] === 'string') {
            (result as any)[field] = encrypt(result[field] as string);
        }
    }
    return result;
};

export const decryptSensitiveFields = <T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
): T => {
    const result = { ...obj };
    for (const field of fields) {
        if (result[field] && typeof result[field] === 'string') {
            try {
                (result as any)[field] = decrypt(result[field] as string);
            } catch {
                // Field might not be encrypted
            }
        }
    }
    return result;
};
