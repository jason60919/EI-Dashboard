package com.advantech.eipaas.dashboard.utils;


import java.util.Map;
import java.util.HashMap;
import java.util.function.Function;
import java.io.IOException;
import java.io.InputStream;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.w3c.dom.Document;
import org.xml.sax.SAXException;


@WebListener
public class DBMigrateUtil implements ServletContextListener {
    private static final String SCHEMA = "dashboard";
    private static final String GROUP = "g_dashboard";

    private static Map<String, String> placeholders = new HashMap<>();
    static {
        placeholders.put("SCHEMA", SCHEMA);
        placeholders.put("GROUP", GROUP);
    }

    private String url;
    private String username;
    private String password;

    @Override
    public void contextInitialized(ServletContextEvent event) {
        org.flywaydb.core.Flyway flyway = new org.flywaydb.core.Flyway();

        // Flyway itself behaviors
        flyway.setCleanDisabled(true);
        flyway.setBaselineOnMigrate(true);
        flyway.setPlaceholders(placeholders);

        // Flyway database parameter
        getConnectionParameters(event.getServletContext());
        flyway.setDataSource(url, username, password);
        flyway.setSchemas(SCHEMA);

        // Migrating now
        flyway.migrate();
    }

    @Override
    public void contextDestroyed(ServletContextEvent event) {
    }

    private void getConnectionParameters(ServletContext context) {
        url = PCFUtil.getDatabaseURL();
        username = PCFUtil.getDatabaseUsername();
        password = PCFUtil.getDatabasePassword();

        if ("".equals(url) || "".equals(username) || "".equals(password)) {
            try {
                InputStream is = this.getClass().getResourceAsStream(
                        "/META-INF/persistence.xml"
                );
                getConnectionParametersFromPersistenceXML(is);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void getConnectionParametersFromPersistenceXML(InputStream is)
            throws ParserConfigurationException, SAXException,
            IOException, XPathExpressionException {
        String path = "/persistence/persistence-unit[@name='DashboardPU']"
                + "/properties/property[@name='%s']/@value";
        Document doc = DocumentBuilderFactory.newInstance()
                .newDocumentBuilder()
                .parse(is);

        XPath xpath = XPathFactory.newInstance().newXPath();
        Function<String, String> makePath = k -> String.format(path, k);

        if ("".equals(url)) {
            url = xpath
                    .compile(makePath.apply("javax.persistence.jdbc.url"))
                    .evaluate(doc, XPathConstants.STRING)
                    .toString();
        }
        if ("".equals(username)) {
            username = xpath
                    .compile(makePath.apply("javax.persistence.jdbc.user"))
                    .evaluate(doc, XPathConstants.STRING)
                    .toString();
        }
        if ("".equals(password)) {
            password = xpath
                    .compile(makePath.apply("javax.persistence.jdbc.password"))
                    .evaluate(doc, XPathConstants.STRING)
                    .toString();
        }
    }
}
