package com.advantech.eipaas.dashboard.filters;


import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletResponse;


public class CSPFilter implements Filter {
    /*************************************************************************
     * HEADER
     ************************************************************************/
    public static final String CSP_HEADER
            = "Content-Security-Policy";

    public static final String CSP_REPORT_ONLY_HEADER
            = "Content-Security-Policy-Report-Only";

    /*************************************************************************
     * DIRECTIVE REFERENCE
     *
     * The Content-Security-Policy header value is made up of one or more
     * directives, multiple directives are separated with a semicolon (;)
     ************************************************************************/
    //
    // The following definitions introduced in CSP Level 1
    //
    // Instructs the browser to POST reports of policy failures to this URI.
    private static final String REPORT_ONLY = "report-only";
    public static final String REPORT_URI = "report-uri";

    // Default policy for loading content such as JavaScript, Images, CSS,
    // Font's, AJAX requests, Frames, HTML5 media.
    public static final String DEFAULT_SRC = "default-src";

    // Defines valid sources of JavaScript.
    public static final String SCRIPT_SRC = "script-src";

    // Defines valid sources of stylesheets.
    public static final String STYLE_SRC = "style-src";

    // Defines valid sources of images.
    public static final String IMG_SRC = "img-src";

    // Applies to XMLHttpRequest(AJAX), WebSocket or EventSource.
    // If not allowed the browser emulates a 400 HTTP status code.
    public static final String CONNECT_SRC = "connect-src";

    // Defines valid sources of fonts.
    public static final String FONT_SRC = "font-src";

    // Defines valid sources of plugins, eg <object>, <embed> or <applet>.
    public static final String OBJECT_SRC = "object-src";

    // Define valid sources of audio and video, eg HTML5 <audio>,
    // <video> elements.
    public static final String MEDIA_SRC = "media-src";

    // DEPRECATED.
    // Defines valid sources for loading frames.
    // child-src is preferred over this deprecated directive.
    public static final String FRAME_SRC = "frame-src";

    // Enables a sandbox for the requested resource similar to the iframe
    // sandbox attribute. The sandbox applies a same origin policy,
    // prevents popups, plugins and script execution is blocked.
    public static final String SANDBOX = "sandbox";

    //
    // The following definitions introduced in CSP Level 2
    //
    // Defines valid sources for web workers and nested browsing contexts
    // loaded using elements such as <frame> and <iframe>.
    public static final String CHILD_SRC = "child-src";

    // Defines valid sources that can be used as a HTML <form> action.
    public static final String FORM_ACTION = "form-action";

    // Defines valid sources for embedding the resource using <frame> <iframe>
    // <object> <embed> <applet>.
    public static final String FRAME_ANCESTORS = "frame-ancestors";

    // Defines valid MIME types for plugins invoked via <object> and <embed>.
    public static final String PLUGIN_TYPES = "plugin-types";

    /*************************************************************************
     * SOURCE LIST REFERENCE
     *
     * All of the directives that end with -src support similar values known
     * as a source list. Multiple source list values can be space separated
     * with the exception of 'none' which should be the only value.
     ************************************************************************/
    // Prevents loading resources from any source. Uses as our default.
    public static final String SRC_NONE = "'none'";

    private boolean reportOnly;
    private String reportUri;
    private String defaultSrc;
    private String scriptSrc;
    private String styleSrc;
    private String imgSrc;
    private String connectSrc;
    private String fontSrc;
    private String objectSrc;
    private String mediaSrc;
    private String frameSrc;
    private String sandbox;
    private String childSrc;
    private String formAction;
    private String frameAncestors;
    private String pluginTypes;

