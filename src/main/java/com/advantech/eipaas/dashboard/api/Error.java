package com.advantech.eipaas.dashboard.api;


import java.util.HashMap;
import java.util.Map;


public enum Error {
    ServerError(
        1000, "E_SERVER_INTERNAL",
        "server encountered internal problem"
    ),
    AuthorizationError(
        1001, "E_AUTH",
        "authorization failed"
    ),
    AccountNotEnabledError(
        1002, "E_ACCOUNT_NOT_ENABLED",
        "given account not enabled"
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
    );

    private int code;
    private String name;
    private String description;
    private static Map<Integer, Error> mapping;

    Error(int code, String name, String description) {
        this.code = code;
        this.name = name;
        this.description = description;
    }

    public static Error getErrorInstance(int i) {
        if (null == mapping) {
            initMapping();
        }
        Error e = mapping.get(i);
        return null == e ? Error.ServerError : e;
    }

    private static void initMapping() {
        mapping = new HashMap<>();
        for (Error e : values()) {
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

