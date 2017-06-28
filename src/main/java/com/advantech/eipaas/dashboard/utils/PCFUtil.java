package com.advantech.eipaas.dashboard.utils;


import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.Option;
import com.jayway.jsonpath.Configuration;
import com.jayway.jsonpath.DocumentContext;


public class PCFUtil {
    private static DocumentContext vcapServices = null;

    public static <T> T getEnvFromVcapServices(final String path) {
        if (null == vcapServices) {
            Configuration conf = Configuration.defaultConfiguration()
                    .addOptions(Option.DEFAULT_PATH_LEAF_TO_NULL)
                    .addOptions(Option.SUPPRESS_EXCEPTIONS);

            String json = System.getenv("VCAP_SERVICES");
            if (null == json || 0 == json.length()) {
                json = "{}";
            }

            vcapServices = JsonPath.using(conf).parse(json);
        }
        return vcapServices.read(path);
    }
}
