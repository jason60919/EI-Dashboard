package com.advantech.eipaas.dashboard.utils;


import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.Option;
import com.jayway.jsonpath.Configuration;


public class PCFUtil {
    private static Object vcapServices = null;

    public static <T> T getEnvFromVcapServices(final String path) {
        if (null == vcapServices) {
            Configuration conf = Configuration.defaultConfiguration();
            conf.addOptions(Option.DEFAULT_PATH_LEAF_TO_NULL);
            conf.addOptions(Option.SUPPRESS_EXCEPTIONS);

            String json = System.getenv("VCAP_SERVICES");
            if (null == json || 0 == json.length()) {
                json = "{}";
            }

            vcapServices = conf.jsonProvider().parse(json);
        }
        return JsonPath.read(vcapServices, path);
    }
}
