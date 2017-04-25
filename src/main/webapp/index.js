var m_AzureAuthContext;
var m_AzureUser;
var m_Did = "1";
//var m_AgentID = "00000001-0000-0000-0000-654A3A700000";
var m_AgentID = "00000001-0000-0000-0000-305A3A700000";
$(function () {

    if (location.protocol == "file:")
    {
        window.location.href = "FreeBoard.html";
    }

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
    m_AzureAuthContext = new AuthenticationContext(config);

    // Check For & Handle Redirect From AAD After Login
    var isCallback = m_AzureAuthContext.isCallback(window.location.hash);
    m_AzureAuthContext.handleWindowCallback();

    if (isCallback && !m_AzureAuthContext.getLoginError()) {
        window.location = m_AzureAuthContext._getItem(m_AzureAuthContext.CONSTANTS.STORAGE.LOGIN_REQUEST);
    }

    // Check Login Status, Update UI
    m_AzureUser = m_AzureAuthContext.getCachedUser();
    if (m_AzureUser != null)
    {
        if (typeof m_AzureUser.profile != "undefined")
        {
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
                beforeSend: function (xhr) {
                    var authorization = 'Bearer ' + $.base64.encode(JSON.stringify(_oRMM.Login.sso));
                    xhr.setRequestHeader("Authorization", authorization);
                    xhr.setRequestHeader("Accept", "application/json");
                },
                error: function (xhr, exception) {
                    var oError = $.parseJSON(xhr.responseText);
                    if (!oError.success)
                    {
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
                    if (xhr.success)
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
        }
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
            dataType: 'json',
            beforeSend: function (xhr) {
                var authorization = 'Basic ' + $.base64.encode($('#frmMainLogin_UserName').val() + ':' + $('#frmMainLogin_Password').val());
                xhr.setRequestHeader("Authorization", authorization);
                xhr.setRequestHeader("Accept", "application/json");
            },
            error: function (xhr, exception) {
                var oError = $.parseJSON(xhr.responseText);
                if (!oError.success)
                {
                    swal({
                        title: "warning",
                        text: "Authentication failed !!",
                        type: "warning"
                    });
                }

                $('#frmMainLogin_UserName').focus();
                $('.RMMLoader').hide();
                //window.location.href = "FreeBoard.html";
            },
            success: function (xhr) {
                if (xhr.success)
                {
                    var oRMM = _RMMGlobal.Get();
                    oRMM.Login = {};
                    oRMM.Login.aid = xhr.result.aid;
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

    $('#frmLogin_btnoAzureADLogin').click(function () {
        m_AzureAuthContext.login();
    });

    $('#frmMainLogin_txtDid').change(function () {
        m_Did = $(this).val();
    });

    $('#frmMainLogin_txtAgentID').change(function () {
        m_AgentID = $(this).val();
    });

    $('#frmMainLogin_rmmLoginBody').dblclick(function () {
        $(".agentInfo").show();
    });

    $('#frmMainLogin_txtDid').val(m_Did);
    $('#frmMainLogin_txtAgentID').val(m_AgentID);

    $(".agentInfo").hide();
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
