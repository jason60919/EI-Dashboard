package com.advantech.eipaas.dashboard.utils;


import java.util.Map;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;


@WebListener
public class JPAUtil implements ServletContextListener {
    private static EntityManagerFactory emf;

    @Override
    public void contextInitialized(ServletContextEvent event) {
        // Acquire environment variables from PCF
        List<Map<String, Object>> properties = PCFUtil.getEnvFromVcapServices(
                "$.user-provided[?(@.name=='PSQL-Dashboard')].credentials"
        );
        if (0 == properties.size()) {
            emf = Persistence.createEntityManagerFactory("DashboardPU");
        } else {
            emf = Persistence.createEntityManagerFactory(
                    "DashboardPU", properties.get(0)
            );
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent event) {
        if (null != emf) {
            emf.close();
        }
    }

    public static EntityManager createEntityManager() {
        if (null == emf) {
            throw new IllegalStateException("Context is not initialized yet.");
        }
        return emf.createEntityManager();
    }
}
