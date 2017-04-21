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
import javax.ws.rs.HeaderParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.persistence.EntityManager;

import org.json.JSONObject;

import com.advantech.eipaas.dashboard.entities.AccountEntity;
import com.advantech.eipaas.dashboard.entities.DashboardEntity;
import com.advantech.eipaas.dashboard.utils.JPAUtil;
import com.advantech.eipaas.dashboard.utils.AuthUtil;


@Path("/api")
public class APIResource {
    private final AuthUtil authUtil = new AuthUtil();
    private final APIResponse response = new APIResponse();

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
    public Response login(@HeaderParam("Authorization") String authorization) {
        AccountEntity account;
        try {
            account = authUtil.decodeAccount(authorization);
        }
        catch (APIException e) {
            return e.getErrorResponse();
        }

        EntityManager em = JPAUtil.createEntityManager();
        account.setLogints(new Timestamp(System.currentTimeMillis()));
        try {
            em.getTransaction().begin();
            em.getTransaction().commit();
            em.detach(account);
        }
        catch (Exception e) {
            em.getTransaction().rollback();
            e.printStackTrace();
        }
        finally {
            em.close();
        }

        return response.success("user logged in");
    }

    @GET
    @Path("/sheet")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSheets(@HeaderParam("Authorization") String authorization) {
        AccountEntity account;
        try {
            account = authUtil.decodeAccount(authorization);
        }
        catch (APIException e) {
            return e.getErrorResponse();
        }

        EntityManager em = JPAUtil.createEntityManager();
        try {
            List<DashboardEntity> sheets = em
                .createQuery("SELECT e FROM DashboardEntity e" +
                             " WHERE e.aid=:aid" +
                             " ORDER BY e.sequence ASC",
                             DashboardEntity.class)
                .setParameter("aid", account.getAid())
                .getResultList();

            List<Map<String, Object>> content = new ArrayList<>();
            for (DashboardEntity e : sheets) {
                content.add(makeSheetJSON(e));
            }
            return response.success(content);
        }
        catch (Exception e) {
            e.printStackTrace();
            return response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            );
        }
        finally {
            em.close();
        }
    }

    @POST
    @Path("/sheet")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response createSheet(@HeaderParam("Authorization") String authorization, String sheetData) {
        AccountEntity account;
        try {
            account = authUtil.decodeAccount(authorization);
        }
        catch (APIException e) {
            return e.getErrorResponse();
        }

        JSONObject json = new JSONObject(sheetData);
        if (!json.has("sheet")) {
            return response.fail(
                Response.Status.BAD_REQUEST,
                APIError.DataNotCompleteError.getCode(),
                "provided JSON data has no key: sheet"
            );
        }
        if (!json.has("content")) {
            return response.fail(
                Response.Status.BAD_REQUEST,
                APIError.DataNotCompleteError.getCode(),
                "provided JSON data has no key: content"
            );
        }

        // how many sheet exists in database currently?
        int seqAll;

        EntityManager em = JPAUtil.createEntityManager();
        try {
            seqAll = Integer.parseInt(
                em.createQuery(
                    "SELECT COUNT(e)  FROM DashboardEntity e WHERE aid=:aid"
                ).setParameter("aid", account.getAid()
                ).getSingleResult().toString()
            );
        }
        catch (Exception e) {
            em.close();
            e.printStackTrace();
            return response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            );
        }

        DashboardEntity sheet = new DashboardEntity();
        sheet.setAid(account.getAid());
        sheet.setSheet(json.getString("sheet"));
        sheet.setContent(json.get("content").toString());
        sheet.setSequence(seqAll + 1);
        sheet.setCreatets(new Timestamp(System.currentTimeMillis()));

        em.getTransaction().begin();
        try {
            em.persist(sheet);
            em.getTransaction().commit();
            return response.success(
                Response.Status.CREATED, makeSheetJSON(sheet)
            );
        }
        catch (Exception e) {
            e.printStackTrace();
            em.getTransaction().rollback();
            return response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            );
        }
        finally {
            em.close();
        }
    }

    @PUT
    @Path("/sheet/{did}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updateSheet(@HeaderParam("Authorization") String authorization, @PathParam("did") long did, String sheetData) {
        AccountEntity account;
        try {
            account = authUtil.decodeAccount(authorization);
        }
        catch (APIException e) {
            return e.getErrorResponse();
        }

        JSONObject json = new JSONObject(sheetData);
        if (!json.has("sequence")) {
            return response.fail(
                Response.Status.BAD_REQUEST,
                APIError.DataNotCompleteError.getCode(),
                "provided JSON data has no key: sequence"
            );
        }

        int seqAll, seqNew = json.getInt("sequence");
        EntityManager em = JPAUtil.createEntityManager();
        try {
            seqAll = Integer.parseInt(
                em.createQuery(
                    "SELECT COUNT(e) FROM DashboardEntity e WHERE aid=:aid"
                ).setParameter("aid", account.getAid()
                ).getSingleResult().toString()
            );
        }
        catch (Exception e) {
            em.close();
            e.printStackTrace();
            return response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            );
        }

        if (seqNew <= 0 || seqNew > seqAll) {
            em.close();
            return response.fail(
                Response.Status.BAD_REQUEST,
                APIError.SequenceOutOfBoundError.getCode(),
                "given sequence value out of bound: " + seqNew
            );
        }

        int seqMin = seqNew;
        int seqMax = seqNew;
        DashboardEntity sheet;

        try {
            sheet = em.find(DashboardEntity.class, did);
        }
        catch (Exception e) {
            em.close();
            e.printStackTrace();
            return response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            );
        }

        if (null == sheet) {
            em.close();
            return response.fail(
                Response.Status.NOT_FOUND,
                APIError.SheetNotFoundError.getCode(),
                "no such sheet exists based on PREFIX: " + did
            );
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
                    .setParameter("aid", account.getAid())
                    .setParameter("did", did)
                    .setParameter("seqMin", seqMin)
                    .setParameter("seqMax", seqMax)
                    .executeUpdate();
            }
            em.getTransaction().commit();
            return response.success("sheet updated");
        }
        catch (Exception e) {
            e.printStackTrace();
            em.getTransaction().rollback();
            return response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            );
        }
        finally {
            em.close();
        }
    }

    @DELETE
    @Path("/sheet/{did}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response deleteSheet(@HeaderParam("Authorization") String authorization, @PathParam("did") long did) {
        AccountEntity account;
        try {
            account = authUtil.decodeAccount(authorization);
        }
        catch (APIException e) {
            return e.getErrorResponse();
        }

        List<DashboardEntity> sheets;
        EntityManager em = JPAUtil.createEntityManager();
        try {
            sheets = em
                .createQuery("SELECT e FROM DashboardEntity e" +
                             " WHERE e.aid=:aid" +
                             " ORDER BY e.sequence ASC",
                             DashboardEntity.class)
                .setParameter("aid", account.getAid())
                .getResultList();
        }
        catch (Exception e) {
            em.close();
            e.printStackTrace();
            return response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            );
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
            return response.success("sheet deleted");
        }
        catch (Exception e) {
            e.printStackTrace();
            em.getTransaction().rollback();
            return response.fail(
                Response.Status.INTERNAL_SERVER_ERROR,
                APIError.DatabaseOperationError.getCode()
            );
        }
        finally {
            em.close();
        }
    }
}
