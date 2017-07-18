package com.advantech.eipaas.dashboard.utils;


import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.sql.Timestamp;
import java.io.UnsupportedEncodingException;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.security.KeyManagementException;
import java.security.cert.X509Certificate;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Cookie;
import javax.ws.rs.core.NewCookie;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.interfaces.Claim;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTDecodeException;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;

import com.advantech.eipaas.dashboard.api.APIError;
import com.advantech.eipaas.dashboard.api.APIException;
import com.advantech.eipaas.dashboard.api.APIResponse;
import com.advantech.eipaas.dashboard.entities.AccountEntity;


class TokenValidationRequest {
    private String token;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    TokenValidationRequest(final String token) {
        this.token = token;
    }
}


class TokenRefreshRequest {
    private String token;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    TokenRefreshRequest(final String token) {
        this.token = token;
    }
}


class TokenRefreshResponse {
    private String tokenType;
    private String accessToken;
    private long expiresIn;
    private String refreshToken;

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}


//
// FIXME:
//   1) Introduce a logging framework instead of println()
//      and printStackTrace()
//
public class AuthUtil {
    // HTTP "Authorization" header relevant
    private static final String HDR_BASIC = "Basic ";
    private static final String HDR_BEARER = "Bearer ";
    private static final String HDR_AUTH = "Authorization";

    // Cookie names, domain
    public static final String CN_BUILTIN = "EIToken";
    private static final String CN_SSO = "WISEAccessToken";

    // Don't change the following values relevant JWT as possible.
    private static final String JWT_TYPE = "EI-Dashboard";
    private static final String JWT_SECRET = "JWT@EI-Dashboard@WISE-PaaS";

    public class Auth {
        private String token;
        private String cookieName;
        private boolean tokenRefreshed;
        private AccountEntity account;

        public String getToken() {
            return token;
        }

        public String getCookieName() {
            return this.cookieName;
        }

        public boolean isTokenRefreshed() {
            return tokenRefreshed;
        }

        public AccountEntity getAccount() {
            return account;
        }

        Auth(final AccountEntity account,
             final String token,
             final String cookieName,
             final boolean tokenRefreshed) {
            this.account = account;
            this.token = token;
            this.cookieName = cookieName;
            this.tokenRefreshed = tokenRefreshed;
        }
    }

    private Auth auth;
    private String domain;
    private String scheme;
    private boolean isSecure;
    private String urlRefresh;
    private String urlValidation;

    private final boolean refreshLogin;
    private final Algorithm jwtAlgorithm;
    private final JWTVerifier jwtVerifier;
    private final APIResponse response = new APIResponse();
    private final PasswordUtil pu = new PasswordUtil();

    public Auth getAuth() {
        return auth;
    }

