package com.advantech.eipaas.dashboard.utils;


import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.Option;
import com.jayway.jsonpath.Configuration;
import com.jayway.jsonpath.DocumentContext;


public class PCFUtil {
    private static final Configuration CONF = Configuration
            .defaultConfiguration()
            .addOptions(Option.DEFAULT_PATH_LEAF_TO_NULL)
            .addOptions(Option.SUPPRESS_EXCEPTIONS);

    private static String spaceName = null;
    private static String domainName = null;
    private static String databaseURL = null;
    private static String databaseUsername = null;
    private static String databasePassword = null;

    private static DocumentContext vcapServices = null;
    private static DocumentContext vcapApplication = null;

    public static <T> T getEnvFromVcapServices(final String path) {
        if (null == vcapServices) {
            String json = System.getenv("VCAP_SERVICES");
            System.out.println(("VCAP_SERVICES: " + json));
            if (null == json || "".equals(json)) {
                System.err.println("No 'VCAP_SERVICES' acquired.");
                json = "{}";
            }
            vcapServices = JsonPath.using(CONF).parse(json);
        }
        return vcapServices.read(path);
    }

    public static <T> T getEnvFromVcapApplication(final String path) {
        if (null == vcapApplication) {
            String json = System.getenv("VCAP_APPLICATION");
            System.out.println(("VCAP_APPLICATION: " + json));
            if (null == json || "".equals(json)) {
                System.err.println("NO 'VCAP_APPLICATION' acquired.");
                json = "{}";
            }
            vcapApplication = JsonPath.using(CONF).parse(json);
        }
        return vcapApplication.read(path);
    }

    public static String getSpaceName() {
        if (null == spaceName) {
            String path = "$.space_name";
            String name = getEnvFromVcapApplication(path);
            if (null == name) {
                spaceName = "";
            } else {
                spaceName = name.toLowerCase();
                System.out.println(("Determined space name by PCF. " +
                        "JSONPath=[" + path + "], " +
                        "spaceName=[" + spaceName + "]"
                ));
            }
        }
        return spaceName;
    }

    public static String getSpaceSuffix() {
        if ("stage".equals(getSpaceName())) {
            return "-stage";
        } else if ("develop".equals(getSpaceName())) {
            return "-develop";
        } else {
            // return empty string even it's not inside production space
            return "";
        }
    }

    public static String getDomainName() {
        if (null == domainName) {
            String path = "$.application_uris[0]";
            String uri = getEnvFromVcapApplication(path);
            if (null == uri) {
                uri = "";
            }

            Pattern pattern = Pattern.compile("^[^.]+\\.(?<domain>.+)");
            Matcher matcher = pattern.matcher(uri.toLowerCase());
            if (matcher.find()) {
                domainName = matcher.group("domain");
                System.out.println(("Determined domain name by PCF. " +
                        "JSONPath=[" + path + "], " +
                        "domainName=[" + domainName + "]"
                ));
            } else {
                System.out.println("Cannot acquire URI from PCF environment.");
                System.out.println("System assumes this is local testing");
                domainName = "";
            }
        }
        return domainName;
    }

    public static String getDatabaseURL() {
        if (null == databaseURL) {
            getDatabaseParameters();
        }
        return databaseURL;
    }

    public static String getDatabaseUsername() {
        if (null == databaseUsername) {
            getDatabaseParameters();
        }
        return databaseUsername;
    }

    public static String getDatabasePassword() {
        if (null == databasePassword) {
            getDatabaseParameters();
        }
        return databasePassword;
    }

    private static void getDatabaseParameters() {
        String key = "postgresql" + getSpaceSuffix();
        String path = String.format(
                "$.%s[?(@.label=='%s')].credentials", key, key
        );
        System.out.println((
                "Getting database parameters using JSONPATH=[" + path
        ));
        List<Map<String, Object>> properties = getEnvFromVcapServices(path);

        if (0 == properties.size()) {
            databaseURL = "";
            databaseUsername = "";
            databasePassword = "";
        } else {
            Map<String, Object> property = properties.get(0);
            databaseUsername = property.get("username").toString();
            databasePassword = property.get("password").toString();
            databaseURL = String.format(
                    "jdbc:postgresql://%s:%s/%s",
                    property.get("host").toString(),
                    property.get("port").toString(),
                    property.get("database").toString()
            );
            System.out.println(("Determined database parameters by PCF. " +
                    "URL=[" + databaseURL + "], " +
                    "username=[" + databaseUsername + "], " +
                    "password=[" + databasePassword + "]"
            ));
        }
    }
}
