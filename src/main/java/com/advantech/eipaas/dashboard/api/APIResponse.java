package com.advantech.eipaas.dashboard.api;


import java.util.Map;
import java.util.HashMap;
import javax.ws.rs.core.Response;

import org.json.JSONObject;


public class APIResponse {
    private Response makeResponse(Response.Status status, Object result) {
        JSONObject json = new JSONObject();
        json.put("success", javax.ws.rs.core.Response.Status.OK == status);
        json.put("result", null == result ? "Unknown" : result);
        return Response.status(status).entity(json.toString()).build();
    }

    public Response success(Object data) {
        return makeResponse(Response.Status.OK, data);
    }

    public Response success(Response.Status status, Object data) {
        return makeResponse(status, data);
    }

    public Response fail(Response.Status status, int errCode, String detail) {
        APIError e = APIError.getErrorInstance(errCode);

        Map<String, Object> result = new HashMap<>();
        result.put("code", e.getCode());
        result.put("name", e.getName());
        result.put("description", e.getDescription());
        if (null != detail && !detail.isEmpty()) {
            result.put("detail", detail);
        }

        return makeResponse(status, result);
    }

    public Response fail(Response.Status status, int errorCode) {
        return fail(status, errorCode, null);
    }
}
