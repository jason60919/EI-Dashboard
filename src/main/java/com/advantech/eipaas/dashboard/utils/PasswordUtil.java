package com.advantech.eipaas.dashboard.utils;


import java.util.Base64;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;


/**
 * Hash passwords for storage, and test passwords against password tokens.
 * Instances of this class can be used concurrently by multiple threads.
 */
public final class PasswordUtil {
    private static final String ALGORITHM = "PBKDF2WithHmacSHA512";
    private static final String PREFIX = "ei-paas";
    private static final int ITERATIONS = 5000;
    private static final int LEN_KEY = 256;
    private static final String DELIMETER = "$";
    private static final String RE_DELIMETER = "\\$";

    public boolean authenticate(String password, String sentinel) {
        String[] tokens = sentinel.split(RE_DELIMETER);
        if (tokens.length != 3) {
            return false;
        }

        Base64.Decoder b64 = Base64.getUrlDecoder();
        byte[] salt, hash, checked;
        salt = b64.decode(tokens[1]);
        hash = b64.decode(tokens[2]);

        try {
            checked = getHash(password.toCharArray(), salt);
        }
        catch (NoSuchAlgorithmException|InvalidKeySpecException e) {
            e.printStackTrace();
            return false;
        }

        int diff = hash.length ^ checked.length;
        for(int i = 0; i < hash.length && i < checked.length; i++) {
            diff |= hash[i] ^ checked[i];
        }
        return diff == 0;
    }

    private String hashedPassword(String password) throws NoSuchAlgorithmException, InvalidKeySpecException{
        byte[] salt = getSalt();
        Base64.Encoder b64 = Base64.getUrlEncoder().withoutPadding();
        return PREFIX + DELIMETER +
               b64.encodeToString(salt) + DELIMETER +
               b64.encodeToString(getHash(password.toCharArray(), salt));
    }

    private byte[] getHash(char[] text, byte[] salt) throws NoSuchAlgorithmException, InvalidKeySpecException{
        KeySpec spec = new PBEKeySpec(text, salt, ITERATIONS, LEN_KEY);
        SecretKeyFactory key = SecretKeyFactory.getInstance(ALGORITHM);
        return key.generateSecret(spec).getEncoded();
    }

    private byte[] getSalt() throws NoSuchAlgorithmException {
        SecureRandom sr = SecureRandom.getInstance("SHA1PRNG");
        byte[] salt = new byte[16];
        sr.nextBytes(salt);
        return salt;
    }

    public static void main(String[] argv) throws Exception {
        System.out.print("Password original: ");
        String password1 = System.console().readLine();

        System.out.print("Password checked: ");
        String password2 = System.console().readLine();

        System.out.println("");

        PasswordUtil self = new PasswordUtil();
        String sentinel = self.hashedPassword(password1);
        Boolean result = self.authenticate(password2, sentinel);

        System.out.println("[main] ORIGINAL: " + password1);
        System.out.println("[main] SENTINEL: " + sentinel);
        System.out.println("[main] CHECKED: " + password2);
        System.out.println("[main] RESULT: " + result);
    }
}