<%@ page contentType="text/json; charset=utf-8"%>
<%@ page language="java"%>
<%@ page import="java.util.*,java.io.*,org.json.*" %>
<%@ page import="nodered.*" %>
<%

    StringBuffer json = new StringBuffer();
    String line = null;
    try {
        BufferedReader reader = request.getReader();
        while ((line = reader.readLine()) != null) {
            json.append(line);
        }
    } catch (Exception e) {
        e.printStackTrace();
    }
    System.out.println("client json data=" + json);

    Flows flowsAPI = new Flows("http://localhost:1880/");
    
     
    response.setHeader("Pragma","no-cache"); 
    response.setHeader("Cache-Control","no-cache"); 
    //prevents caching at the proxy server
    response.setDateHeader("Expires", 0); 
    response.setContentType("application/json");
    response.getWriter().write( flowsAPI.set(json.toString()));

%>