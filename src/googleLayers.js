var enableGoogleLayersControl = (function(){

    var setVisibility = function(kmlObject, toggle, ge){
        var id = kmlObject.getId();
        if(id && id.match(/^LAYER/)){
            ge.getLayerRoot().enableLayerById(ge[id], toggle);
        }else{
            var options = ge.getOptions();
            switch(id){
                case 'SUN':
                    ge.getSun().setVisibility(toggle);
                    break;
                case 'NAVIGATION_CONTROLS':
                    var vis = ge.VISIBILITY_SHOW
                    if(!toggle){
                        vis = ge.VISIBILITY_HIDE
                    }
                    ge.getNavigationControl().setVisibility(vis);
                    break;
                case 'STATUS_BAR':
                    options.setStatusBarVisibility(toggle);
                    break;
                case 'OVERVIEW_MAP':
                    options.setOverviewMapVisibility(toggle);
                    break;
                case 'SCALE_LEGEND':
                    options.setScaleLegendVisibility(toggle);
                    break;
                case 'ATMOSPHERE':
                    options.setAtmosphereVisibility(toggle);
                    break;
                case 'HISTORICAL_IMAGERY':
                    ge.getTime().setHistoricalImageryEnabled(toggle);
                    break;
                case 'GRID':
                    options.setGridVisibility(toggle);
                    break;
            }
        }
    };

    return function(tree, ge){
        if(!tree || !ge){
            alert('Must call enableGoogleLayersControl with both tree'+
                ' and ge options!');
        }
        
        $(tree).bind('toggleItem', function(e, node, toggle, kmlObject){
            setVisibility(kmlObject, toggle, ge);
        });
        
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            var list = kmlObject.getFeatures().getChildNodes();
            var length = list.getLength();
            for(var i = 0; i < length; i++){
                var item = list.item(i);
                setVisibility(item, item.getVisibility(), ge);
            }
        });
        
    }
})();