    public void init(FilterConfig filterConfig) {
        reportOnly = getBooleanValue(filterConfig, REPORT_ONLY);
        reportUri = getValue(filterConfig, REPORT_URI);
        defaultSrc = getValue(filterConfig, DEFAULT_SRC, SRC_NONE);
        scriptSrc = getValue(filterConfig, SCRIPT_SRC);
        styleSrc = getValue(filterConfig, STYLE_SRC);
        imgSrc = getValue(filterConfig, IMG_SRC);
        connectSrc = getValue(filterConfig, CONNECT_SRC);
        fontSrc = getValue(filterConfig, FONT_SRC);
        objectSrc = getValue(filterConfig, OBJECT_SRC);
        mediaSrc = getValue(filterConfig, MEDIA_SRC);
        frameSrc = getValue(filterConfig, FRAME_SRC);
        sandbox = getValue(filterConfig, SANDBOX);
        childSrc = getValue(filterConfig, CHILD_SRC);
        formAction = getValue(filterConfig, FORM_ACTION);
        frameAncestors = getValue(filterConfig, FRAME_ANCESTORS);
        pluginTypes = getValue(filterConfig, PLUGIN_TYPES);
    }

    public void doFilter(ServletRequest request,
                         ServletResponse response,
                         FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse httpResponse = (HttpServletResponse)response;
        String headerName = reportOnly ? CSP_REPORT_ONLY_HEADER : CSP_HEADER;
        httpResponse.addHeader(headerName, makeContentSecurityPolicy());
        chain.doFilter(request, response);
    }

    public void destroy() {
        // does nothing
    }

    private String getValue(FilterConfig config, String name,
                            String defaultValue) {
        String value = config.getInitParameter(name);
        if (isEmptyString(value)) {
            value = defaultValue;
        }
        return value;
    }

    private String getValue(FilterConfig config, String name) {
        return config.getInitParameter(name);
    }

    private boolean getBooleanValue(FilterConfig config, String name) {
        String value = config.getInitParameter(name);
        return "true".equalsIgnoreCase(value);
    }

    private String makeContentSecurityPolicy() {
        StringBuilder csp = new StringBuilder(DEFAULT_SRC)
                .append(" ")
                .append(defaultSrc);

        addDirectiveToCSP(csp, SCRIPT_SRC, scriptSrc);
        addDirectiveToCSP(csp, STYLE_SRC, styleSrc);
        addDirectiveToCSP(csp, IMG_SRC, imgSrc);
        addDirectiveToCSP(csp, CONNECT_SRC, connectSrc);
        addDirectiveToCSP(csp, FONT_SRC, fontSrc);
        addDirectiveToCSP(csp, OBJECT_SRC, objectSrc);
        addDirectiveToCSP(csp, MEDIA_SRC, mediaSrc);
        addDirectiveToCSP(csp, FRAME_SRC, frameSrc);
        addDirectiveToCSP(csp, CHILD_SRC, childSrc);
        addDirectiveToCSP(csp, FORM_ACTION, formAction);
        addDirectiveToCSP(csp, FRAME_ANCESTORS, frameAncestors);
        addDirectiveToCSP(csp, PLUGIN_TYPES, pluginTypes);
        addDirectiveToCSP(csp, REPORT_URI, reportUri);
        addSandboxDirectiveToCSP(csp, sandbox);

        return csp.toString();
    }

    private void addDirectiveToCSP(StringBuilder csp,
                                   String directiveName,
                                   String value) {
        if (!isEmptyString(value) && !defaultSrc.equals(value)) {
            csp.append("; ").append(directiveName).append(" ").append(value);
        }
    }

    private void addSandboxDirectiveToCSP(StringBuilder csp, String value) {
        if (!isEmptyString(value)) {
            if ("true".equalsIgnoreCase(value)) {
                csp.append("; ").append(SANDBOX);
            } else {
                csp.append("; ").append(SANDBOX).append(" ").append(value);
            }
        }
    }

    private static boolean isEmptyString(final String s) {
        int length;
        if (null == s || (length = s.length()) == 0) {
            return true;
        }
        for (int i = 0; i < length; i++) {
            if (!Character.isWhitespace(s.charAt(i))) {
                return false;
            }
        }
        return true;
    }
}

