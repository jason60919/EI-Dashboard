var m_AzureAuthContext;
var m_AzureUser;
$(function () {
    if (location.protocol == "file:")
        window.location.href = "FreeBoard.html";

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
    // Check For & Handle Redirect From AAD After Login
    var isCallback = m_AzureAuthContext.isCallback(window.location.hash);
    m_AzureAuthContext.handleWindowCallback();

    if (isCallback && !m_AzureAuthContext.getLoginError()) {
        window.location = m_AzureAuthContext._getItem(m_AzureAuthContext.CONSTANTS.STORAGE.LOGIN_REQUEST);
    }

    m_AzureUser = m_AzureAuthContext.getCachedUser();
    if (m_AzureUser != null)
    {
        if (typeof m_AzureUser.profile != "undefined") {
            var _oRMM = _RMMGlobal.Get();

            _oRMM.Login = {};
            _oRMM.Login.username = m_AzureUser.userName;
            _oRMM.Login.sso = m_AzureUser;
            _oRMM.Login.type = "Azure";
            _RMMGlobal.Set(_oRMM);
            $('.RMMLoader').show();
            $.ajax({
                cache: false,
                url: "dashboard/api/account/login",
                type: "get",
                contentType: 'application/json',
                dataType: 'json',
                xhrFields: {
                    withCredentials: true
                },
                beforeSend: function (xhr) {
                    switch (_oRMM.Login.type) {
                        case "Azure" :
                            var authorization = 'Bearer ' + $.base64.encode(JSON.stringify(_oRMM.Login.sso));
                            xhr.setRequestHeader("Authorization", authorization);
                            xhr.setRequestHeader("Accept", "application/json");
                            break;
                        case "AzureIII" :
                            var authorization = 'Bearer ' + _oRMM.Login.sso;
                            xhr.setRequestHeader("Authorization", authorization);
                            xhr.setRequestHeader("Accept", "application/json");
                            break;
                    }
                },
                error: function (xhr, exception) {
                    var oError = $.parseJSON(xhr.responseText);
                    if (!oError.success) {
                        swal({
                            title: "warning",
                            text: "Authentication failed !!",
                            type: "warning"
                        });
                    }

                    $('#frmMainLogin_UserName').focus();
                    $('.RMMLoader').hide();
                },
                success: function (xhr) {
                    if (xhr.success) {
                        window.location.href = "FreeBoard.html";
                    }
                    else {
                        swal({
                            title: "warning",
                            text: "Authentication failed - password error !",
                            type: "warning"
                        });
                        $('#frmMainLogin_Password').focus();
                    }
                    $('.RMMLoader').hide();
                }
            });
        }
    }

    //Azure III
    if (typeof Cookies.get('WISEName') !== 'undefined')
    {
        var _oRMM = _RMMGlobal.Get();

        _oRMM.Login = {};
        _oRMM.Login.username = "";
        _oRMM.Login.sso = Cookies.get('WISEAccessToken');
        _oRMM.Login.type = "AzureIII";
        _RMMGlobal.Set(_oRMM);
        $('.RMMLoader').show();
        setTimeout(function () {
            $.ajax({
            cache: false,
            url: "dashboard/api/account/login",
            type: "get",
            contentType: 'application/json',
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            },
            beforeSend: function (xhr) {
                var authorization = 'Basic ' + $.base64.encode(_RMMGlobal.Get().Login.username + ':' + _RMMGlobal.Get().Login.password);
                xhr.setRequestHeader("Authorization", authorization);
                xhr.setRequestHeader("Accept", "application/json");
            },
            error: function (xhr, exception) {
                try
                {
                    var oError = $.parseJSON(xhr.responseText);
                    if (oError.ErrorDescription != "")
                    {
                        swal({
                            title: "warning",
                            text: oError.ErrorDescription,
                            type: "warning"
                        });
                    }
                }
                catch (e)
                {
                    swal({
                        title: "warning",
                        text: xhr.responseText,
                        type: "warning"
                    });
                }
                $('.login-box').show();
                $('#frmMainLogin_UserName').focus();
                $('.RMMLoader').hide();
            },
            success: function (xhr) {
                if (typeof xhr.aid != "undefined")
                {
                    window.location.href = "FreeBoard.html";
                }
                else
                {
                    swal({
                        title: "warning",
                        text: "Authentication failed - password error !",
                        type: "warning"
                    });
                    $('#frmMainLogin_Password').focus();
                }
                $('.RMMLoader').hide();
            }
        });
        }, 1000);
    }
    else
    {
        $('.login-box').show();
    }

    $('input').iCheck({
        checkboxClass: 'icheckbox_square-blue',
        radioClass: 'iradio_square-blue',
        increaseArea: '20%' // optional
    });

    $('#frmMainLogin_rmmLoginBody').keypress(function (event) {
        if (event.keyCode == 13) {
            $('#frmMainLogin_rmmLoginBody button').click();
        }
    });

    $('#frmMainLogin_rmmLoginBody button').click(function () {
        $('.RMMLoader').show();
        $.ajax({
            cache: false,
            url: "dashboard/api/account/login",
            type: "get",
            contentType: 'application/json',
            xhrFields: {
                withCredentials: true
            },
            beforeSend: function (xhr) {
                var authorization = 'Basic ' + $.base64.encode($('#frmMainLogin_UserName').val() + ':' + $('#frmMainLogin_Password').val());
                xhr.setRequestHeader("Authorization", authorization);
                xhr.setRequestHeader("Accept", "application/json");
            },
            error: function (xhr, exception) {
                var oError = $.parseJSON(xhr.responseText);
                if (oError.ErrorDescription != "")
                {
                    swal({
                        title: "warning",
                        text: oError.ErrorDescription,
                        type: "warning"
                    });
                }

                $('#frmMainLogin_UserName').focus();
                $('.RMMLoader').hide();
                //window.location.href = "FreeBoard.html";
            },
            success: function (xhr) {
                if (typeof xhr.aid != "undefined")
                {
                    var oRMM = _RMMGlobal.Get();
                    oRMM.Login = {};
                    //oRMM.Login.aid = xhr.aid;
                    oRMM.Login.aid = xhr.aid;
                    oRMM.Login.username = $('#frmMainLogin_UserName').val();
                    oRMM.Login.password = $('#frmMainLogin_Password').val();
                    oRMM.Login.type = "Self";
                    _RMMGlobal.Set(oRMM);
                    window.location.href = "FreeBoard.html";
                }
                else
                {
                    swal({
                        title: "warning",
                        text: "Authentication failed - password error !",
                        type: "warning"
                    });
                    $('#frmMainLogin_Password').focus();
                }
                $('.RMMLoader').hide();
            }
        });
    });

    $('#frmLogin_btnAzureADLogin').click(function () {
        m_AzureAuthContext.login();
    });

    $('#frmLogin_btnAzureIIILogin').click(function () {
        var oRMM = _RMMGlobal.Get();
        var redirectUrl = 'https://login.windows.net/c53d73cb-64c4-4c1d-b972-7f92d1330c39/oauth2/authorize?response_type=code&redirect_uri=' + oRMM.ssoURL + 'web/redirectPage.html&client_id=09ea49b3-09fc-4b9a-b452-52563e9d4add&state=' + window.location.origin;
        window.location.href = redirectUrl;
    });

    $('#frmLogin_btnAzureIIISignUp').click(function () {
        var oRMM = _RMMGlobal.Get();
        var redirectUrl = oRMM.ssoURL + 'web/signUp.html';
        window.location.href = redirectUrl;
    });

    $('#frmLogin_btnSignOut').click(function () {
        $.ajax({
            url: GLOBAL_CONFIG.hostUrl + '/sso/auth',
            method: 'DELETE',
            xhrFields: {
                withCredentials: true
            },
        }).done(function() {
            var redirectUrl = 'https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=' + GLOBAL_CONFIG.hostUrl + '/web/index.html';
            window.location.href = redirectUrl;
        });
    });

    //SSO URL : portal-sso.wise-paas.com/
    $('body').keydown(function (evt) {
        // ctrl + F12
        if (evt.ctrlKey && (evt.keyCode == 123))
        {
            if ($(".loginSelf").is(":visible"))
                $(".loginSelf").hide();
            else
                $(".loginSelf").show();
        }
    });

    $('#frmMainLogin_txtSSO').change(function () {
        var oRMM = _RMMGlobal.Get();
        oRMM.ssoURL = $('#frmMainLogin_txtSSO').val();
        _RMMGlobal.Set(oRMM);
    });

    var nIndex =  window.location.hostname.indexOf(".");
    var strDomain = "wise-paas.com/";
    if (nIndex > 0)
        strDomain = window.location.hostname.substr(nIndex + 1) + "/";
    var strSSOURL = window.location.protocol + "//portal-sso." + strDomain;
    if (/-stage/g.test(window.location.hostname))
        strSSOURL = window.location.protocol + "//portal-sso-stage." + strDomain;
    if (/-develop/g.test(window.location.hostname))
        strSSOURL = window.location.protocol + "//portal-sso-develop." + strDomain;
    $("#frmMainLogin_txtSSO").val(strSSOURL);
    var oRMM = _RMMGlobal.Get();
    oRMM.ssoURL = strSSOURL;
    _RMMGlobal.Set(oRMM);

    $('#frmMainLogin_UserName').focus();
});

function frmMainLogin_Logout()
{
    if (m_AzureUser != null)
    {
        if (typeof m_AzureUser.profile != "undefined")
        {
            m_AzureAuthContext.logOut();
        }
    }
}
