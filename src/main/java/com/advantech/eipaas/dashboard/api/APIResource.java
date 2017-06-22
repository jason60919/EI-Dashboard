package com.advantech.eipaas.dashboard.api;


import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.sql.Timestamp;

import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.POST;
import javax.ws.rs.DELETE;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Cookie;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.NewCookie;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.SecurityContext;
import javax.persistence.EntityManager;

import org.json.JSONObject;

import com.advantech.eipaas.dashboard.entities.DashboardEntity;
import com.advantech.eipaas.dashboard.utils.JPAUtil;
import com.advantech.eipaas.dashboard.utils.AuthUtil;


@Path("/api")
public class APIResource {
    private final APIResponse response = new APIResponse();
    private final static String DOMAIN = System.getenv("COOKIE_DOMAIN");

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
    public Response login(@Context HttpHeaders headers,
                          @Context SecurityContext sc) {
        AuthUtil util;
        try {
            util = new AuthUtil(headers, true, sc.isSecure());
        } catch (APIException e) {
            return e.getErrorResponse().build();
        }

        AuthUtil.Auth auth = util.getAuth();
        Response.ResponseBuilder builder = response.success("user logged in");
        checkAuthToken(builder, auth, sc.isSecure());
        return builder.build();
    }

    @GET
    @Path("/account/logout")
    @Produces(MediaType.APPLICATION_JSON)
    public Response logout(@Context HttpHeaders headers,
                           @Context SecurityContext sc) {
        Response.ResponseBuilder builder = response.success("user logged out");
        Cookie cookie = headers.getCookies().get(AuthUtil.CN_BUILTIN);
        if (null != cookie) {
            builder.cookie(new NewCookie(cookie, null, 0, sc.isSecure()));
        }
        return builder.build();
    }

    @GET
    @Path("/sheet")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSheets(@Context HttpHeaders headers,
                              @Context SecurityContext sc) {
        AuthUtil util;
        try {
            util = new AuthUtil(headers, false, sc.isSecure());
        } catch (APIException e) {
            return e.getErrorResponse().build();
        }

        AuthUtil.Auth auth = util.getAuth();
        EntityManager em = JPAUtil.createEntityManager();
        String sql = "SELECT e FROM DashboardEntity e" +
                " WHERE e.aid=:aid ORDER BY e.sequence ASC";

        List<DashboardEntity> sheets;
        try {
            sheets = em.createQuery(sql, DashboardEntity.class)
                    .setParameter("aid", auth.getAccount().getAid())
                    .getResultList();
        } catch (Exception e) {
            e.printStackTrace();
            return response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.DatabaseOperationError.getCode()
            ).build();
        } finally {
            em.close();
        }

        List<Map<String, Object>> content = new ArrayList<>();
        for (DashboardEntity e : sheets) {
            content.add(makeSheetJSON(e));
        }

