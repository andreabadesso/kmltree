openBalloon = function(kmlObject, ge, whitelisted){
    if(!kmlObject.getVisibility()){
        kmlObject.setVisibility(true);
    }
    var b = ge.createFeatureBalloon('');
    b.setFeature(kmlObject);
    b.setMinWidth(100);
    ge.setBalloon(b);
}