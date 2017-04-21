package com.advantech.eipaas.dashboard.utils;


import java.sql.Timestamp;
import java.util.Base64;
import java.io.UnsupportedEncodingException;

import javax.persistence.EntityManager;
import javax.persistence.EntityNotFoundException;
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

    public AccountEntity decodeAccount(String data) throws APIException {
        if (null == data || data.isEmpty()) {
            throw new APIException(response.fail(
                Response.Status.UNAUTHORIZED,
                APIError.AuthNotProvidedError.getCode()
            ));
        }

        AccountEntity account;

        // HTTP Basic authorization
        if (data.startsWith(PREFIX_BASIC)) {
            String b64Text = data.substring(PREFIX_BASIC.length()).trim();
            if (b64Text.isEmpty()) {
                throw new APIException(response.fail(
                    Response.Status.UNAUTHORIZED,
                    APIError.AuthNotProvidedError.getCode()
                ));
            }
            account = getAccountFromBasicAuth(b64Text);
        }

        // HTTP Bearer authorization
        else if (data.startsWith(PREFIX_BEARER)) {
            String b64Text = data.substring(PREFIX_BEARER.length()).trim();
            if (b64Text.isEmpty()) {
                throw new APIException(response.fail(
                    Response.Status.UNAUTHORIZED,
                    APIError.AuthNotProvidedError.getCode()
                ));
            }
            account = getAccountFromBearerAuth(b64Text);
        }

        // Unsupported authorization
        else {
            throw new APIException(response.fail(
                Response.Status.UNAUTHORIZED,
                APIError.AuthNotSupportedError.getCode()
            ));
        }

        if (!account.isEnabled()) {
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN,
                APIError.AccountNotEnabledError.getCode()
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
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode()
            ));
        }

        String[] credentials = token.split(":", 2);
        if (2 != credentials.length) {
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode()
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
        catch (Exception e) {
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthError.getCode()
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
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode()
            ));
        }

        JSONObject json = new JSONObject(token);
        if (!json.has("userName")) {
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode()
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
        catch (EntityNotFoundException e) {
            // create this SSO account in our database below
        }
        catch (Exception e) {
            em.close();
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthError.getCode()
            ));
        }

        // if it goes here, it means that a new account for SSO
        // need to be created!
        if (!json.has("profile")) {
            em.close();
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode()
            ));
        }

        JSONObject profile = json.getJSONObject("profile");
        if (!profile.has("email")) {
            em.close();
            throw new APIException(response.fail(
                Response.Status.FORBIDDEN, APIError.AuthDataError.getCode()
            ));
        }

        int num_name = 0;
        account = new AccountEntity();
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

        account.setName(username);
        account.setEnabled(true);
        account.setPassword("eipaas1234");
        account.setCreatets(new Timestamp(System.currentTimeMillis()));

        em.getTransaction().begin();
        try {
            em.persist(account);
            em.getTransaction().commit();
            em.detach(account);
        }
        catch (Exception e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            ));
        }
        finally {
            em.close();
        }

        return account;
    }
}
