@w-lines: 2;

Map {
  background-color: #fff; //For Style guide
}

#features {
  //Style for polygon
  ['mapnik::geometry_type'=polygon] {
     line-color:black;
     polygon-fill: black;
  }

  //Style for lines
  ['mapnik::geometry_type'=linestring] {
  
    [zoom<14] {
      line-width: @w-lines*1.5;
    }
    [zoom>=14] {
      line-width: @w-lines*3;
    }
    
    line-width: @w-lines;
    line-cap:round;
  }
  
  ['mapnik::geometry_type'=point] {
    marker-width:12;
    marker-type:ellipse;
    marker-allow-overlap: true;
    marker-ignore-placement: true;
    marker-placement: point;
    marker-fill: black;
  }
}
