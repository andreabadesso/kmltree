(function(){
    
    google.load("earth", "1");
    
    // earthTest and earthAsyncTest
    // ============================
    // 
    // Use earthTest rather than QUnit::test for testing functionality that 
    // requires an instance of the Google Earth Plugin and/or the 
    // earth-api-utility-library.
    // 
    // Test functions will be called with two arguments, the plugin instance 
    // and the utility library. Here is an example:
    // 
    //     earthTest('Test grid', 1, function(ge, gex){
    //         equals(ge.getOptions().getGridVisibility(), true, 
    //                  'Grid should be visible.');
    //     });
    //     
    // For asynchronous tests, use earthAsyncTest as a replacement for
    // QUnit::testAsync:
    // 
    //     earthAsyncTest('Test parse kml', 1, function(ge, gex){
    //         $.get('/path/to/kml', function(data){
    //             var doc = ge.parseKml(data);
    //             equals(doc.getName(), 'My Name');
    //             start();
    //         });
    //     });
    // 
    // When testing using asynchronous calls and the Earth Plugin it's
    // important to fill in the `expected` argument. Otherwise it can be
    // difficult to pin down which test caused an error.
    // 
    // See the following for more information on using QUnit:
    // http://docs.jquery.com/QUnit
    // 
    window.earthTest = function(name, expected, callback, async){
        if ( arguments.length === 2 ) {
        	callback = expected;
        	expected = 0;
        }

        var new_function = function(){
            if(ge && gex){
                if(!async){
                    start();                            
                }
                callback(ge, gex);
            }else{
                initializePlugin(function(){
                    if(!async){
                        start();                            
                    }
                    callback(ge, gex);                        
                });
            }
        }
        asyncTest(name, expected, new_function);
    }

    window.earthAsyncTest = function(name, expected, callback){
        if ( arguments.length === 2 ) {
        	callback = expected;
        	expected = 0;
        }
        earthTest(name, expected, callback, true);
    }
    
    var ge;
    var gex;

    function initializePlugin(callback){
        var map = $(document.body).append('<div id="map3d"></div>');
        $('#map3d').css({width:'400px', height: '200px', 'position': 'absolute', 'top': '-200px', 'right': '0px'});
        google.earth.createInstance('map3d', function(plugin){
            ge = plugin;
            gex = new GEarthExtensions(ge);
            callback();
        }, googleEarthFailureCallback);
    }

    function googleEarthFailureCallback(){
        alert('failed to load google earth plugin.');
    }

    module('Custom Earth Test Cases');

    var reference_to_first_google_earth_instance;

    earthAsyncTest('earthAsyncTest works', 2, function(ge, gex){
        ok(typeof ge === 'object' || typeof ge === 'function', 'Google Earth Plugin initialized');
        reference_to_first_google_earth_instance = ge;
        setTimeout(function(){
            start();
            ok(true === true, 'Additional asynchronous events can be run');
        }, 1000);
    });

    earthTest('only loads once', 1, function(ge, gex){
        ok(ge === reference_to_first_google_earth_instance, 
            'Google Earth Plugin should initialize only once.');
    });
    
})();