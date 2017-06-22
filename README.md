# Preparing The Database
EI-Dashboard keeps all its metadata in PostgreSQL database.
If you want to persist the data, you should prepare an such environment.
Simply execute following steps in order.

  1. Install [PostgreSQL](https://www.postgresql.org/) database.

     We use PostgreSQL version 9.6 throughout development process and it's
     the recommended version to be installed and used for your own copy.
     New vresion should be okay but not guarantee. After it's installed,
     remember configuring it with proper settings. Once everything's okay,
     put `psql` to your PATH and change your working directory to EI-Dashboard.

  2. Create an user named `dashboard`.
  
     ```sh
     $ psql -f scripts/sql/1.create-user.sql -U postgres -h <host>
     ```
     
  3. Create a schema named `dashboard` under existed database `wisepaas`:

     ```sh
     $ psql -f scripts/sql/2.create-schema.sql -U postgres -h <host> -d wisepaas
     ```

  4. Create tables under the `dashboard` schema created in step 2:

     ```sh
     $ psql -f scripts/sql/3.create-tables.sql -U dashboard -h <host> -d wisepaas
     ```

Now, the database stuff should be ready for EI-Dashboard.


# Build, Test, and Deployment
EI-Dashboard uses [Gradle](https://gradle.org/) as its build tool. This section
describes available Gradle tasks inside EI-Dashboard and their goal. Also note,
it assumes that the working directory is EI-Dashboard installation directory.

  * Making a WAR target

     ```sh
     $ ./gradlew war
     ```
     
    This task generates EI-Dashboard WAR file for web container deployment.
    You can also use `./gradlew assemble` or `./gradlew bulid` to achieve
    your goal. 
    
    By running the task, a new directory named `build` shoule be populated by
    Gradle automatically and you can find the WAR file under `build/libs`.

  * Running a test server

    ```sh
    $ ./gradlew tomcatRun
    ```
    
    This task runs a test server for you. A Tomcat server for testing will be
    running by Gradle automatically. If the connection to PostgreSQL can't be
    established, providing your own connection url in
    `src/main/resources/META-INF/persistence.xml`.
    
  * Deploying onto PCF

    ```sh
    $ ./gradlew pushToCPF [-Dpcf_space=<spaceName>]
    ```
    
    This task pushes and deployes the WAR file onto PCF by our naming rules for
    EI-Dashboard. If you don't provide *-Dpcf_sapce=&lt;spaceName&gt;* argument,
    it, by default, pushs and deploys EI-Dashboard into `develop` space. Uses
    *-Dpcf_space=&lt;production&gt;* argument for `production` space,
    *-Dpcf_space=&lt;stage&gt;* for `staging` space. 
    
    **NOTE:**
    To push application onto PCF, the cf command line interface is required.
    Please go to Pivotal [Documentation](https://docs.pivotal.io/pivotalcf/1-10/cf-cli/install-go-cli.html)
    and follow the instrcution to download and install it.
    

  * Gererate manifest.yml for PCF

    ```sh
    $ ./gradlew makeManifest
    ```
    
    This task generates 3 official manifest.yml files for PCF pushing.
    They are `manifest-production.yml`, `manifest-stage.yml`, and
    `manifest-develop.yml`, and pupulated under build/libs directory.
    Normally, only QA need to issue this task.
    

# Changes
Please refer to [change logs](CHANGELOG.md).
