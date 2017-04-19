// ┌────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                              │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                                     │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                                           │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                │ \\
// └────────────────────────────────────────────────┘ \\

// i18next initialize
(function ($) {
    'use strict';

    i18n.debug = false;
    //modified by ken 2015/08/31
    var options = {
         useCookie:true,
//         cookieName: 'selectedLang',

        resGetPath: 'locales/__lng__.json',
        lowerCaseLng: true,
        postProcess: 'sprintf',
//        fallbackLng: false ,
        fallbackLng: 'en-us',
        getAsync: false
//        ,detectLngQS: 'lang'
    };
    i18n.init(options);

}(jQuery));