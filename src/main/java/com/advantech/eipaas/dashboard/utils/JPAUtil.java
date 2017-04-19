package com.advantech.eipaas.dashboard.utils;


import java.util.Map;
import java.util.HashMap;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;

import org.json.JSONObject;
import org.json.JSONArray;


@WebListener
public class JPAUtil implements ServletContextListener {
    private static EntityManagerFactory emf;

    @Override
    public void contextInitialized(ServletContextEvent event) {
        // Acquire environment variables from PCF
        Map<String, Object> properties = getPropertiesFromPivotalEnv();
        if (properties.isEmpty()) {
            emf = Persistence.createEntityManagerFactory("DashboardPU");
        }
        else {
            emf = Persistence.createEntityManagerFactory("DashboardPU", properties);
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent event) {
        if (null != emf) {
            emf.close();
        }
    }

    public static EntityManager createEntityManager() {
        if (emf == null) {
            throw new IllegalStateException("Context is not initialized yet.");
        }
        return emf.createEntityManager();
    }

    private Map<String, Object> getPropertiesFromPivotalEnv() {
        Map<String, Object> env = new HashMap<>();

        String VCAP_SERVICES = System.getenv("VCAP_SERVICES");
        if (VCAP_SERVICES.length() > 0) {
            JSONObject vcap_services = new JSONObject(VCAP_SERVICES);
            if (vcap_services.has("user-provided")) {
                JSONArray jsons = vcap_services.getJSONArray("user-provided");
                for (int i = 0; i < jsons.length(); i++) {
                    JSONObject json = jsons.getJSONObject(i);
                    if (!json.has("name") || !json.has("credentials"))
                        continue;

                    String name = json.getString("name");
                    if (name.equals("PSQL-Dashboard")) {
                        JSONObject credentials = json.getJSONObject("credentials");
                        if (credentials.has("url")) {
                            env.put("hibernate.connection.url", credentials.getString("url"));
                        }
                        if (credentials.has("username")) {
                            env.put("hibernate.connection.username", credentials.getString("username"));
                        }
                        if (credentials.has("password")) {
                            env.put("hibernate.connection.password", credentials.getString("password"));
                        }
                        break;
                    }
                }
            }
        }

        return env;
    }
}
