package com.advantech.eipaas.dashboard.utils;


import java.sql.Timestamp;
import java.util.Base64;
import java.io.UnsupportedEncodingException;

import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.ws.rs.core.Response;

import org.json.JSONObject;

import com.advantech.eipaas.dashboard.api.APIError;
import com.advantech.eipaas.dashboard.api.APIException;
import com.advantech.eipaas.dashboard.api.APIResponse;
import com.advantech.eipaas.dashboard.entities.AccountEntity;


public class AuthUtil {
    final private static String PREFIX_BASIC = "Basic ";
    final private static String PREFIX_BEARER = "Bearer ";

    final private APIResponse response = new APIResponse();

    public AccountEntity decodeAccount(String authData, String jwtToken) throws APIException {
        AccountEntity account;
        if (null != jwtToken) {
            account = getAccountFromJWTbyIII(jwtToken);
        }
        else if (null != authData && !authData.isEmpty()) {
            // HTTP Basic authorization
            if (authData.startsWith(PREFIX_BASIC)) {
                String b64Text = authData.substring(
                    PREFIX_BASIC.length()
                ).trim();
                if (b64Text.isEmpty()) {
                    throw new APIException(response.fail(
                        Response.Status.UNAUTHORIZED,
                        APIError.AuthNotProvidedError.getCode(),
                        "no Basic data in Authorization header"
                    ));
                }
                account = getAccountFromBasicAuth(b64Text);
            }

            // HTTP Bearer authorization
            else if (authData.startsWith(PREFIX_BEARER)) {
                String b64Text = authData.substring(
                    PREFIX_BEARER.length()
                ).trim();
                if (b64Text.isEmpty()) {
                    throw new APIException(response.fail(
                        Response.Status.UNAUTHORIZED,
                        APIError.AuthNotProvidedError.getCode(),
                        "no Bearer data in Authorization header"
                    ));
                }
                account = getAccountFromBearerAuth(b64Text);
            }

            // Unsupported authorization
            else {
                throw new APIException(response.fail(
                    Response.Status.UNAUTHORIZED,
                    APIError.AuthNotSupportedError.getCode(),
                    "either Basic or Bearer supported for Authorization header"
                ));
            }
        }
        else {
            throw new APIException(response.fail(
                Response.Status.UNAUTHORIZED,
                APIError.AuthNotProvidedError.getCode(),
                "no Authorization header"
            ));
        }

        if (!account.isEnabled()) {
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN,
                APIError.AccountNotEnabledError.getCode(),
                "account was disabled by system"
            ));
        }

        return account;
    }

    private AccountEntity getAccountFromBasicAuth(String data) throws APIException {
        final Base64.Decoder decoder = Base64.getDecoder();

        String token;
        try {
            token = new String(decoder.decode(data), "UTF-8");
        }
        catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode(),
                "Basic value of Authorization header is not UTF-8"
            ));
        }

        String[] credentials = token.split(":", 2);
        if (2 != credentials.length) {
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode(),
                "invalid format in Basic value of Authorization header"
            ));
        }

        AccountEntity account;
        EntityManager em = JPAUtil.createEntityManager();
        try {
            account = em
                .createQuery("SELECT e FROM AccountEntity e" +
                             " WHERE e.name=:username" +
                             "   AND e.password=:password",
                             AccountEntity.class)
                .setParameter("username", credentials[0])
                .setParameter("password", credentials[1])
                .getSingleResult();
            em.detach(account);
            return account;
        }
        catch (NoResultException e) {
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthError.getCode(),
                "no such user exists in system database"
            ));
        }
        catch (Exception e) {
            throw new APIException(response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            ));
        }
        finally {
            em.close();
        }
    }

    private AccountEntity getAccountFromBearerAuth(String data) throws APIException {
        final Base64.Decoder decoder = Base64.getDecoder();

        String token;
        try {
            token = new String(decoder.decode(data), "UTF-8");
        }
        catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode(),
                "Bearer value of Authorization header is not UTF-8 decode-able"
            ));
        }

        JSONObject json = new JSONObject(token);
        if (!json.has("userName")) {
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode(),
                "no userName attribute exists inside Bearer JSON data"
            ));
        }

        AccountEntity account;
        String username = json.getString("userName");
        EntityManager em = JPAUtil.createEntityManager();
        try {
            account = em
                .createQuery("SELECT e FROM AccountEntity e" +
                             " WHERE e.name=:username",
                             AccountEntity.class)
                .setParameter("username", username)
                .getSingleResult();
            em.detach(account);
            em.close();
            return account;
        }
        catch (NoResultException e) {
            // create this SSO account in our database below
        }
        catch (Exception e) {
            em.close();
            throw new APIException(response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            ));
        }

        // if it goes here, it means that a new account for SSO
        // need to be created!
        if (!json.has("profile")) {
            em.close();
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode(),
                "no profile attribute exists inside Bearer JSON data"
            ));
        }

        JSONObject profile = json.getJSONObject("profile");
        if (!profile.has("email")) {
            em.close();
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode(),
                "no email attribute exists inside Bearer JSON data"
            ));
        }

        account = new AccountEntity();
        account.setName(username);
        account.setEnabled(true);
        account.setPassword("eipaas1234");
        account.setMail(profile.getString("email"));
        account.setCreatets(new Timestamp(System.currentTimeMillis()));

        int num_name = 0;
        if (profile.has("given_name")) {
            num_name += 1;
            account.setFirstname(profile.getString("given_name"));
        }
        if (profile.has("family_name")) {
            num_name += 1;
            account.setLastname(profile.getString("family_name"));
        }
        if (2 == num_name) {
            account.setFullname(
                account.getFirstname() + " " + account.getLastname()
            );
        }

        persistAccount(em, account, true, true);
        return account;
    }

    private AccountEntity getAccountFromJWTbyIII(String jwtData) throws APIException {
        // Currently, we don't introduce JWT library since java-jwt can't
        // acquire information other than official claims. sigh!!!

        String[] parts = jwtData.split("\\.");
        if (2 != parts.length && 3 != parts.length) {
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode(),
                "invalid JWT token format provided"
            ));
        }

        final Base64.Decoder decoder = Base64.getDecoder();
        String b64Text = parts[1];
        String payload;

        try {
            payload = new String(decoder.decode(b64Text), "UTF-8");
        }
        catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode(),
                "payload of JWT token is not UTF-8 decode-able"
            ));
        }

        JSONObject json = new JSONObject(payload);
        if (!json.has("email") || !json.has("exp")) {
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode(),
                "no email or exp attribute inside JWT payload"
            ));
        }

        long exp = json.getLong("exp");
        if (System.currentTimeMillis() > exp * 1000) {
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode(),
                "provided token expired"
            ));
        }

        AccountEntity account;
        String email = json.getString("email");
        EntityManager em = JPAUtil.createEntityManager();
        try {
            account = em
                .createQuery("SELECT e FROM AccountEntity e" +
                             " WHERE e.mail=:email",
                             AccountEntity.class)
                .setParameter("email", email)
                .getSingleResult();
            em.detach(account);
            em.close();
            return account;
        }
        catch (NoResultException e) {
            // create this SSO account in our database below
        }
        catch (Exception e) {
            em.close();
            throw new APIException(response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            ));
        }

        // if it goes here, it means that a new account for SSO
        // need to be created!!
        String name = email.split("@")[0];  // SSO should validate this for us
        account = new AccountEntity();
        account.setName(name);
        account.setEnabled(true);
        account.setPassword("eipaas1234");
        account.setMail(email);
        account.setCreatets(new Timestamp(System.currentTimeMillis()));

        persistAccount(em, account, true, true);
        return account;
    }

    private void persistAccount(EntityManager em, AccountEntity account,
                                boolean detachAfter, boolean closeManager)
    throws APIException{
        em.getTransaction().begin();
        try {
            em.persist(account);
            em.getTransaction().commit();
            if (detachAfter) {
                em.detach(account);
            }
        }
        catch (Exception e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            ));
        }
        finally {
            if (closeManager) {
                em.close();
            }
        }
    }
}
