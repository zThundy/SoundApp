

import { safeStorage } from "electron";
import Store from 'electron-store';

interface SafeStorageWrapper {
    isEncryptionAvailable(): boolean;
    setUsePlainTextEncryption(allow: boolean): void;
    getSelectedStorageBackend(): string;
    store(key: string, value: string): boolean;
    set(key: string, value: string): boolean;
    get(key: string): string | null;
    remove(key: string): boolean;
    has(key: string): boolean;
    clear(): boolean;
}

class SafeStorageWrapper {
    private safeStorage: typeof safeStorage;
    private storage: Store = new Store();

    constructor() {
        this.safeStorage = safeStorage;
    }

    isEncryptionAvailable(): boolean {
        return this.safeStorage.isEncryptionAvailable();
    }

    setUsePlainTextEncryption(allow: boolean): void {
        this.safeStorage.setUsePlainTextEncryption(allow);
    }

    getSelectedStorageBackend(): string {
        return this.safeStorage.getSelectedStorageBackend();
    }

    set(key: string, value: string): boolean {
        return this.store(key, value);
    }

    store(key: string, value: string): boolean {
        if (!this.isEncryptionAvailable()) return false;
        const encrypted = this.safeStorage.encryptString(value);
        console.log('Storing encrypted value for key:', key, encrypted);
        const base64Encoded = encrypted.toString('base64');
        this.storage.set(key, base64Encoded);
        console.log('Value stored successfully.', base64Encoded);
        return true;
    }

    get(key: string): string | null {
        if (!this.isEncryptionAvailable()) return null;
        // Retrieve the encrypted buffer from a file or database
        const encryptedBuffer = this.storage.get(key);
        if (!encryptedBuffer) return null;
        const buffer = encryptedBuffer ? Buffer.from(encryptedBuffer as string, 'base64') : null;
        if (!buffer) return null;
        const decrypted = this.safeStorage.decryptString(buffer);
        return decrypted;
    }

    remove(key: string): boolean {
        this.storage.delete(key);
        return true;
    }

    has(key: string): boolean {
        const value = this.storage.get(key);
        if (value === undefined || value === null) return false;
        if (!this.storage.has(key)) return false;
        return true;
    }

    clear(): boolean {
        this.storage.clear();
        return true;
    }
}

export {
    SafeStorageWrapper,
    SafeStorageWrapper as default
}