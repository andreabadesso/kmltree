
module('enableGoogleLayersControl');

(function(){
    
    // given the name of a file within examples/kml, creates an absolute url
    // to it, appending ?r=revision if necessary
    function example(filename){
        var url = '../examples/kml/' + filename;
        // var url = 'http://kmltree.googlecode.com/hg/examples/kml/' + filename;
        var r = getParameterByName('r');
        if(r !== ''){
            url = url + '?r=' + r;
        }
        return url;
    }

    var layers = {};
    
    function Layer(name, initialState, type, layer_name_or_test, async){
        this.name = name;
        this.initialState = initialState;
        this.layerName = layer_name_or_test;
        if(type === 'option'){
            if(layer_name_or_test){
                this.optionName = layer_name_or_test;
            }else{
                this.optionName = name.replace(' ', '');
            }
        }
        this.type = type;
        this.test = layer_name_or_test;
        this.async = async;
    }
    
    Layer.prototype.getEarthState = function(ge, tree, element){
        switch(this.type){
            case 'layer':
                return ge.getLayerRoot().getLayerById(
                    ge[this.layerName]).getVisibility();
                break;
            case 'option':
                return ge.getOptions()['get'+this.optionName+'Visibility']();
                break;
            default:
                // special
                return this.test(ge);
        }
    }
    
    $.expr[":"].econtains = function(obj, index, meta, stack){
    return (obj.textContent || obj.innerText || $(obj).text() || "").toLowerCase() == meta[3].toLowerCase();
    }
    
    Layer.prototype.testState = function(ge, tree, element, initial){
        var node = element.find(
            'span.name:econtains('+this.name+')').parent();
        equals(node.length, 1, 'Found node representing layer '+this.name);
        var kmlObject = tree.lookup(node);
        var earthState = this.getEarthState(ge, tree, element);
        // Check the status of the layer visibility
        ok((!!earthState === (this.initialState === initial)), 'GE State - Layer ' 
            + this.name + ' should have ' + (initial ? 'an initial ' : 'a') 
            + ' state = ' + (this.initialState === initial));
        // Check the status of the node representing the layer in the loaded 
        // kml file
        ok((!!kmlObject.getVisibility() === (this.initialState === initial)),
            'Tree Node kmlObject - Layer ' + this.name + 
            ' should have ' + (initial ? 'an initial' : 'a') 
            + ' state = ' + (this.initialState === initial));
        // Check the toggle state of the ui
        ok((node.hasClass('visible') === (this.initialState === initial)),
            'Toggle state of UI matches DOM. Toggle state should be = ' + 
            (this.initialState === initial));
    };
    
    Layer.prototype.testInitialState = function(ge, tree, element){
        this.testState(ge, tree, element, true);
    };
    
    Layer.prototype.testOpposingState = function(ge, tree, element){
        this.testState(ge, tree, element, false);
    };

    function Runner(url){
        this.url = url;
        this.layers = [];
    };
    
    Runner.prototype.test = function(type, name, initial_state, name_or_test, async){
        this.layers.push(new Layer(name, initial_state, type, name_or_test, async));
    };
    
    Runner.prototype.testOption = function(name, initial_state, name_or_test){
        this.test('option', name, initial_state, name_or_test);
    };

    Runner.prototype.testLayer = function(name, initial_state, name_or_test){
        this.test('layer', name, initial_state, name_or_test);
    };
    
    Runner.prototype.testSpecial = function(name, initial_state, name_or_test, async){
        this.test('special', name, initial_state, name_or_test, async);
    };
    
    Runner.prototype.run = function(){
        var layers = this.layers;
        var url = this.url;
        for(var i = 0; i < this.layers.length; i++) (function(i){
            var layer = layers[i];
            earthAsyncTest(layer.name, function(ge, gex){
                var layer = layers[i];
                $(document.body).append('<div class="kmltreetest"></div>');
                var tree = kmltree({
                    url: example(url),
                    gex: gex, 
                    mapElement: $('#map3d'), 
                    element: $('.kmltreetest'),
                    bustCache: true,
                    supportItemIcon: true
                });

                enableGoogleLayersControl(tree, ge);

                $(tree).bind('kmlLoaded', function(e, kmlObject){
                    ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
                    layer.testState(ge, tree, $('.kmltreetest'), true);
                    var node = $('.kmltreetest').find('span.name:econtains('+layer.name+')').parent();
                    node.find('> .toggler').click();
                    if(layer.async){
                        setTimeout(function(){
                            layer.testState(ge, tree, $('.kmltreetest'), false);
                            tree.destroy();
                            $('.kmltreetest').remove();
                            start();
                        }, 1000);
                    }else{
                        layer.testState(ge, tree, $('.kmltreetest'), false);
                        tree.destroy();
                        $('.kmltreetest').remove();
                        start();
                    }
                });
                ok(tree !== false, 'Tree initialized');
                tree.load();
            });
        })(i);
    };
    
    Runner.prototype.runRefreshTest = function(){
        var that = this;
        earthAsyncTest('Refresh test on '+this.url, function(ge, gex){
            $(document.body).append('<div class="kmltreetest"></div>');
            var tree = kmltree({
                url: example(that.url),
                gex: gex, 
                mapElement: $('#map3d'), 
                element: $('.kmltreetest'),
                bustCache: true,
                supportItemIcon: true,
                refreshWithState: true
            });

            enableGoogleLayersControl(tree, ge);

            $(tree).one('kmlLoaded', function(e, kmlObject){
                ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
                for(var i = 0; i < that.layers.length; i++){
                    var layer = that.layers[i];
                    layer.testState(ge, tree, $('.kmltreetest'), true);
                    var node = $('.kmltreetest').find('span.name:econtains('+layer.name+')').parent();
                    node.find('> .toggler').click();
                    if(!layer.async){
                        layer.testState(ge, tree, $('.kmltreetest'), false);
                    }
                }
                $(tree).one('kmlLoaded', function(e, kmlObject){
                    for(var i = 0; i < that.layers.length; i++){
                        var layer = that.layers[i];
                        if(!layer.async){
                            layer.testState(ge, tree, $('.kmltreetest'), false);
                        }
                    }
                    tree.destroy();
                    $('.kmltreetest').remove();
                    start();
                });
                tree.refresh();
            });
            ok(tree !== false, 'Tree initialized');
            tree.load();
        });
    };
    
    var r = new Runner('displayOptions.kml');
    r.testOption('Scale Legend', false);
    r.testOption('Status Bar', true);
    r.testOption('Overview Map', false);
    r.testOption('Atmosphere', true);    
    r.testLayer('3d Terrain and Ocean Surface', true, 'LAYER_TERRAIN');
    r.testSpecial('Sun', false, function(ge){
        return ge.getSun().getVisibility();
    });
    r.testSpecial('Historical Imagery', false, function(ge){
        return ge.getTime().getHistoricalImageryEnabled();
    }, true);
    r.testSpecial('Navigation Controls', true, function(ge){
        return ge.getNavigationControl().getVisibility() === 
            ge.VISIBILITY_SHOW;
    });
    r.run();
    r.runRefreshTest();
    
    var r = new Runner('includedLayers.kml');
    r.testLayer('Roads', false, 'LAYER_ROADS');
    r.testLayer('Borders and Labels', false, 'LAYER_BORDERS');
    r.testLayer('3d Buildings', false, 'LAYER_BUILDINGS');
    r.testLayer('Low Resolution 3d Buildings', false, 
        'LAYER_BUILDINGS_LOW_RESOLUTION');
    r.run();
    r.runRefreshTest();


})()
