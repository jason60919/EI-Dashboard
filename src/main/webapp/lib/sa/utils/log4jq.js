/* 
 * The log4jq is based on log4javascript framework
 * @auth ken.tsai@advantech.com.tw
 * @date 2014/9/9
 * @required
 * js/libs/log4javascript/log4javascript.min.js
 */

function isSupportLocalStorage() {
    var isSupport = true;
    if (typeof localStorage === 'object') {
        try {
            localStorage.setItem('localStorage', 1);
            localStorage.removeItem('localStorage');
        } catch (e) {
            Storage.prototype._setItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function () {
            };
//            alert('Your web browser does not support storing settings locally. In Safari, the most common cause of this is using "Private Browsing Mode". Some settings may not save or some features may not work properly for you.');
            isSupport = false;
        }
        return isSupport;
    }
}

var log4jq = (function ($) {

    // Create main log4javascript object; this will be assigned public properties
    function log4jq() {
    }
    ;

    var log = null;//log4javascript instance
    var log4jq = new log4jq();
    log4jq.version = '0.1';
    log4jq.author = 'bigd';
    log4jq.github = 'https://github.com/iambigd';
    log4jq.enableLocalStorage = isSupportLocalStorage();

    //public method
    log4jq.configue = function (_settings) {
        $.extend(settings, _settings);//jquery method
    };

    log4jq.getLogLv = function () {
        var currentLv = $.cookie("log4jq");
        return  (currentLv !== null) ? currentLv : 'OFF';
    };

    log4jq.getLoggerFormConfigStore = function (name) {
        var logConfig ;
        if (log4jq.enableLocalStorage) {
            logConfig = store.get(name);
            return logConfig;
        }else{
            return logConfig;
        }
//        return store.get(name);
    };
    log4jq.removeLoggerFromCofigStore = function (name) {
        if (log4jq.enableLocalStorage) {
            return store.remove(name);
        }

    };
    log4jq.addLoggerToConfigStore = function (name, logger) {
        if (log4jq.enableLocalStorage) {
            store.set(logger.name, logger);
        }

    };

    log4jq.setLogConfig = function (config) {
        var that = this;
        if (log4jq.enableLocalStorage) {
            for (var i = 0; i < config.loggers.length; i++) {
                var logger = config.loggers[i];
                that.addLoggerToConfigStore(logger.name, logger);
            }
        }

    };

    //global setting
    log4jq.setLogLv = function (lv) {
        $.cookie("log4jq", lv, {path: '/'});
//        log.setLevel(_getLogLv('OFF'));
    };

    log4jq.disable = function () {
        log4jq.setLogLv('OFF');
//        log.setLevel(_getLogLv('OFF'));
    };

    log4jq.getLogger = function (_settings) {
        var that = this;
        var opts = $.extend(settings, _settings);//jquery method

        // Create the logger
        log = log4javascript.getLogger(opts.loggerName);

        //create console appender
        var consoleAppender = new log4javascript.BrowserConsoleAppender();

        //create layout
        var layout = new log4javascript.PatternLayout(opts.appender.layout);
        consoleAppender.setLayout(layout);

        //set log level from global
        var logLv = _getLogLv(opts.appender.level);
        //get log level from config
//        var loggerFormConfig = that.getLoggerFormConfigStore(opts.loggerName);
//        if (typeof (loggerFormConfig) !== 'undefined') {
//            logLv = _getLogLv(loggerFormConfig.level);
//        }
        log.setLevel(logLv);
        log.addAppender(consoleAppender);
        return log;
    };

    //private method
    var _getLogLv = function (lv) {
        var log4jLv = null;
        switch (lv) {
            case 'ALL':
                log4jLv = log4javascript.Level.ALL;
                break;
            case 'TRACE':
                log4jLv = log4javascript.Level.TRACE;
                break;
            case 'DEBUG':
                log4jLv = log4javascript.Level.DEBUG;
                break;
            case 'INFO':
                log4jLv = log4javascript.Level.INFO;
                break;
            case 'WARN':
                log4jLv = log4javascript.Level.WARN;
                break;
            case 'ERROR':
                log4jLv = log4javascript.Level.ERROR;
                break;
            case 'OFF':
                log4jLv = log4javascript.Level.OFF;
                break;
            default:
                log4jLv = log4javascript.Level.ALL;
        }
        return log4jLv;
    };

    //write default log level
//    log4jq.setLogLv(log4jq.getLogLv());

    //default config
    var settings = {
        loggerName: 'log4jq', //input logger name
        appender: {
            name: 'console', //or ajax
            layout: '%d{dd MMM yyyy HH:mm:ss,SSS} [%-5p] [%c] %m{1}',
            level: log4jq.getLogLv()
        }
    };

    window.log4jq = log4jq;
    return log4jq;

})(jQuery);

if (typeof (log4jqConfig) != 'undefined') {
    log4jq.setLogConfig(log4jqConfig);
}

