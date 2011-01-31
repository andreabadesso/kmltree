var kmltreeManager = (function(){
    that = {};
    var trees = [];
    var ge;
    var cache = {};
    
    function init(earthInstance){
        ge = earthInstance;
        google.earth.addEventListener(ge, 'balloonopening', balloonOpening);
        google.earth.addEventListener(ge, 'balloonclose', balloonClose);
    }
    
    var register = function(tree, privilegedApi){
        if(trees.length === 0){
            init(privilegedApi.opts.gex.pluginInstance);
        }
        trees.push({
            key: 'kmltree-tree-' + trees.length.toString(),
            instance: tree,
            api: privilegedApi
        });
    };
    
    that.register = register;
    
    var remove = function(tree){
        for(var i = 0; i<trees.length; i++){
            if(trees[i].instance === tree){
                trees.splice(i, 1);
                break;
            }
        }
        return tree;
    };
    
    that.remove = remove;
    
    var pauseListeners = function(callable){
        google.earth.removeEventListener(
            ge, 'balloonopening', balloonOpening);
        google.earth.removeEventListener(
            ge, 'balloonclose', balloonClose);
        callable();
        google.earth.addEventListener(
            ge, 'balloonopening', balloonOpening);
        google.earth.addEventListener(
            ge, 'balloonclose', balloonClose);        
    };
    
    that.pauseListeners = pauseListeners;
    
    
    var balloonOpening = function(e){
        var f = e.getFeature();
        var tree = getOwner(f);
        console.log('balloonopening');
        // e.preventDefault();
        // e.stopPropagation();
        // ge.setBalloon(null);
        // openBalloon(f, ge, opts, that);
        // return false;                
    }
        
    var balloonClose = function(e){
        // $('#kmltree-balloon-iframe').remove();
        // clearSelection();         
    }
        
    var ownsUrl = function(doc, url){
        if(doc.getUrl() === url){
            return tree;
        }
        if(doc.getElementByUrl(url)){
            return tree;
        }
    }

    var getOwner = function(kmlObject){
        var url = kmlObject.getUrl();
        var urlWithoutId = url.split('#')[0];
        if(cache[urlWithoutId]){
            console.log('cache hit');
            return cache[urlWithoutId];
        }else{
            console.log('cache miss', urlWithoutId, url);            
        }
        // First check if url matches root element
        for(var i=0;i<trees.length;i++){
            if(ownsUrl(trees[i].instance.kmlObject, url)){
                cache[urlWithoutId] = trees[i];
                return trees[i];
            }
        }
        // Then check each tree's expanded NetworkLinks
        // TODO: Test if this works
        for(var i=0;i<trees.length;i++){
            var tree = trees[i].instance;
            var api = trees[i].api;
            var docs = trees[i].api.docs;
            for(var j = 0; j<docs.length;j++){
                var doc = docs[j];
                if(ownsUrl(doc, url)){
                    cache[urlWithoutId] = trees[i];
                    return trees[i];
                }
            }
        }
        // Couldn't find. Could be content loaded outside kmltree. 
        // In any case, ignore
        return false;
    };
    
    $(window).bind("message", function(e){
        var e = e.originalEvent;
        resize(e);
    });
    
    
    function resize(e){
        console.log('resize');
        var b = ge.getBalloon();
        var f = b.getFeature();
        var iframe = $('#kmltree-balloon-iframe');
        if(
            // There should at least be an iframe present
            !iframe.length || 
            // Message must include a new dimension or specify that none could
            // be calculated
            !(e.data.match(/width/) || e.data.match(/unknownIframeDimensions/)
            ) || 
            // Make sure the current popup is an HtmlDivBalloon
            b.getType() !== 'GEHtmlDivBalloon' || 
            // And make sure that the window that sent the message is the 
            // right one - Security check
            $(b.getContentDiv()).find('iframe')[0] !== frameElement(e.source))
            {
            // and if all those conditions aren't met...
            // Oooooo... A zombie Iframe!!!
            // don't do anything, that balloon has already closed
            return;
        }
        var tree = getOwner(f);
        var dim = JSON.parse(e.data)
        if(dim.unknownIframeDimensions){
            dim = tree.api.opts.unknownIframeDimensionsDefault;
            console.log(dim);
        }
        var el = $('#kmltree-balloon-iframe');
        b.setMinWidth(dim.width);
        b.setMaxWidth(dim.width + (dim.width * .1));
        b.setMinHeight(dim.height);
        b.setMaxHeight(dim.height + (dim.height * .1));
        el.height(dim.height);
        el.width(dim.width);
        console.log('set dimensions');
        $(tree.instance).trigger('balloonopen', [b, f]);
    }
    
    // Implemented this because call window.frameElement on a cross-origin 
    // iframe results in a security exception.
    function frameElement(win){
        var iframes = document.getElementsByTagName('iframe');
        for(var i =0;i<iframes.length;i++){
            if(iframes[0].contentWindow === win){
                return iframes[i];
            }
        }
    }
    
    return that;
})();