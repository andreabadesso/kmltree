
// src/kmldom.js

// returns a jquery object that wraps the kml dom
kmldom = (function(){
    return function(kml){
        if( window.ActiveXObject && window.GetObject ) { 
            var dom = new ActiveXObject( 'Microsoft.XMLDOM' ); 
            dom.loadXML(kml); 
            return jQuery(dom);
        } 
        if( window.DOMParser ) {
            return jQuery(new DOMParser().parseFromString( kml, 'text/xml' ));
        }
        throw new Error( 'No XML parser available' );
    }
})();


