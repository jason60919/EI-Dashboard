package com.advantech.eipaas.dashboard.api;


import java.util.List;
import java.util.Map;
import java.util.HashMap;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.ResponseBuilder;

import org.json.JSONObject;


public class APIResponse {
    private ResponseBuilder makeResponse(final Response.Status status,
                                         final Map<String, Object> result) {
        ResponseBuilder builder = Response.status(status);
        if (null != result) {
            JSONObject json = new JSONObject(result);
            builder.entity(json.toString());
        }
        return builder;
    }

    public ResponseBuilder success() {
        return makeResponse(Response.Status.OK, null);
    }

    public ResponseBuilder success(final Response.Status status) {
        return makeResponse(status, null);
    }

    public ResponseBuilder success(final Response.Status status,
                                   final Map<String, Object> data) {
        return makeResponse(status, data);
    }

    public ResponseBuilder success(final Response.Status status,
                                   final List<Map<String, Object>> data) {
        Map<String, Object> result = new HashMap<>();
        result.put("totalSize", data.size());
        result.put("data", data);
        return makeResponse(status, result);
    }

    public ResponseBuilder success(final Map<String, Object> data) {
        return makeResponse(Response.Status.OK, data);
    }

    public ResponseBuilder success(final List<Map<String, Object>> data) {
        return success(Response.Status.OK, data);
    }

    public ResponseBuilder fail(final Response.Status status,
                                final int errCode,
                                final String detail) {
        APIError e = APIError.getErrorInstance(errCode);

        Map<String, Object> result = new HashMap<>();
        result.put("ErrorCode", e.getCode());
        result.put("ErrorName", e.getName());
        result.put("ErrorDescription", e.getDescription());
        if (null != detail && !detail.isEmpty()) {
            result.put("ErrorDetail", detail);
        }

        return makeResponse(status, result);
    }

    public ResponseBuilder fail(final Response.Status status,
                                final int errorCode) {
        return fail(status, errorCode, null);
    }
}
