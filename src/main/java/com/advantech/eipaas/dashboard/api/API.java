package com.advantech.eipaas.dashboard.api;


import java.io.UnsupportedEncodingException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Base64;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;

import com.advantech.eipaas.dashboard.entities.AccountEntity;
import com.advantech.eipaas.dashboard.entities.DashboardEntity;
import com.advantech.eipaas.dashboard.utils.JPAUtil;
import org.json.JSONObject;


@Path("/api")
public class API {
    private final String ACCOUNT_ID = "aid";
    private final String PASSWORD = "password";

    private Response makeResponse(Response.Status status, Object result) {
        JSONObject json = new JSONObject();
        json.put("success", Response.Status.OK == status);
        json.put("result", null == result ? "" : result);
        return Response.status(status).entity(json.toString()).build();
    }

    private Response success(Object data) {
        return makeResponse(Response.Status.OK, data);
    }

    private Response fail(Response.Status status, int errorCode, Object target) {
        Error e = Error.getErrorInstance(errorCode);

        Map<String, Object> result = new HashMap<>();
        result.put("code", e.getCode());
        result.put("name", e.getName());
        result.put("description", e.getDescription());
        if (null != target) {
            result.put("target", target);
        }

        return makeResponse(status, result);
    }

    private Response fail(Response.Status status, int errorCode) {
        return fail(status, errorCode, null);
    }

    private Map<String, Object> makeSheetJSON(DashboardEntity e) {
        Map<String, Object> json = new HashMap<>();
        json.put("did", e.getDid());
        json.put("sheet", e.getSheet());
        json.put("sequence", e.getSequence());
        json.put("content", new JSONObject(e.getContent()));
        return json;
    }

