/* 
 * freeboard entry point
 * @author ken.tsai@adventech.com.tw
 * @date 2015/09/01
 */
var myCookieExpiresDate = new Date();
myCookieExpiresDate.setTime(myCookieExpiresDate.getTime() + (1 * 365 * 24 * 60 * 60 * 1000));

var g_agentID = "";
var g_arySheet = [];
var g_UserName = "alexshao";
var g_Password = "84188418";
var g_AccountID = "";


(function () {
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
}());
