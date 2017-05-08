# Preparing The Database
EI-Dashboard keeps all its metadata in PostgreSQL database.
If you want to persist the data, you should prepare an such environment.
Simply execute following steps in order.

  1. To create an user named dashboard:
  
     ```sh
     $ psql -f scripts/sql/1.create-user.sql -U postgres -h <host>
     ```
     
  2. To create a schema named `dashboard` under existed database `wisepaas`:

     ```sh
     $ psql -f scripts/sql/2.create-schema.sql -U postgres -h <host> -d wisepaas
     ```

  3. To create tables under the `dashboard` schema created in step 2:

     ```sh
     $ psql -f scripts/sql/3.create-tables.sql -U dashboard -h <host> -d wisepaas
     ```

Now, the database stuff should be ready for EI-Dashboard.


# Build And Test
EI-Dashboard uses [Gradle](https://gradle.org/) as its build tool. There are,
currently, 2 major tasks you can execute. To make a WAR target, you can easily
run:

```sh
$ ./gradlew assemble
```

After that, a new directory named `build` shoule be populated by
[Gradle](https://gradle.org/) automatically and you can find the WAR file
under `build/libs`.

If what you want is just only to run a test server, simply run:

```sh
$ ./gradlew tomcatRun
```

A tomcat server for testing will be running by [Gradle](https://gradle.org/)
automatically.
