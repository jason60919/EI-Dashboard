package com.advantech.eipaas.dashboard.utils;


import java.util.Map;
import java.util.HashMap;

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
        String url = PCFUtil.getDatabaseURL();
        String username = PCFUtil.getDatabaseUsername();
        String password = PCFUtil.getDatabasePassword();

        Map<String, Object> env = new HashMap<>();
        if (! "".equals(url)) {
            env.put("javax.persistence.jdbc.url", url);
        }
        if (! "".equals(username)) {
            env.put("javax.persistence.jdbc.user", username);
        }
        if (! "".equals(password)) {
            env.put("javax.persistence.jdbc.password", password);
        }

        emf = Persistence.createEntityManagerFactory("DashboardPU", env);
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
