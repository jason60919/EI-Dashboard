package com.advantech.eipaas.dashboard.api;


import java.util.Map;
import java.util.HashMap;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.ResponseBuilder;

import org.json.JSONObject;


public class APIResponse {
    private ResponseBuilder makeResponse(final Response.Status status,
                                         final boolean success,
                                         final Object result) {
        JSONObject json = new JSONObject();
        json.put("success", success);
        json.put("result", null == result ? "Unknown" : result);
        return Response.status(status).entity(json.toString());
    }

    public ResponseBuilder success(Object data) {
        return makeResponse(Response.Status.OK, true, data);
    }

    public ResponseBuilder success(Response.Status status, Object data) {
        return makeResponse(status, true, data);
    }

    public ResponseBuilder fail(Response.Status status,
                                int errCode,
                                String detail) {
        APIError e = APIError.getErrorInstance(errCode);

        Map<String, Object> result = new HashMap<>();
        result.put("code", e.getCode());
        result.put("name", e.getName());
        result.put("description", e.getDescription());
        if (null != detail && !detail.isEmpty()) {
            result.put("detail", detail);
        }

        return makeResponse(status, false, result);
    }

    public ResponseBuilder fail(Response.Status status, int errorCode) {
        return fail(status, errorCode, null);
    }
}
