EI-Dashboard uses [Gradle](https://gradle.org/) as its build tool. There are, currently, 2 major tasks you can execute. To make a WAR target, you can easily run:

```sh
$ ./gradlew assemble
```

After that, a new directory named `build` shoule be populated by [Gradle](https://gradle.org/) automatically and you can find the WAR file under `build/libs`.

If what you want is just only to run a test server, simply run:

```sh
$ ./gradlew tomcatRun
```

A tomcat server for testing will be running by [Gradle](https://gradle.org/) automatically.