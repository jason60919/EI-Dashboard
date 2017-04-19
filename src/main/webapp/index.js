var m_AzureAuthContext;
var m_AzureUser;
$(function () {
    window.config = {
        instance: 'https://login.microsoftonline.com/',
        //tenant: '[Enter your tenant here, e.g. contoso.onmicrosoft.com]',
        //clientId: '[Enter your client_id here, e.g. g075edef-0efa-453b-997b-de1337c29185]',
        //tenant: 'Advantecher.onmicrosoft.com',
        //clientId: '816122fa-ee54-4c21-a3e2-c8faed48c464',
        tenant: 'wisesso.onmicrosoft.com',
        //clientId: 'd14cc4b0-33be-4dfe-abaa-772508ef1314',
        clientId: '853eb8e0-30ff-472f-94d1-eff74d796403',
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
            var oRMM = _RMMGlobal.Get();
            oRMM.Login = {};
            oRMM.Login.username = m_AzureUser.userName;
            oRMM.Login.password = "xxxxxx";
            oRMM.Login.profile = m_AzureUser.profile;
            _RMMGlobal.Set(oRMM);
            index_afterLogin();
        }
    }

    $('#frmMainLogin_UserName').focus();

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
//        swal(
//                'Good job!',
//                'You clicked the button!',
//                'success'
//                )
//        return;
        $('.RMMLoader').show();
        var oRMM = _RMMGlobal.Get();
        oRMM.Login = {};
        oRMM.Login.aid = -1;
        oRMM.Login.username = $('#frmMainLogin_UserName').val();
        oRMM.Login.password = $('#frmMainLogin_Password').val();
        _RMMGlobal.Set(oRMM);
        index_afterLogin();
        $('.RMMLoader').hide();
        return;

        $.ajax({
            cache: false,
            url: '/rmm/v1/accounts/login?username=' + $('#frmMainLogin_UserName').val() + '&password=' + $('#frmMainLogin_Password').val(),
            type: "get",
            contentType: 'application/json',
            dataType: 'json',
            beforeSend: function (xhr) {
            },
            error: function (xhr, exception) {
                try
                {
                    var oError = $.parseJSON(xhr.responseText);
                    if (typeof oError.ErrorCode != "undefined")
                        BootstrapDialog.show({message: "Authentication failed - user name does not exist !"});
                } catch (e) {
                    BootstrapDialog.show({message: "Error :" + xhr.responseText});
                }

                $('#frmMainLogin_UserName').focus();
                $('.RMMLoader').hide();
            },
            success: function (xhr) {
                if (typeof xhr.ErrorCode == "undefined")
                {
                    if (xhr.result)
                    {
                        var oRMM = _RMMGlobal.Get();
                        oRMM.Login = {};
                        oRMM.Login.aid = xhr.aid;
                        oRMM.Login.username = $('#frmMainLogin_UserName').val();
                        oRMM.Login.password = $('#frmMainLogin_Password').val();
                        _RMMGlobal.Set(oRMM);
                        index_afterLogin();
                    }
                    else
                    {
                        BootstrapDialog.show({message: "Authentication failed - password error !"});
                        $('#frmMainLogin_Password').focus();
                    }
                    $('.RMMLoader').hide();
                }
                else
                {
                    BootstrapDialog.show({message: "Authentication failed - user name does not exist !"});
                    $('.RMMLoader').hide();
                    $('#frmMainLogin_UserName').focus();
                }
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
    frmMainLogin_rmmLoginBody

    $('#frmMainLogin_txtDid').val(m_Did);
    $('#frmMainLogin_txtAgentID').val(m_AgentID);

    $(".agentInfo").hide();

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
function getAccount()
{

}