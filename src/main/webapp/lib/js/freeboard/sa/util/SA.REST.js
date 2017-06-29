/* 
 * SA REST
 * @date 2015/11/5
 */

var REST = (function (log4jq) {
    var self = this;
    
    var logger = log4jq.getLogger({
        loggerName: 'SA.REST.js'
    });
    
    var ENDPOINT = '';
    var API_ENDPOINT = '';
    var PROJ_NAME =  '/webresources';
    
    function detectEndpoint() {
        logger.info('detectEndpoint');
        var endpoint = '';
        var parser = document.createElement('a');
        parser.href = window.location.href;
        var hostname = parser.hostname || window.location.hostname;
        var port = (parser.port === '') ? '' : (':' + parser.port);
        
        ENDPOINT =
                parser.protocol
                + '//'
                + hostname
                + port;
        
        API_ENDPOINT = ENDPOINT + PROJ_NAME;
        logger.debug('api endpoint: ' + ENDPOINT);
    };
    
    detectEndpoint();
    
    self.getAuthorization = function () {
        logger.info('getAuthorization');
        var authorization = 'Basic ' +
                $.base64.encode(decryption($.cookie('selectedTabPageaccount')) + ':'
                        + decryption($.cookie('selectedTabPagepassword')));
        return authorization;
    };
    self.getEndpoint = function(){
        logger.info('getEndpoint');
        return ENDPOINT;
    };
    self.getAPIEndpoint = function(){
        logger.info('getEndpoint');
        return API_ENDPOINT;
    };
    self.send = function(APIOpts, success, error) {
        logger.info('send');
        logger.debug(APIOpts);
        
        //support overwrite
        var apiUrl = (typeof(APIOpts.endpoint) != 'undefined')? APIOpts.endpoint : API_ENDPOINT;
        apiUrl += APIOpts.url;
        logger.debug('api url: ' + apiUrl);
        
        var async = true;
        if(APIOpts.hasOwnProperty('async')){
            async = APIOpts.async;
        }
        $.ajax({
            url: apiUrl,
            type: APIOpts.method,
            data: APIOpts.data,
            dataType: 'json',
            async: async,
            contentType: 'application/json',
            xhrFields: {
                withCredentials: true
            },
            beforeSend: function (xhr) {
                try {
                    var authorization = 'Basic ' + $.base64.encode(_RMMGlobal.Get().Login.username + ':' + _RMMGlobal.Get().Login.password);
                    xhr.setRequestHeader("Authorization", authorization);
                    xhr.setRequestHeader("Accept", "application/json");
                }
                catch (e) {}
            },
            success: function (data) {
                if (!TokenValidation(data)) return;
                success(data);
            },
            error: function () {
                error();
            }
        });
    };
    
    return self;
    
})(log4jq);
