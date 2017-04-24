package com.advantech.eipaas.dashboard.api;


import java.util.HashMap;
import java.util.Map;


public enum APIError {
    ServerError(
        1000, "E_SERVER_INTERNAL",
        "server encountered internal problem"
    ),
    AuthError(
        1001, "E_AUTH",
        "authentication/authorization error"
    ),
    AccountNotEnabledError(
        1002, "E_ACCOUNT_NOT_ENABLED",
        "given account not enabled in this system"
    ),
    DataNotCompleteError(
        1003, "E_DATA_NOT_COMPLETE",
        "given data missing specific attribute(s)"
    ),
    DatabaseOperationError(
        1004, "E_DATABASE_OPERATION",
        "server encountered problem during database operation"
    ),
    SheetNotFoundError(
        1005, "E_SHEET_NOT_FOUND",
        "given sheet can't be found in database"
    ),
    SequenceOutOfBoundError(
        1006, "E_Sequence_OUT_OF_BOUND",
        "given sequence value is out of bound"
    ),
    AuthNotProvidedError(
        1007, "E_AUTH_NOT_PROVIDED",
        "authentication/authorization data not provided in header"
    ),
    AuthNotSupportedError(
        1008, "E_AUTH_NOT_SUPPORTED",
        "authentication/authorization type not supported in header"
    ),
    AuthDataError(
        1009, "E_AUTH_DATA",
        "authentication/authorization data provided in header error"
    );

    private int code;
    private String name;
    private String description;
    private static Map<Integer, APIError> mapping;

    APIError(int code, String name, String description) {
        this.code = code;
        this.name = name;
        this.description = description;
    }

    public static APIError getErrorInstance(int i) {
        if (null == mapping) {
            initMapping();
        }
        APIError e = mapping.get(i);
        return null == e ? APIError.ServerError : e;
    }

    private static void initMapping() {
        mapping = new HashMap<>();
        for (APIError e : values()) {
            mapping.put(e.code, e);
        }
    }

    public int getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public String toString() {
        return code + ":" + name + ":" + description;
    }
}

