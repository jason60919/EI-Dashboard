package com.advantech.eipaas.dashboard.api;


public class APIException extends Exception {
    private javax.ws.rs.core.Response.ResponseBuilder errorResponse;

    public javax.ws.rs.core.Response.ResponseBuilder getErrorResponse() {
        return this.errorResponse;
    }

    public APIException(
            javax.ws.rs.core.Response.ResponseBuilder errorResponse) {
        super();
        this.errorResponse = errorResponse;
    }
}
