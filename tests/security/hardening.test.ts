
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('🛡️ Security Hardening Verification', () => {

    const rootDir = process.cwd();

    it('should enforce secure Firestore Rules (Auth Required and Role Checks)', () => {
        const rulesPath = path.join(rootDir, 'firestore.rules');
        expect(fs.existsSync(rulesPath)).toBe(true);

        const content = fs.readFileSync(rulesPath, 'utf-8');
        expect(content).toContain('function isAuthenticated()');
        expect(content).toContain('request.auth != null');
        expect(content).toContain('match /{document=**} {');
        expect(content).toContain('allow read, write: if false;'); // Default deny
        expect(content).not.toContain('allow read, write: if true');
    });

    it('should have Content Security Policy (CSP) in index.html', () => {
        const indexPath = path.join(rootDir, 'index.html');
        expect(fs.existsSync(indexPath)).toBe(true);

        const content = fs.readFileSync(indexPath, 'utf-8');
        expect(content).toContain('<meta http-equiv="Content-Security-Policy"');
        expect(content).toContain("default-src 'self'");
        expect(content).toContain("script-src 'self'");
    });

    it('should configure Android Release Build for Obfuscation (R8)', () => {
        const gradlePath = path.join(rootDir, 'android/app/build.gradle');
        expect(fs.existsSync(gradlePath)).toBe(true);

        const content = fs.readFileSync(gradlePath, 'utf-8');
        expect(content).toContain('minifyEnabled true');
        expect(content).toContain('shrinkResources true');
    });

    it('should configure Production Web Build for Obfuscation and Security', () => {
        const viteConfigPath = path.join(rootDir, 'vite.config.ts');
        expect(fs.existsSync(viteConfigPath)).toBe(true);

        const content = fs.readFileSync(viteConfigPath, 'utf-8');
        expect(content).toContain('rollup-plugin-obfuscator');
        expect(content).toContain('compact: true');
        expect(content).toContain('deadCodeInjection: true');

        // Match sourcemap: !isProd or sourcemap: false
        expect(content).toMatch(/sourcemap:\s*(!isProd|false)/);
    });

    it('should have ProGuard rules for Metadata Stripping and Bridge protection', () => {
        const proguardPath = path.join(rootDir, 'android/app/proguard-rules.pro');
        expect(fs.existsSync(proguardPath)).toBe(true);

        const content = fs.readFileSync(proguardPath, 'utf-8');
        expect(content).toContain('-keep public class com.getcapacitor.Plugin');
        expect(content).toContain('JavascriptInterface');
        expect(content).toContain('-renamesourcefileattribute SourceFile');
    });

});
