/******************************************************************************
 * This SQL script is prepared for Flyway automation, a Java based database
 * migration tool. All stuff here should be already exists in our database,
 * and should be ignored by Flyway. This is the reason why this file named
 * 'baseline'.
 ******************************************************************************
 */


-- Dashboard's schema should be created by Flyway, automatically!
-- If the target schema does not exist yet, Flyway will, of course,
-- create it for us via setSchema() action! As such, first of all here,
-- what we only need to do is assigning the proper owner to the schema.
ALTER SCHEMA ${SCHEMA} OWNER TO ${GROUP};


-- Create 'account' table
CREATE TABLE IF NOT EXISTS account (
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


-- Create 'dashboard' table
CREATE TABLE dashboard (
    did       BIGSERIAL                    NOT NULL,
    aid       BIGINT                       NOT NULL,
    sheet     CHARACTER VARYING            NOT NULL,
    content   CHARACTER VARYING            NOT NULL,
    sequence  INTEGER                      NOT NULL,
    createts  TIMESTAMP WITHOUT TIME ZONE  NOT NULL,

    CONSTRAINT "PK_DASHBOARD_DID" PRIMARY KEY (did)
);


-- Also, need to grant all privileges to the target owner.
GRANT ALL ON ALL TABLES IN SCHEMA ${SCHEMA} TO ${GROUP};
