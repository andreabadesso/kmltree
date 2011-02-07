var kmltreeManager = (function(){
    that = {};
    var trees = [];
    var ge;
    var cache = {};
    
    function init(earthInstance){
        ge = earthInstance;
        google.earth.addEventListener(ge, 'balloonopening', balloonOpening);
        google.earth.addEventListener(ge, 'balloonclose', balloonClose);
        google.earth.addEventListener(ge.getGlobe(), 'click', function(e, d){
            if(e.getButton() === -1){
                // related to scrolling, ignore
                return;
            }
            var target = e.getTarget();
            if(target.getType() === 'GEGlobe' && $('.kmltree-selected').length){
                for(var i=0;i<trees.length;i++){
                    var treeEl = $(trees[i].api.opts.element);
                    if(treeEl.find('.kmltree-selected').length + treeEl.find('.kmltree-breadcrumb').length > 0){
                        trees[i].instance.clearSelection();
                    }
                }
            }
        });
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
    
    var getApi = function(tree){
        for(var i=0;i<trees.length;i++){
            if(trees[i].instance === tree){
                return trees[i].api;
            }
        }
    };
    
    var balloonOpening = function(e){
        var f = e.getFeature();
        var tree = getOwner(f);
        if(tree){
            e.preventDefault();
            ge.setBalloon(null);
            var selectable = false;
            var id = f.getId();
            if(id){
                selectable = tree.api.opts.selectable;
                if(typeof selectable === 'function'){
                    selectable = selectable(f);
                }
            }
            if(selectable){
                tree.instance.selectById(id, f);
            }
            openBalloon(f, tree);
            return false;                
        } // otherwise feature likely loaded outside of a kmltree instance
    }
        
    var balloonClose = function(e){
        $('#kmltree-balloon-iframe').remove();
        for(var i=0;i<trees.length;i++){
            var treeEl = $(trees[i].api.opts.element);
            if(treeEl.find('.kmltree-selected').length + treeEl.find('.kmltree-breadcrumb').length === 1 && treeEl.find('.kmltree-cursor-2').length === 0){
                trees[i].instance.clearSelection();
            }
        }
    }
        
    var ownsUrl = function(doc, url){
        if(doc.getUrl() === url){
            return true;
        }
        if(doc.getElementByUrl(url)){
            return true;
        }
    }

    var getOwner = function(kmlObject){
        var url = kmlObject.getUrl();
        var urlWithoutId = url.split('#')[0];
        if(cache[urlWithoutId]){
            return cache[urlWithoutId];
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
    
    that.getOwner = getOwner;
    
    var openBalloon = function(kmlObject, tree){
        $(window).unbind("message.kmlTreeIframeEvents");
        var balloon;
        var tree = tree.instance ? tree.instance : tree;
        var api = tree.api ? tree.api : getApi(tree);
        // Compare getBalloonHtmlUnsafe to getBalloonHtml to determine whether
        // there is even any need to use an iframe to display unsafe content
        var allow = api.opts.displayEnhancedContent;
        if(typeof allow === 'function'){
            allow = allow(kmlObject);
        }
        if(allow){
            // don't bother checking if not going to display
            var unsafeHtml = kmlObject.getBalloonHtmlUnsafe();
            var safeHtml = kmlObject.getBalloonHtml();
            var safeHtml = $.trim(
                safeHtml.replace(
                    /\s*<!--\s*Content-type: mhtml-die-die-die\s*-->/, ''));
            var hasUnsafeContent = safeHtml != $.trim(unsafeHtml);
        }
        if(allow && hasUnsafeContent){
            balloon = ge.createHtmlDivBalloon('');
            var iframe = document.createElement('iframe');
            iframe.setAttribute('src', api.opts.iframeSandbox);
            iframe.setAttribute('frameBorder', '0'); 
            iframe.setAttribute('id', 'kmltree-balloon-iframe');
            var div = document.createElement('div');
            $(div).append(iframe);
            $(iframe).one('load', function(){
                $(window).bind("message.kmlTreeIframeEvents", {'window': iframe.contentWindow}, function(e){
                    var ev = e.originalEvent;
                    if(ev.source === e.data.window){
                        resize(ev);                        
                    }
                });
                var msg = JSON.stringify({
                    html: Base64.encode(unsafeHtml),
                    callback: Base64.encode(
                        api.opts.sandboxedBalloonCallback.toString())
                });
                // Posting to any domain since iframe popups may have their
                // window.location changed by javascript code in the 
                // description.
                this.contentWindow.postMessage(msg, '*');
            });
            balloon.setContentDiv(div);
        }else{
            balloon = ge.createFeatureBalloon('');
            // callback for normal popups. Enhanced popup balloonopen event is 
            // triggered by resize function
            var boCallback = function(e){
                // This has to be done within a setTimeout call. Otherwise you 
                // can't open another balloon using an event listener and 
                // count on that event to fire. I think this is so you can 
                // have callbacks like balloonOpening that don't go into an 
                // infinite loop
                setTimeout(function(){
                    $(tree).trigger('balloonopen', [
                        e.getBalloon(), e.getFeature()]);
                }, 1);
                google.earth.removeEventListener(
                    ge, 'balloonopening', boCallback);
            };
            google.earth.addEventListener(ge, 'balloonopening', boCallback);
        }
        balloon.setFeature(kmlObject);
        ge.setBalloon(balloon);
    };
    
    that._openBalloon = openBalloon;
        
    function resize(e){
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
            b.getType() !== 'GEHtmlDivBalloon'){
            // and if all those conditions aren't met...
            // Oooooo... A zombie Iframe!!!
            // don't do anything, that balloon has already closed
            return;
        }
        var tree = getOwner(f);
        var dim = JSON.parse(e.data)
        if(dim.unknownIframeDimensions){
            var dim = tree.api.opts.unknownIframeDimensionsDefault;
            if(typeof dim === 'function'){
                dim = dim(f);
            }
        }
        var el = $('#kmltree-balloon-iframe');
        b.setMinWidth(dim.width);
        b.setMaxWidth(dim.width + (dim.width * .1));
        b.setMinHeight(dim.height);
        b.setMaxHeight(dim.height + (dim.height * .1));
        el.height(dim.height);
        el.width(dim.width);
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