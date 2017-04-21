package com.advantech.eipaas.dashboard.api;


public class APIException extends Exception {
    private javax.ws.rs.core.Response errorResponse;

    public javax.ws.rs.core.Response getErrorResponse() {
        return this.errorResponse;
    }

    public APIException(javax.ws.rs.core.Response errorResponse) {
        super();
        this.errorResponse = errorResponse;
    }
}