        Response.ResponseBuilder builder = response.success(content);
        checkAuthToken(builder, auth, sc.isSecure());
        return builder.build();
    }

    @POST
    @Path("/sheet")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createSheet(@Context HttpHeaders headers,
                                @Context SecurityContext sc,
                                String sheetData) {
        AuthUtil util;
        try {
            util = new AuthUtil(headers, false, sc.isSecure());
        } catch (APIException e) {
            return e.getErrorResponse().build();
        }

        JSONObject json = new JSONObject(sheetData);
        if (!json.has("sheet")) {
            return response.fail(
                    Response.Status.BAD_REQUEST,
                    APIError.DataNotCompleteError.getCode(),
                    "provided JSON data has no key: sheet"
            ).build();
        }
        if (!json.has("content")) {
            return response.fail(
                    Response.Status.BAD_REQUEST,
                    APIError.DataNotCompleteError.getCode(),
                    "provided JSON data has no key: content"
            ).build();
        }

        AuthUtil.Auth auth = util.getAuth();
        EntityManager em = JPAUtil.createEntityManager();

        // how many sheet exists in database currently?
        int seqAll;
        try {
            seqAll = getTotalSheetsCount(em, auth.getAccount().getAid());
        } catch (APIException e) {
            em.close();
            return e.getErrorResponse().build();
        }

        DashboardEntity sheet = new DashboardEntity();
        sheet.setAid(auth.getAccount().getAid());
        sheet.setSheet(json.getString("sheet"));
        sheet.setContent(json.get("content").toString());
        sheet.setSequence(seqAll + 1);
        sheet.setCreatets(new Timestamp(System.currentTimeMillis()));

        em.getTransaction().begin();
        try {
            em.persist(sheet);
            em.getTransaction().commit();
        } catch (Exception e) {
            e.printStackTrace();
            em.getTransaction().rollback();
            return response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.DatabaseOperationError.getCode()
            ).build();
        } finally {
            em.close();
        }

        Response.ResponseBuilder builder = response
                .success(Response.Status.CREATED, makeSheetJSON(sheet));
        checkAuthToken(builder, auth, sc.isSecure());
        return builder.build();
    }

    @PUT
    @Path("/sheet/{did}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updateSheet(@Context HttpHeaders headers,
                                @Context SecurityContext sc,
                                @PathParam("did") long did,
                                String sheetData) {
        AuthUtil util;
        try {
            util = new AuthUtil(headers, false, sc.isSecure());
        } catch (APIException e) {
            return e.getErrorResponse().build();
        }

        JSONObject json = new JSONObject(sheetData);
        if (!json.has("sequence")) {
            return response.fail(
                    Response.Status.BAD_REQUEST,
                    APIError.DataNotCompleteError.getCode(),
                    "provided JSON data has no key: sequence"
            ).build();
        }

        AuthUtil.Auth auth = util.getAuth();
        int seqNew = json.getInt("sequence");
        EntityManager em = JPAUtil.createEntityManager();

        int seqAll;
        try {
            seqAll = getTotalSheetsCount(em, auth.getAccount().getAid());
        } catch (APIException e) {
            em.close();
            return e.getErrorResponse().build();
        }

        if (seqNew <= 0 || seqNew > seqAll) {
            em.close();
            return response.fail(
                    Response.Status.BAD_REQUEST,
                    APIError.SequenceOutOfBoundError.getCode(),
                    "given sequence value out of bound: " + seqNew
            ).build();
        }

        int seqMin = seqNew;
        int seqMax = seqNew;
        DashboardEntity sheet;

        try {
            sheet = em.find(DashboardEntity.class, did);
        } catch (Exception e) {
            em.close();
            e.printStackTrace();
            return response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.DatabaseOperationError.getCode()
            ).build();
        }

        if (null == sheet) {
            em.close();
            return response.fail(
                    Response.Status.NOT_FOUND,
                    APIError.SheetNotFoundError.getCode(),
                    "no such sheet exists based on PREFIX: " + did
            ).build();
        }

        int seqOld = sheet.getSequence();
        if (seqOld > seqMax) {
            seqMax = seqOld;
        } else if (seqOld < seqMin) {
            seqMax = seqOld;
        }

        sheet.setSequence(seqNew);
        if (json.has("sheet")) {
            sheet.setSheet(json.getString("sheet"));
        }
        if (json.has("content")) {
            sheet.setContent(json.get("content").toString());
        }

        em.getTransaction().begin();
        try {
            em.merge(sheet);

            // sequence adjustment
            if (seqOld != seqNew) {
                String delta = (seqOld > seqNew) ? "+1" : "-1";
                String query = "UPDATE DashboardEntity" +
                        "   SET sequence=sequence%s" +
                        " WHERE aid=:aid AND did!=:did" +
                        "   AND sequence>=:seqMin" +
                        "   AND sequence<=:seqMax";
                em.createQuery(String.format(query, delta))
                        .setParameter("aid", auth.getAccount().getAid())
                        .setParameter("did", did)
                        .setParameter("seqMin", seqMin)
                        .setParameter("seqMax", seqMax)
                        .executeUpdate();
            }
            em.getTransaction().commit();
        } catch (Exception e) {
            e.printStackTrace();
            em.getTransaction().rollback();
            return response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.DatabaseOperationError.getCode()
            ).build();
        } finally {
            em.close();
        }

        Response.ResponseBuilder builder = response.success("sheet updated");
        checkAuthToken(builder, auth, sc.isSecure());
        return builder.build();
    }

    @DELETE
    @Path("/sheet/{did}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteSheet(@Context HttpHeaders headers,
                                @Context SecurityContext sc,
                                @PathParam("did") long did) {
        AuthUtil util;
        try {
            util = new AuthUtil(headers, false, sc.isSecure());
        } catch (APIException e) {
            return e.getErrorResponse().build();
        }

        AuthUtil.Auth auth = util.getAuth();
        EntityManager em = JPAUtil.createEntityManager();
        String sql = "SELECT e FROM DashboardEntity e" +
                " WHERE e.aid=:aid ORDER BY e.sequence ASC";

        List<DashboardEntity> sheets;
        try {
            sheets = em
                    .createQuery(sql, DashboardEntity.class)
                    .setParameter("aid", auth.getAccount().getAid())
                    .getResultList();
        } catch (Exception e) {
            em.close();
            e.printStackTrace();
            return response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.DatabaseOperationError.getCode()
            ).build();
        }

        em.getTransaction().begin();
        try {
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
        } catch (Exception e) {
            e.printStackTrace();
            em.getTransaction().rollback();
            return response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.DatabaseOperationError.getCode()
            ).build();
        } finally {
            em.close();
        }

        Response.ResponseBuilder builder = response.success("sheet deleted");
        checkAuthToken(builder, auth, sc.isSecure());
        return builder.build();
    }

    private void checkAuthToken(Response.ResponseBuilder builder,
                                final AuthUtil.Auth auth,
                                final boolean isSecure) {
        if (auth.isTokenRefreshed() && null != auth.getCookieName()) {
            builder.cookie(new NewCookie(
                    auth.getCookieName(), auth.getToken(),
                    "/", DOMAIN, null, -1, isSecure, true
            ));
        }
    }

    private int getTotalSheetsCount(final EntityManager em, final long aid)
            throws APIException {
        String sql = "SELECT COUNT(e) FROM DashboardEntity e WHERE aid=:aid";
        try {
            String count = em.createQuery(sql)
                    .setParameter("aid", aid)
                    .getSingleResult()
                    .toString();
            return Integer.parseInt(count);
        } catch (Exception e) {
            e.printStackTrace();
            throw new APIException(response.fail(
                    Response.Status.INTERNAL_SERVER_ERROR,
                    APIError.DatabaseOperationError.getCode()
            ));
        }
    }
}
