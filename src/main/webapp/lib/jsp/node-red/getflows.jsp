<%@ page language="java"%>
<%@ page import="nodered.*" %>
<%
    String respJSON;
    try {
        //Flows flowsAPI = new Flows("http://localhost:1880/node-red/");
        Flows flowsAPI = new Flows("http://localhost:1880/");
        //String strURL = request.getParameter("url");
        //Flows flowsAPI = new Flows(strURL);
        respJSON = flowsAPI.get();
        response.setContentType("application/json");

    } catch (Exception ex) {
        respJSON = ex.getMessage();
        response.setContentType("text/html");
    }

    response.setHeader("Pragma", "no-cache");
    response.setHeader("Cache-Control", "no-cache");
    //prevents caching at the proxy server
    response.setDateHeader("Expires", 0);

    response.getWriter().write(respJSON);

%>