    @GET
    @Path("/account/login")
    @Produces(MediaType.APPLICATION_JSON)
    public Response login(@QueryParam("username") String username, @QueryParam("password") String password) throws Exception {
        EntityManager em = JPAUtil.createEntityManager();
        TypedQuery<AccountEntity> query = em.createQuery(
            "SELECT e FROM AccountEntity e WHERE e.name=:username AND e.password=:password",
            AccountEntity.class
        );
        query.setParameter("username", username);
        query.setParameter("password", password);

        AccountEntity account;
        try {
            account = query.getSingleResult();
        }
        catch (Exception e) {
            em.close();
            return fail(Response.Status.FORBIDDEN, Error.AuthorizationError.getCode());
        }

        if (!account.isEnabled()) {
            em.close();
            return fail(Response.Status.FORBIDDEN, Error.AccountNotEnabledError.getCode());
        }

        em.getTransaction().begin();
        try {
            account.setLogints(new Timestamp(System.currentTimeMillis()));
            em.getTransaction().commit();
        }
        catch (Exception e) {
            em.getTransaction().rollback();
            // we don't care, should logging something in the future
        }
        finally {
            em.close();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("aid", account.getAid());
        return success(result);
    }

    @GET
    @Path("/sheet")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSheets(@HeaderParam("Authorization") String authorization) throws Exception {
        Map<String, Object> credential = decodeAuthorization(authorization);
        if (null == credential) {
            return fail(Response.Status.FORBIDDEN, Error.AuthorizationError.getCode());
        }

        EntityManager em = JPAUtil.createEntityManager();
        long accountID = (long) credential.get(ACCOUNT_ID);
        String password = (String) credential.get(PASSWORD);

        AccountEntity account = em.find(AccountEntity.class, accountID);
        if ((null == account) || !account.getPassword().equals(password)) {
            em.close();
            return fail(Response.Status.FORBIDDEN, Error.AuthorizationError.getCode());
        }
        if (!account.isEnabled()) {
            em.close();
            return fail(Response.Status.FORBIDDEN, Error.AccountNotEnabledError.getCode());
        }

        TypedQuery<DashboardEntity> query = em.createQuery(
            "SELECT e FROM DashboardEntity e WHERE e.aid=:aid ORDER BY e.sequence ASC",
            DashboardEntity.class
        );

        query.setParameter("aid", accountID);
        List<DashboardEntity> sheets = query.getResultList();

        List<Map<String, Object>> content = new ArrayList<>();
        for (DashboardEntity e: sheets) {
            content.add(makeSheetJSON(e));
        }

        em.close();
        return success(content);
    }

    @POST
    @Path("/sheet")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createSheet(@HeaderParam("Authorization") String authorization, String sheetData) throws Exception {
        Map<String, Object> credential = decodeAuthorization(authorization);
        if (null == credential) {
            return fail(Response.Status.FORBIDDEN, Error.AuthorizationError.getCode());
        }

        EntityManager em = JPAUtil.createEntityManager();
        long accountID = (long) credential.get(ACCOUNT_ID);
        String password = (String) credential.get(PASSWORD);

        AccountEntity account = em.find(AccountEntity.class, accountID);
        if ((null == account) || !account.getPassword().equals(password)) {
            em.close();
            return fail(Response.Status.FORBIDDEN, Error.AuthorizationError.getCode());
        }
        if (!account.isEnabled()) {
            em.close();
            return fail(Response.Status.FORBIDDEN, Error.AccountNotEnabledError.getCode());
        }

        JSONObject json = new JSONObject(sheetData);
        if (!json.has("sheet")) {
            return fail(Response.Status.BAD_REQUEST, Error.DataNotCompleteError.getCode(), "sheet");
        }
        if (!json.has("content")) {
            return fail(Response.Status.BAD_REQUEST, Error.DataNotCompleteError.getCode(), "content");
        }

        // how many sheet exists in database currently?
        int seqAll = Integer.parseInt(em.createQuery(
            "SELECT COUNT(e) FROM DashboardEntity e WHERE aid=:aid"
        ).setParameter("aid", accountID).getSingleResult().toString());

        DashboardEntity sheet = new DashboardEntity();
        sheet.setAid(accountID);
        sheet.setSheet(json.getString("sheet"));
        sheet.setContent(json.get("content").toString());
        sheet.setSequence(seqAll + 1);
        sheet.setCreatets(new Timestamp(System.currentTimeMillis()));

        em.getTransaction().begin();
        try {
            em.persist(sheet);
            em.getTransaction().commit();
            return success(makeSheetJSON(sheet));
        }
        catch (Exception e) {
            e.printStackTrace();
            em.getTransaction().rollback();
            return fail(Response.Status.INTERNAL_SERVER_ERROR, Error.DatabaseOperationError.getCode());
        }
        finally {
            em.close();
        }
    }

    @PUT
    @Path("/sheet/{did}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updateSheet(@HeaderParam("Authorization") String authorization, @PathParam("did") long did, String sheetData) throws Exception {
        Map<String, Object> credential = decodeAuthorization(authorization);
        if (null == credential) {
            return fail(Response.Status.FORBIDDEN, Error.AuthorizationError.getCode());
        }

        EntityManager em = JPAUtil.createEntityManager();
        long accountID = (long) credential.get(ACCOUNT_ID);
        String password = (String) credential.get(PASSWORD);

        AccountEntity account = em.find(AccountEntity.class, accountID);
        if ((null == account) || !account.getPassword().equals(password)) {
            em.close();
            return fail(Response.Status.FORBIDDEN, Error.AuthorizationError.getCode());
        }
        if (!account.isEnabled()) {
            em.close();
            return fail(Response.Status.FORBIDDEN, Error.AccountNotEnabledError.getCode());
        }

        JSONObject json = new JSONObject(sheetData);
        if (!json.has("sequence")) {
            return fail(Response.Status.BAD_REQUEST, Error.DataNotCompleteError.getCode(), "sequence");
        }

        int seqNew = json.getInt("sequence");
        int seqAll = Integer.parseInt(em.createQuery(
            "SELECT COUNT(e) FROM DashboardEntity e WHERE aid=:aid"
        ).setParameter("aid", accountID).getSingleResult().toString());
        if (seqNew <= 0 || seqNew > seqAll) {
            return fail(Response.Status.BAD_REQUEST, Error.SequenceOutOfBoundError.getCode(), seqNew);
        }

        int seqMin = seqNew;
        int seqMax = seqNew;

        em.getTransaction().begin();
        try {
            DashboardEntity sheet = em.find(DashboardEntity.class, did);
            if (null == sheet) {
                return fail(Response.Status.NOT_FOUND, Error.SheetNotFoundError.getCode(), did);
            }

            int seqOld = sheet.getSequence();
            if (seqOld > seqMax) {
                seqMax = seqOld;
            }
            else if (seqOld < seqMin) {
                seqMax = seqOld;
            }

            sheet.setSequence(seqNew);
            if (json.has("sheet")) {
                sheet.setSheet(json.getString("sheet"));
            }
            if (json.has("content")) {
                sheet.setContent(json.get("content").toString());
            }
            em.merge(sheet);

            // sequence adjustment
            if (seqOld != seqNew) {
                String query = "UPDATE DashboardEntity SET sequence=sequence" + ((seqOld > seqNew) ? "+1" : "-1") +
                    " WHERE aid=:aid AND did!=:did AND sequence>=:seqMin AND sequence<=:seqMax";
                em.createQuery(query)
                    .setParameter("aid", accountID)
                    .setParameter("did", did)
                    .setParameter("seqMin", seqMin)
                    .setParameter("seqMax", seqMax)
                    .executeUpdate();
            }

            em.getTransaction().commit();
            return success("sheet updated");
        }
        catch (Exception e) {
            em.getTransaction().rollback();
            return fail(Response.Status.INTERNAL_SERVER_ERROR, Error.DatabaseOperationError.getCode());
        }
        finally {
            em.close();
        }
    }

    @DELETE
    @Path("/sheet/{did}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteSheet(@HeaderParam("Authorization") String authorization, @PathParam("did") long did) throws Exception {
        Map<String, Object> credential = decodeAuthorization(authorization);
        if (null == credential) {
            return fail(Response.Status.FORBIDDEN, Error.AuthorizationError.getCode());
        }

        EntityManager em = JPAUtil.createEntityManager();
        long accountID = (long) credential.get(ACCOUNT_ID);
        String password = (String) credential.get(PASSWORD);

        AccountEntity account = em.find(AccountEntity.class, accountID);
        if ((null == account) || !account.getPassword().equals(password)) {
            em.close();
            return fail(Response.Status.FORBIDDEN, Error.AuthorizationError.getCode());
        }
        if (!account.isEnabled()) {
            em.close();
            return fail(Response.Status.FORBIDDEN, Error.AccountNotEnabledError.getCode());
        }

        TypedQuery<DashboardEntity> qCreate = em.createQuery(
            "SELECT e FROM DashboardEntity e WHERE e.aid=:aid ORDER BY e.sequence ASC",
            DashboardEntity.class
        );
        qCreate.setParameter("aid", accountID);

        em.getTransaction().begin();
        try {
            List<DashboardEntity> sheets = qCreate.getResultList();

            int seqDeleted = 0;
            for (DashboardEntity e : sheets) {
                int sequence = e.getSequence();
                if (e.getDid() == did) {
                    em.remove(e);
                    seqDeleted = sequence;
                }
                // re-sequence sheets
                else if (seqDeleted > 0 && sequence > seqDeleted) {
                    e.setSequence(sequence - 1);
                    em.merge(e);
                }
            }
            em.getTransaction().commit();
            return success("sheet deleted");
        }
        catch (Exception e) {
            em.getTransaction().rollback();
            return fail(Response.Status.INTERNAL_SERVER_ERROR, Error.DatabaseOperationError.getCode());
        }
        finally {
            em.close();
        }
    }

    private Map<String, Object> decodeAuthorization(String authorization) {
        if (null != authorization) {
            // http basic authorization
            if (authorization.startsWith("Basic")) {
                final Base64.Decoder decoder = Base64.getDecoder();
                String b64Text = authorization.substring("Basic".length()).trim();
                if (b64Text.length() > 0) {
                    try {
                        String token = new String(decoder.decode(b64Text), "UTF-8");
                        String[] credentials = token.split(":", 2);
                        if (2 == credentials.length) {
                            Map<String, Object> ans = new HashMap<>();
                            ans.put(ACCOUNT_ID, Long.parseLong(credentials[0]));
                            ans.put(PASSWORD, credentials[1]);
                            return ans;
                        }
                    }
                    catch (UnsupportedEncodingException e) {
                        return null;
                    }
                }
            }
        }

        // can't decode
        return null;
    }
}