    /**
     * There are 3 means supported for authorization in our system currently:
     * <p><ol>
     * <li>
     * Uses HTTP header authorization with "Basic" data type.
     * This way is only used for our own system account in login process.
     * If this step goes well, the client will acquire type 3 data.
     * <li>
     * Uses HTTP header authorization with "Bearer" data type.
     * This way is only used for native applications JWT token
     * from SSO by III.
     * <li>
     * Uses HTTP only cookie with JWT type.
     * This way is used for our own system account, and web applications
     * JWT token from SSO by III.
     * </ol>
     */
    public AuthUtil(final HttpHeaders headers,
                    final HttpServletRequest request,
                    final boolean refreshLogin)
            throws APIException {
        parseRequest(request);
        this.refreshLogin = refreshLogin;


        try {
            this.jwtAlgorithm = Algorithm.HMAC512(JWT_SECRET);
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.ServerError.getCode(),
                    "server is running into a JWT problem"
            ));
        }

        this.jwtVerifier = JWT.require(this.jwtAlgorithm).build();
        Map<String, Cookie> cookies = headers.getCookies();

        // 1st priority: ei-dashboard builtin
        // HTTP only cookie with JWT type
        if (cookies.get(CN_BUILTIN) != null) {
            decodeAuthFromBuiltin(cookies.get(CN_BUILTIN).getValue());
        }

        // 2nd priority: web sso by iii
        // HTTP only cookie with JWT type
        else if (cookies.get(CN_SSO) != null) {
            String wiseAccessToken = cookies.get(CN_SSO).getValue();
            decodeAuthFromSSOToken(wiseAccessToken, CN_SSO, true);
        }

        // 3rd priority:
        // either native sso by iii, or ei-dashboard log in
        else if (headers.getHeaderString(HDR_AUTH) != null) {
            String authorization = headers.getHeaderString(HDR_AUTH);

            // 1st priority: HTTP Basic authorization
            // It's the login action to our own system
            if (authorization.startsWith(HDR_BASIC)) {
                String b64Text = authorization
                        .substring(HDR_BASIC.length())
                        .trim();
                if (b64Text.isEmpty()) {
                    throw new APIException(response.fail(
                            Response.Status.FORBIDDEN,
                            APIError.AuthNotProvidedError.getCode(),
                            "no Basic data in Authorization header"
                    ));
                }
                processLogin(b64Text);
            }
            // 2nd priority: HTTP Bearer authorization
            // It's native SSO by III
            else if (authorization.startsWith(HDR_BEARER)) {
                String wiseAppToken = authorization
                        .substring(HDR_BEARER.length())
                        .trim();
                if (wiseAppToken.isEmpty()) {
                    throw new APIException(response.fail(
                            Response.Status.FORBIDDEN,
                            APIError.AuthNotProvidedError.getCode(),
                            "no Bearer data in Authorization header"
                    ));
                }
                decodeAuthFromSSOToken(wiseAppToken, null, false);
            }
            // Unsupported authorization
            else {
                throw new APIException(response.fail(
                        Response.Status.FORBIDDEN,
                        APIError.AuthNotSupportedError.getCode(),
                        "no valid data in Authorization header"
                ));
            }
        }

        // unknown!!!
        else {
            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.AuthNotProvidedError.getCode(),
                    "cannot extract valid authorization data"
            ));
        }

        // check account enabled
        if (!this.getAuth().getAccount().isEnabled()) {
            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.AccountNotEnabledError.getCode(),
                    "the given account is disabled by system"
            ));
        }
    }

    /**
     * Check the token is refreshed for this auth. If yes, assign a new
     * cookie for the response.
     *
     * @param builder A Jersey ResponseBuilder instance.
     */
    public void checkTokenRefresh(Response.ResponseBuilder builder) {
        if (auth.isTokenRefreshed() && null != auth.getCookieName()) {
            builder.cookie(new NewCookie(
                    auth.getCookieName(), auth.getToken(),
                    "/", domain, null, -1, isSecure, true
            ));
        }
    }

    /**
     * Purge the give cookie.
     *
     * @param builder A Jersey ResponseBuilder instance.
     */
    public void purgeBuiltinCookie(Response.ResponseBuilder builder) {
        builder.cookie(new NewCookie(
                CN_BUILTIN, null, "/", domain, null, 0, isSecure, true)
        );
    }

    /**
     * Decode our own system built-in JWT token. The content of JWT token
     * can be found in {@link #makeBuiltinToken(AccountEntity)} method.
     *
     * @param eiToken JWT token from system built-in
     * @throws APIException Related exception
     */
    private void decodeAuthFromBuiltin(final String eiToken)
            throws APIException {
        DecodedJWT jwt = verifyBuiltinToken(eiToken);
        Claim email = getJWTClaim(jwt, "email", true);

        AccountEntity account;
        try {
            account = getAccountByMail(email.asString());
        } catch (NoResultException e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.AuthError.getCode(),
                    "username or password incorrect"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.ServerError.getCode(),
                    "check server log for more information"
            ));
        }
        this.auth = new Auth(account, eiToken, CN_BUILTIN, false);
    }

    /**
     * WISEAccessToken format:
     * <pre>
     * {@code
     *   header
     *   {
     *     "alg": "HS512",
     *     "typ": "WISEAccessToken"
     *   }
     *   payload
     *   {
     *     "uid": "72754f95-1988-4ec9-b8a5-9433c89cf198",
     *     "firstName": "Sign On",
     *     "lastName": "Single",
     *     "country": "TW",
     *     "upn": "sso-azure@wisesso.onmicrosoft.com",
     *     "displayName": "SSO%20on%20Azure",
     *     "scopes": [],
     *     "exp": 1497597390,
     *     "userRole": "developer",
     *     "iat": 1497593790,
     *     "email": "teddy15b@gmail.com",
     *     "refreshToken": "1c87ee60-f040-4db8-a006-b3450ee8ea16"
     *   }
     * }
     * </pre>
     * <p>
     * WISEAppToken format:
     * <pre>
     * {@code
     *   header
     *   {
     *     "alg": "HS512",
     *     "typ": "WISEAppToken"
     *   }
     *   payload
     *   {
     *     "owner": "1e6b41b9-5932-4ad9-9859-06a7b49f9373",
     *     "lastName": "liu",
     *     "country": "TW",
     *     "displayName": "tungyi",
     *     "appName": "Node-Red",
     *     "roles": [],
     *     "groups": [
     *       "tungyi"
     *     ],
     *     "type": "native",
     *     "uid": "1e6b41b9-5932-4ad9-9859-06a7b49f9373",
     *     "firstName": "tung yi",
     *     "upn": "tungyi@wisesso.onmicrosoft.com",
     *     "appId": "7df9da53-bc12-4bfb-a5fc-d4efb8f72b9d",
     *     "exp": 1497946639,
     *     "iat": 1497943039,
     *     "email": "tung.yi@advantech.com.tw",
     *     "refreshToken": "1b002ded-e4bb-4d60-b776-31528a5ea74c"
     *   }
     * }
     * </pre>
     *
     * @param ssoToken         JWT token from SSO server by III,
     *                         either WISEAccessToken or WISEAppToken
     * @param refreshIfExpired A boolean value indicates whether token refresh
     *                         is necessary if it's expired
     * @throws APIException Related exception
     */
    private void decodeAuthFromSSOToken(String ssoToken,
                                        final String cookieName,
                                        final boolean refreshIfExpired)
            throws APIException {
        DecodedJWT jwt = decodeJWTToken(ssoToken);
        boolean expired = validateSSOToken(ssoToken);

        if (expired) {
            if (refreshIfExpired) {
                Claim refreshToken = getJWTClaim(jwt, "refreshToken", true);
                ssoToken = refreshSSOToken(refreshToken.asString());
                jwt = decodeJWTToken(ssoToken);
            } else {
                throw new APIException(response.fail(
                        Response.Status.FORBIDDEN,
                        APIError.AuthTokenExpiredError.getCode()
                ));
            }
        }

        AccountEntity account;
        Claim email = getJWTClaim(jwt, "email", true);

        try {
            account = getAccountByMail(email.asString());
        } catch (NoResultException e) {
            // create this SSO account in our database
            Claim firstName = getJWTClaim(jwt, "firstName", false);
            Claim lastName = getJWTClaim(jwt, "lastName", false);
            account = createAccount(firstName.asString(),
                    lastName.asString(), email.asString());
        } catch (Exception e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.ServerError.getCode(),
                    "check server log for more information"
            ));
        }

        // construct our Auth instance
        this.auth = new Auth(account, ssoToken, cookieName, expired);
    }

    /**
     * Process native system log in process.
     *
     * @param authorization HTTP Basic authorization data
     */
    private void processLogin(final String authorization)
            throws APIException {
        String basicData;
        final Base64.Decoder decoder = Base64.getDecoder();

        try {
            basicData = new String(decoder.decode(authorization), "UTF-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.AuthDataError.getCode(),
                    "Basic value of Authorization header is not UTF-8"
            ));
        }

        String[] credentials = basicData.split(":", 2);
        if (2 != credentials.length) {
            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.AuthDataError.getCode(),
                    "invalid format in Basic value of Authorization header"
            ));
        }

        String username = credentials[0];
        String password = credentials[1];
        AccountEntity account = getAccountByName(username);

        boolean oldStyle = account.getPassword().equals(password);
        boolean newStyle = pu.authenticate(password, account.getPassword());
        if (!oldStyle && !newStyle) {
            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.AuthDataError.getCode(),
                    "username or password incorrect"
            ));
        }

        // Okay!!!
        // This user can log in our system, make a JWT token for he/she.
        // Remember that the 3rd parameter of Auth(), tokenRefreshed,
        // must be true so that the caller can be assign this value into
        // client's cookie
        String jwtToken = makeBuiltinToken(account);
        this.auth = new Auth(account, jwtToken, CN_BUILTIN, true);
    }

    /**
     * This method check the given SSO token validation, and returns a boolean
     * value indicate whether this token is expired.
     * <p>
     * The response JSON content looks like:
     * <pre>
     * {@code
     *   {
     *     "tokenType": "Bearer",
     *     "accessToken": "ACCESS-TOKEN",
     *     "expiresIn": 1497840103,
     *     "refreshToken": "50a01650-cb86-446b-a192-fd763c14f3b6"
     *   }
     * }
     * </pre>
     *
     * @param token The token to be validated
     * @return A boolean value indicates whether the token is expired
     * @throws APIException Related exception
     */
    private boolean validateSSOToken(final String token)
            throws APIException {
        TokenValidationRequest body = new TokenValidationRequest(token);
        final int status = makeClient()
                .target(urlValidation)
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.entity(body, MediaType.APPLICATION_JSON))
                .getStatus();

        if (200 == status) {
            return false;
        } else if (400 == status) {
            throw new APIException(response.fail(
                    Response.Status.BAD_REQUEST,
                    APIError.AuthSSOValidationError.getCode(),
                    "token is invalid"
            ));
        } else if (401 == status) {
            // per III spec, 401 indicates the token has expired
            return true;
        } else {
            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.ServerError.getCode(),
                    "unknown response code from SSO token validation"
            ));
        }
    }

    /**
     * This method renew a SSO token.
     * <p>
     * The response JSON content looks like:
     * <pre>
     * {@code
     *   {
     *     "tokenType": "Bearer",
     *     "accessToken": "NEW-ACCESS-TOKEN",
     *     "expiresIn": 1497840103,
     *     "refreshToken": "50a01650-cb86-446b-a192-fd763c14f3b6"
     *   }
     * }
     * </pre>
     *
     * @param refreshToken The SSO refresh token
     * @return New SSO token
     * @throws APIException Related exception
     */
    private String refreshSSOToken(final String refreshToken)
            throws APIException {
        TokenRefreshRequest body = new TokenRefreshRequest(refreshToken);
        final Response response = makeClient()
                .target(urlRefresh)
                .request(MediaType.APPLICATION_JSON)
                .post(Entity.entity(body, MediaType.APPLICATION_JSON));

        final int status = response.getStatus();
        if (200 == status) {
            try {
                return response
                        .readEntity(TokenRefreshResponse.class)
                        .getAccessToken();
            } catch (Exception e) {
                e.printStackTrace();
                throw new APIException(this.response.fail(
                        Response.Status.FORBIDDEN,
                        APIError.AuthSSORefreshError.getCode(),
                        "cannot extract accessToken in token refreshing"
                ));
            }
        } else if (400 == status) {
            throw new APIException(this.response.fail(
                    Response.Status.BAD_REQUEST,
                    APIError.AuthSSORefreshError.getCode(),
                    "token has expired or not valid"
            ));
        } else {
            throw new APIException(this.response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.ServerError.getCode(),
                    "unknown response code from SSO token refresh"
            ));
        }
    }

    private AccountEntity getAccountByMail(final String mail)
            throws APIException {
        AccountEntity account;
        EntityManager em = JPAUtil.createEntityManager();

        if (refreshLogin) {
            em.getTransaction().begin();
        }

        String sql = "SELECT e FROM AccountEntity e WHERE e.mail=:mail";
        try {
            account = em.createQuery(sql, AccountEntity.class)
                    .setParameter("mail", mail)
                    .getSingleResult();
            if (refreshLogin) {
                account.setLogints(new Timestamp(System.currentTimeMillis()));
                em.getTransaction().commit();
            }
            return account;
        } finally {
            em.close();
        }
    }

    private AccountEntity getAccountByName(final String name)
            throws APIException {
        AccountEntity account;
        EntityManager em = JPAUtil.createEntityManager();

        if (refreshLogin) {
            em.getTransaction().begin();
        }

        String sql = "SELECT e FROM AccountEntity e WHERE e.name=:name";
        try {
            account = em.createQuery(sql, AccountEntity.class)
                    .setParameter("name", name)
                    .getSingleResult();
            if (refreshLogin) {
                account.setLogints(new Timestamp(System.currentTimeMillis()));
                em.getTransaction().commit();
            }
            return account;
        } catch (NoResultException e) {
            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.AuthDataError.getCode(),
                    "username or password incorrect"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.ServerError.getCode(),
                    "check server log for more information"
            ));
        } finally {
            em.close();
        }
    }

    private AccountEntity createAccount(final String firstName,
                                        final String lastName,
                                        final String mail)
            throws APIException {
        Timestamp now = new Timestamp(System.currentTimeMillis());
        AccountEntity account = new AccountEntity();
        account.setMail(mail);
        account.setName(mail);

        if (null != firstName) {
            account.setFirstname(firstName);
        }
        if (null != lastName) {
            account.setLastname(lastName);
        }
        if (null != firstName && null != lastName) {
            account.setFullname(String.format("%s %s", firstName, lastName));
        }

        try {
            account.setPassword(pu.hashedPassword("eipaas1234"));
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            System.err.println("Cannot set hashed password");
            e.printStackTrace();
            throw new APIException(response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.ServerError.getCode(),
                    "check server log for more information"
            ));
        }

        account.setEnabled(true);
        account.setCreatets(now);
        account.setLogints(now);
        saveAccount(account);
        return account;
    }

    private void saveAccount(AccountEntity account)
            throws APIException {
        EntityManager em = JPAUtil.createEntityManager();
        em.getTransaction().begin();
        try {
            em.persist(account);
            em.getTransaction().commit();
        } catch (Exception e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.DatabaseOperationError.getCode()
            ));
        } finally {
            em.close();
        }
    }

    /**
     * Method to make system built-in (our own) JWT token.
     * <p>
     * The system built-in JWT token header looks like
     * {
     * "alg": "HS512",
     * "typ": "EI-Dashboard"
     * }
     * <p>
     * The payload looks like the following
     * {
     * "iat": 1497593790,
     * "name": "alex",
     * "email": "alex.shao@advantech.com.tw",
     * "login": 1497597390
     * }
     */
    private String makeBuiltinToken(final AccountEntity account)
            throws APIException {
        try {
            Map<String, Object> header = new HashMap<>();
            header.put("alg", jwtAlgorithm.getName());
            header.put("typ", JWT_TYPE);

            long now = System.currentTimeMillis();
            return JWT.create()
                    .withHeader(header)
                    .withIssuedAt(new Date(now))
                    .withClaim("name", account.getName())
                    .withClaim("email", account.getMail())
                    .withClaim("login", account.getLogints())
                    .sign(jwtAlgorithm);
        } catch (JWTCreationException e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.ServerError.getCode(),
                    "server is running into problems of making JWT token"
            ));
        }
    }

    // Method to parse request
    private void parseRequest(final HttpServletRequest request) {
        this.isSecure = request.isSecure();
        this.scheme = request.getScheme();

        // Per our convention and PCF rules,
        // Each inbound request has the following URL:
        //
        //   <scheme>://<host>.<PCF_APP_DOMAIN>:<PORT>/<path>
        //
        // For example https://portal-abc-1-0-0-develop.wise-paas.com.cn
        // The scheme is https, host is portal-abc-1-0-0-develop,
        // and the PCF apps domain is wise-paas.com.cn
        Pattern pattern = Pattern.compile(
                "^([^:]+)://(?<host>[^.]+)\\.(?<domain>[^:/]+)(^\\d+)?(/.*)?$"
        );

        // Per W3 spec:
        //   URLs in general are case-sensitive (with the exception of
        //   machine names). There may be URLs, or parts of URLs, where
        //   case doesn't matter, but identifying these may not be easy.
        //   Users should always consider that URLs are case-sensitive.
        //
        // So we transform url into lower cases here!!!
        String url = request.getRequestURL().toString().toLowerCase();
        Matcher m = pattern.matcher(url);

        if (!m.find()) {
            System.out.println("The endpoint not follow convention: " + url);
            System.out.println(
                    "System assumes this runtime environment is local testing"
            );
            this.domain = null;
            this.urlRefresh = null;
            this.urlValidation = null;
        } else {
            this.domain = m.group("domain");
            String host = m.group("host");
            String space = "";

            if (host.endsWith("-develop")) {
                space = "-develop";
            } else if (host.endsWith("-stage")) {
                space = "-stage";
            }

            this.urlRefresh = String.format(
                    "%s://portal-sso%s.%s/sso/token",
                    this.scheme, space, this.domain
            );
            this.urlValidation = String.format(
                    "%s://portal-sso%s.%s/sso/tokenvalidation",
                    this.scheme, space, this.domain
            );
        }
    }

    // Method to verify, and returns if successful, system built-in JWT token
    private DecodedJWT verifyBuiltinToken(final String token)
            throws APIException {
        try {
            return jwtVerifier.verify(token);
        } catch (JWTVerificationException e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.AuthTokenVerificationError.getCode()
            ));
        }
    }

    // Method for convenient
    private DecodedJWT decodeJWTToken(final String token)
            throws APIException {
        DecodedJWT jwt;
        try {
            jwt = JWT.decode(token);
            return jwt;
        } catch (JWTDecodeException e) {
            System.err.println("Cannot decode JWT token: [" + token + "]");
            e.printStackTrace();

            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.AuthDataError.getCode(),
                    "cannot decode provided JWT token"
            ));
        }
    }

    // Method for convenient
    private Claim getJWTClaim(DecodedJWT jwt, String name, boolean throwIfNull)
            throws APIException {
        Claim claim = jwt.getClaim(name);
        if (throwIfNull && null == claim) {
            throw new APIException(response.fail(
                    Response.Status.FORBIDDEN,
                    APIError.AuthDataError.getCode(),
                    String.format("no '%s' claim inside token payload", name)
            ));
        }
        return claim;
    }

    // Method for convenient
    private Client makeClient() throws APIException {
        if (!isSecure) {
            return ClientBuilder.newClient();
        }

        // for SSL, here we skip SSL verification,
        // should remove once all certificates installed!!!
        try {
            TrustManager[] certs = new TrustManager[]{
                    new X509TrustManager() {
                        @Override
                        public X509Certificate[] getAcceptedIssuers() {
                            return null;
                        }

                        @Override
                        public void checkClientTrusted(X509Certificate[] certs,
                                                       String authType) {
                        }

                        @Override
                        public void checkServerTrusted(X509Certificate[] certs,
                                                       String authType) {
                        }
                    }
            };

            // install the all-trusting trust manager
            SSLContext sc = SSLContext.getInstance("TLS");
            sc.init(null, certs, new java.security.SecureRandom());
            return ClientBuilder.newBuilder()
                    .sslContext(sc)
                    .hostnameVerifier((v1, v2) -> true)
                    .build();
        } catch (NoSuchAlgorithmException|KeyManagementException e) {
            System.err.println("Cannot set SSL certificate properly!");
            e.printStackTrace();
            throw new APIException(response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.ServerError.getCode(),
                    "check server log for more information"
            ));
        }
    }
}
