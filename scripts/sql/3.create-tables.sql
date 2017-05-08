CREATE TABLE IF NOT EXISTS dashboard.account (
    aid        BIGSERIAL                    NOT NULL,
    name       CHARACTER VARYING            NOT NULL,
    fullname   CHARACTER VARYING                NULL,
    firstname  CHARACTER VARYING                NULL,
    lastname   CHARACTER VARYING                NULL,
    mail       CHARACTER VARYING            NOT NULL,
    password   CHARACTER VARYING            NOT NULL,
    enabled    BOOLEAN                      NOT NULL,
    logints    TIMESTAMP WITHOUT TIME ZONE      NULL,
    createts   TIMESTAMP WITHOUT TIME ZONE  NOT NULL,

    CONSTRAINT "PK_ACCOUNT_AID"  PRIMARY KEY (aid),
    CONSTRAINT "UK_ACCOUNT_MAIL" UNIQUE (mail),
    CONSTRAINT "UK_ACCOUNT_NAME" UNIQUE (name)
);


CREATE TABLE dashboard.dashboard (
    did       BIGSERIAL                    NOT NULL,
    aid       BIGINT                       NOT NULL,
    sheet     CHARACTER VARYING            NOT NULL,
    content   CHARACTER VARYING            NOT NULL,
    sequence  INTEGER                      NOT NULL,
    createts  TIMESTAMP WITHOUT TIME ZONE  NOT NULL,

    CONSTRAINT "PK_DASHBOARD_DID" PRIMARY KEY (did)
);


ALTER TABLE dashboard.account OWNER to dashboard;
ALTER TABLE dashboard.dashboard OWNER to dashboard;
