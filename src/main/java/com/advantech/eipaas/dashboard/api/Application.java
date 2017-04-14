package com.advantech.eipaas.dashboard.api;


import javax.ws.rs.ApplicationPath;
import java.util.HashSet;
import java.util.Set;


@ApplicationPath("/dashboard")
public class Application extends javax.ws.rs.core.Application {
    @Override
    public Set<Class<?>> getClasses() {
        HashSet hash = new HashSet<Class<?>>();
        hash.add(API.class);
        return hash;
    }
}
