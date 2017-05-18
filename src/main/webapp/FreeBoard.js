/* 
 * freeboard entry point
 * @author ken.tsai@adventech.com.tw
 * @date 2015/09/01
 */
var myCookieExpiresDate = new Date();
myCookieExpiresDate.setTime(myCookieExpiresDate.getTime() + (1 * 365 * 24 * 60 * 60 * 1000));
var m_AzureAuthContext;
var m_AzureUser;

var g_agentID = "";
var g_arySheet = [];
var _oRMM = _RMMGlobal.Get();
var g_ReadOnly = false;

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

(function () {
    window.config = {
        instance: 'https://login.microsoftonline.com/',
        //tenant: '[Enter your tenant here, e.g. contoso.onmicrosoft.com]',
        //clientId: '[Enter your client_id here, e.g. g075edef-0efa-453b-997b-de1337c29185]',
        //tenant: 'Advantecher.onmicrosoft.com',
        //clientId: '816122fa-ee54-4c21-a3e2-c8faed48c464',
        tenant: 'wisesso.onmicrosoft.com',
        clientId: '750f3881-58f7-40ff-8794-ed004c442031',
        postLogoutRedirectUri: window.location.origin,
        cacheLocation: 'localStorage', // enable this for IE, as sessionStorage does not work for localhost.
    };
    //Microsoft Azure
    m_AzureAuthContext = new AuthenticationContext(config);
    m_AzureUser = m_AzureAuthContext.getCachedUser();

    var dashboardLog = log4jq.getLogger({
        loggerName: 'frmFreeboard.js'
    });
    dashboardLog.info('DOM READY');

    //EIS Portal
    if (window.location.search.split("?").length == 2)
    {
        g_agentID = window.location.search.split("?")[1].split("=")[1];
    }
    if (typeof (freeboard) != 'undefined') {
        freeboard.setAssetRoot('/freeboard-ui/');
        freeboard.initialize(true);
    } else {
        dashboardLog.error('CANNOT find freeboard instance');
    }

    $('body').keydown(function (evt) {
        // ctrl + F12
        if (evt.ctrlKey && (evt.keyCode == 123))
        {
            g_ReadOnly = !g_ReadOnly;
            if ($('#board-configs').is(':visible'))
            {
                $('.isEditable').hide();
                $('.editLink').hide();
                $('#board-configs').hide();
            }
            else
            {
                $('.isEditable').show();
                $('.editLink').show();
                $('#board-configs').show();
            }
        }
    });
}());
