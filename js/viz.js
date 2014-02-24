//console.log("VIZ INITIALIZE");

if(typeof d3 != 'undefined'){


var modal = $( "#modal-quellen" );

modal.easyModal({
  overlayOpacity: 0.8,
  overlayColor: "#FFF",
})
.find(".close").click(function(){
  modal.trigger('closeModal');
});

$("#open-quellen").click(function(){
  modal.trigger('openModal');
  return false;
});

var transitionSpeed = 500;
var transitionDelay= 5;
var w = 600, h = 600, r = 100;
var svg = d3.select("#chartSVG")
    .attr("width", w)
    .attr("height", h);

var animation = false;
var node;
var filterPartei;
var fill = d3.scale.ordinal()
  .domain(["badgem", "badgew","politikerSRm","politikerSRw", "politikerNRm","politikerNRw", "politikerNo"])
  .range(["#777", "#A0A0A0","#a95457", "#d58a8a" ,"#4c7388", "#87a3b0", "#FFF"])
  // .domain(["badgew", "badgem","politikerSRw","politikerSRm", "politikerNRw","politikerNRm"])
  // .range(["#777", "#777","#a95457", "#a95457" ,"#4c7388", "#4c7388"])

d3.selectAll('.legende circle')
  .attr("fill",function(d){
    return fill(d3.select(this).attr("type"));
  })
  .attr("stroke", function(d){
    if(d3.select(this).attr("type")=="politikerNo"){
      return "#888";
    } else {
      return "#FFF";
    }
  })
  .attr('r', function(d){
    if(d3.select(this).attr("type")=="politikerNo"){
      return 4;
    } else {
      return 5;
    }
  })
var partei;
var mandateCount;

//console.log("VIZ RUN");


var id = function(d,i){ return d.type+d.id; };

var makeRat = function(params){

  params.startAngle += params.arcPadding;
  params.endAngle -= params.arcPadding;

  var makeSeats = function(o){
    var seats = [];
    d3.range(o.rows).forEach(function(z){
      var angleDiff = o.endAngle - o.startAngle - 2*o.padding;
      var r = o.radius +10 + o.margin + (z * o.margin);
      if(o.startFromEnd) {
        r = o.radius -10 - o.margin - (z * o.margin);
      }
      var numPerRow = Math.abs(Math.floor((angleDiff * r) / o.margin));        
      d3.range(numPerRow).forEach(function(s){
        var angle =  o.padding + o.startAngle + ((s+0.5)/numPerRow) * angleDiff;
        var x = Math.sin(angle)*r ;
        var y = -Math.cos(angle)*r ;
        seats.push({x:x,y:y});
      });
    });
    return seats;
  }

  
  var arcPartei = d3.svg.arc()
      .innerRadius(params.centerRadius-15)
      .outerRadius(params.centerRadius+15)

  var pie = d3.layout.pie()
      .value(function(d,i) { return d.politiker.length+ params.fillup; })
      .sort(null)
      .startAngle(params.startAngle)
      .endAngle(params.endAngle)

  var pieData = pie(params.data);

  var container = params.svg.append("g").attr('class', params.name);

  var arcs = container.selectAll(".arc")
    .data(pieData)
      .enter().append("g")
        .attr("class", "arc")

  arcs.append("path")
    .attr("d", arcPartei)
    .attr("class", "partei")

  arcs.each(function(d,i){
    //console.log(d)

    d.data.politikerSeats = makeSeats({
      startAngle: d.startAngle,
      endAngle: d.endAngle,
      radius:params.centerRadius,
      rows: 10,
      padding: params.padding,
      margin: params.margin,
      startFromEnd:false
    });

    d.data.badgeSeats = makeSeats({
      startAngle: d.startAngle,
      endAngle: d.endAngle,
      radius:params.centerRadius,
      rows: 12,
      padding: params.padding,
      margin: params.margin,
      startFromEnd:true
    });

   });

  arcs
    .append("g")
    .selectAll(".politiker")
    .data(function(d){ return d.data.politiker; }) 
      .enter()
        .append("circle")
        .classed('politiker',true)


  arcs
    .append("g")
    .selectAll(".badges")
    .data(function(d){ return d.data.badges; }) 
      .enter()
        .append("circle")
        .classed('badges',true)


  arcs.append("text")
    .attr("transform", function(d) {
       d.centroid = arcPartei.centroid(d);
        var c = d.centroid,
            x = c[0],
            y = c[1],
            angle = Math.atan2(y,x)*180/Math.PI+90 + params.labelOrientation,
            // pythagorean theorem for hypotenuse
            h = Math.sqrt(x*x + y*y);
        return "translate(" + (x/h * params.labelRadius) +  ',' +
           (y/h * params.labelRadius) +  ") rotate("+ angle +")"; 
    })
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .text(function(d, i) { return d.data.key; });



  return {
    arcPartei:arcPartei,
    arcs:arcs,
    pieData:pieData
  }

}



function ready (error,politiker,badges,network,auswahl) {

  //console.log("load",error,politiker,badges,network,auswahl)
  $("#loading").fadeOut();
  // console.log(politiker,badges,kategorien);

  politiker = politiker.filter(function(d){ return (d.status !="alt") });
  //badges = badges.filter(function(d){ return (d.status !="alt") });
  badges = badges.filter(function(d){
    return (d.status !="alt")
  });
  network = network.filter(function(d){ return d.badge_id != ""});
  mandateCount = d3.nest()
    .key(function(d) { return d.kategorie })
    .rollup(function(g) {
      return d3.set(g.map(function(d){ return d.badge_id })).values().length
    })
    .map(network)
  mandateCount["Alle"] = d3.sum(d3.values(mandateCount));

  politiker.forEach(function(d){
    d.partei = d.parteiZuordnung;
    d.badges = badges.filter(function(badge){ return d.id == badge.badgegeber_id; });
    d.active = 3;
    d.type = "politiker";
    d.name = d.vorname + " " + d.nachname;
  });


  //network = network.filter(function(d){ return d.id != ""});

  var mandates = d3.nest()
    .key(function(d) { return d.name; })
    .entries(network)
    .sort(function(a,b){
      return b.values.length - a.values.length;
    });

  mandates
    .forEach(function(d,i){
      d.type = "mandat";
      d.id = i;
      d.name = d.key;
      d.values = d.values.map(function(e){
        return badges
          //.filter(function(f){ return e.infocube_id_person == f.infocube_id;
            .filter(function(f){ return e.badge_id == f.badge_id;
        })[0];
      });
    })

  //console.log("network",mandates);

  var badgeFunktionenLookup = d3.nest()
    .key(function(d) { return d.badge_id })
    .rollup(function(g) {
      return d3.set(g.map(function(d){ return d.kategorie }))
    })
    .map(network)

  badges.forEach(function(d,i){

    if(d.deklarierte_funktion == "0.0"){
      d.deklarierte_funktion = "keine Angabe";
    }
    d.funktionKurz = d.deklarierte_funktion.slice(0,20);
    d.politiker = politiker.filter(function(pol){ return pol.id == d.badgegeber_id; })[0];
    //if(!d.politiker) console.log("kein politiker für",d)
    d.partei = d.politiker.partei;
    d.farbe = d.politiker.farbe;
    d.rat = d.politiker.rat;
    //d.kategorie = kategorien.filter(function(k){ return d.kategorie == k.id; })[0].kategorie;
    d.kategorie = d.kategorieNEU;
    if (badgeFunktionenLookup.hasOwnProperty(d.badge_id)) {
      badgeFunktionenLookup[d.badge_id].add(d.kategorie);
      d.aktiveKategorien = badgeFunktionenLookup[d.badge_id];
    } else {
      d.aktiveKategorien = d3.set([d.kategorie]);
    }
    d.type = "badge";
    d.active = 4;
    d.id = i;
    d.mandates = network.filter(function(e){ return e.badge_id == d.badge_id})
      .map(function(d){ return mandates.filter(function(e){ return e.key == d.name; })[0]});

    //d.mandates = _.uniq(d.mandates.map(function(d){ d.name; }));
  });

  // badges = badges.filter(function(d){
  //   return d.mandates.length!=0;
  // });

  // politiker = politiker.filter(function(d){
  //   return _.flatten(d.badges.map(function(d){ return d.mandates; })).length!=0;
  // });
  
  var nationalratSort = ["SVP","SP","FDP","CVP","GP","GLP","BDP","EVP","LEG","CSP","MCR"];
  var standeratSort = [" ","GP","BDP","GLP","SVP","FDP","SP","CVP"];

  var nationalrat = d3.nest()
    .key(function(d) { return d.partei; })
    .entries(politiker.filter(function(d){ return d.rat == "NR" }));

  // nationalrat.forEach(function (d) {
  //   console.log(_.indexOf(nationalratSort,d.key),d.key)
  // })

  // var nationalratOver = nationalrat.filter(function(d){ return d.values.length<=1 });
  //nationalrat = nationalrat.filter(function(d){ return d.values.length>1 });
  // console.log(nationalratOver);

  nationalrat.sort(function(a,b){
    return _.indexOf(nationalratSort,a.key) - _.indexOf(nationalratSort,b.key);
  });
  //console.log("nationalrat",nationalrat)
  //move(nationalrat,7,4); // 7 = PPD, soll neben CVP stehen
  
  nationalrat.forEach(function(n){
    n.politiker = n.values;
    n.badges = badges.filter(function(b){ return (n.key == b.partei && b.rat == "NR") })
  });

  var standerat = d3.nest()
    .key(function(d) { return d.partei; })
    .entries(politiker.filter(function(d){ return d.rat == "SR" }));
  //standerat = standerat.filter(function(d){ return d.values.length>1 });

  // standerat.forEach(function (d) {
  //   console.log(_.indexOf(standeratSort,d.key),d.key)
  // })
  standerat.sort(function(a,b){
    return _.indexOf(standeratSort,a.key) - _.indexOf(standeratSort,b.key);
  });
  //move(standerat,5,6); // 5 = GP, soll neben LES stehen
  standerat.forEach(function(n){
    n.politiker = n.values;
    n.badges = badges.filter(function(b){ return (n.key == b.partei && b.rat == "SR") })
  });


  var personen = [].concat(badges).concat(politiker).sort(function(a,b){ return d3.ascending(a.name, b.name)});

  personen.forEach(function(d){
    //if(d.id=="") console.log(d);
  })

  //console.log(politiker[0],badges[0]);
  
  var centerPos = {left:w/2 ,top:h/2};
  var circleSvg = svg.append("g")
      .attr("transform", "translate(" + centerPos.left + "," + centerPos.top  + ")")
      .attr("class","rat")

  var linkSvg = circleSvg.append('g').classed("links",true);
  var mandatesSvg = circleSvg.append('g').classed('mandates',true);
  
  var nationalratPie = makeRat({
    name: "Nationalrat",
    innerRadius: 150,
    centerRadius: 220,
    outerRadius: 350,
    labelRadius: 220,

    labelOrientation: 0,
    arcPadding:0.05,
    startAngle: -Math.PI*0.75,
    endAngle: Math.PI*0.75,

    margin: 12,
    padding: 0.02,
    data: nationalrat,
    svg: circleSvg,
    fillup:6
  });

  var srPie = makeRat({
    name: "Ständerat",
    innerRadius: 150,
    centerRadius: 220,
    outerRadius: 350,
    labelRadius: 220,

    labelOrientation: 180,
    arcPadding:0.05,
    startAngle: Math.PI*0.72,
    endAngle: Math.PI*1.28,

    margin: 12,
    padding: 0.02,
    data: standerat,
    svg: circleSvg,
    fillup:8
  });

  var circles = circleSvg.selectAll('circle');

  var makeInfo = function(d){

    makeMandatesList(d);

    if(d.type=="mandat") return false;

    var politiker = (d.type=="badge" ? d.politiker : d);

    politiker.badges.forEach(function(d) { d.sortInfo = 0; });
    if(d.type == "badge") d.sortInfo = 1;
    politiker.badges.sort(function(a,b){ return a.sortInfo<b.sortInfo; });

    var pDiv = d3.select('#info .politiker').datum(politiker);
    pDiv.select('.face')
      .style("background",function(d){ return fill(d.type+d.rat+d.geschlecht) })
    pDiv.select('h1').text(function(d){ return d.vorname + " " + d.nachname; })
    pDiv.select('.description').text(function(d){
      return politiker.partei + ", "
        + politiker.kanton + ", "
        + politiker.rat;
    });

    //politiker.badges.sort(function(a,b){ return a.active<b.active ?1:-1; })

    var selection = d3.selectAll('#info .badge').data(politiker.badges);
    selection
      .style("opacity",function(d){ return d.active>=4 ? 1 : 0.1; })
    selection.select('h1')
      .text(function(d){ return d.name; });
    selection.select('.description')
      .text(function(d){ return d.deklarierte_funktion });
    selection.select('.face')
      .style("background",function(d){ return fill(d.type+d.geschlecht) })

    selection.exit().style("opacity",0)

  }

  var makeMandatesList = function(d){
    //console.log("makeMandatesList", d);

    if(d.type == "mandat") {
      //d = d.values.filter(function(d) { return d.active>=4; })[0];
    }

    if(d.mandates && d.mandates.length > 0) {

      $('.info .mandates').show();

      var mandatesUniq = _.uniq(d.mandates.map(function(d) { return d.name; }));
      // todo : in der generierung schon die doppelten rausschmeissen!!

      var s = d3.select('#listMandates').selectAll("li").data(mandatesUniq);

      s.exit().remove();

      s.enter()
        .append("li")
        .text(function(d){
          return d;
        });

      s
        .text(function(d){
          return d;
        });

    } else {
      $('.info .mandates').hide();
    }
    //d3.select('#listMandates').text(mandates.join(", "));
  
  }



   var kategorien = d3.nest()
     .key(function(d) { return d.kategorie; })
     .entries(badges)
     .sort(function(a,b) { return b.values.length - a.values.length })
     .map(function(d){
        d.field = "kategorie";
        d.subkat = d3.nest()
         .key(function(d) { return d.deklarierte_funktion; })
         .entries(d.values)
         .sort(function(a,b) { return b.values.length - a.values.length })
         .map(function(d){
          d.field = "deklarierte_funktion";
          return d;
         });
         //console.log(d)
        //d.subkat.unshift({ key: "Alle", values: d.values });
        return d;
     })

  kategorien.unshift({ key: "Alle", field: "kategorie", values: badges, subkat: [] });

  kategorien
    .filter(function(d){ return (
      d.key == "Gast" ||
      d.key == "Persönlicher Mitarbeiter")
    })
    .forEach(function(d){ d.subkat = []; })


  var makeFunktionen = function(){

    //console.log("make funktionen",kategorien)

    d3.select('#funktionen select')
      .selectAll('.options')
      .data(kategorien)
      .enter()
        .append('optgroup')
        .classed('options',true)
        .attr('value',function(d){ return d.key; })
        .attr('label', function(d){ return d.key; })
        .each(function(d){
          //console.log(d.subkat);
          d3.select(this)
            .selectAll('option')
            .data(d.subkat)
              .enter()
              .append('option')
              .classed('options',true)
              .attr('value',function(d){ return d.key; })
              .text(function(d){ return d.key; })
        })

    $("#funktionen select").chosen({
      disable_search_threshold: 10,
      no_results_text: "Leider nicht gefunden!",
      allow_single_deselect: true
    }).change(function(){

      var name = $( "option:selected", this).attr('value');
      if(name){
        resetGraph();
        filterKatergorie(name,"deklarierte_funktion");
      } else {
        resetGraph();
        filterKatergorie("Alle");
      }
      
    })
  }
  var makeAuswahl = function(){
    //console.log("makeAuswahl", auswahl)
    d3.select('#auswahl select')
      .selectAll('.options')
      .data(auswahl)
      .enter()
        .append('option')
        .classed('options',true)
        .attr('value',function(d){ return d.name; })
        .text(function(d){ return d.name; })

    $("#auswahl select").chosen({
      disable_search_threshold: 10,
      no_results_text: "Leider nicht gefunden!",
      allow_single_deselect: true
    }).change(function(){
      var name = $( "option:selected", this).attr('value');
      var selected = personen.filter(function(d){ return d.name == name })[0];

      if(selected){
        networkActive = false;
        resetGraph();
        mouseover(selected);
        mouseclick(selected);
      } else {
        resetGraph();
        filterKatergorie("Alle");
      }

    }).on("chosen:showing_dropdown focus",function(){
      resetGraph();
      filterKatergorie("Alle");
    })
  }

  var makeSearch = function(){
    //console.log("makeSearch", personen)
    d3.select('#search select')
      .selectAll('.options')
      .data(personen)
      .enter()
        .append('option')
        .classed('options',true)
        .attr('value',function(d){ return d.name; })
        .text(function(d){ return d.name; })

    $("#search select").chosen({
      disable_search_threshold: 10,
      no_results_text: "Leider nicht gefunden!",
      allow_single_deselect: true
    }).change(function(){
      var name = $( "option:selected", this).attr('value');
      var selected = personen.filter(function(d){ return d.name == name })[0];

      if(selected){
        networkActive = false;
        resetGraph();
        mouseover(selected);
        mouseclick(selected);
      } else {
        resetGraph();
        filterKatergorie("Alle");
      }

    }).on("chosen:showing_dropdown focus",function(){
      resetGraph();
      filterKatergorie("Alle");
    })
  }
  var searchActive = false;

  function makeKategorien(){
    var makeRow = function(d,i){
      var elm = d3.select(this).append("div").classed("row",true)
      elm
        .append('span')
        .text(function(d){ return d.key; })
      elm
        .append('span')
        .text(function(d){ return d.values.length; })
        //.text(function(d){ return d.values.filter(function(k){ return k.geschlecht == "w";}).length; })
      elm
        .append('span')
        .text(function(d){
           if (mandateCount.hasOwnProperty(d.key)) {
             return d.values.length + mandateCount[d.key];
           } else {
             return "–";
           }
         })

        //.text(function(d){ return d.values.filter(function(k){ return k.geschlecht == "m";}).length; })
      elm
        .on('click',function(d){
    
          d3.selectAll(".katlist .active").classed("active",false);
          d3.select(this).classed("active",true);
          resetGraph();
          filterKatergorie(d.key,d.field);
        })
        .classed("active",function(d) { return i==0 ? true : false; })
    };

    var kategorienDiv = d3.select(".katlist")
      .selectAll(".elem").data(kategorien)
        .enter()
          .append("li")
          .classed("elem",true)
          .on('click',function(d){
            $("select")
              .val("")
              .trigger('chosen:updated');
            
            // d3.select(".katlist .open").classed("open",false);
            // d3.select(this).classed("open",true);
          })
          .each(makeRow)
          .append("ul")

    var subDiv = kategorienDiv
      .selectAll('li')
        .data(function(d){ return d.subkat; })
        .enter()
        .append('li')
        .each(makeRow)
  }
  //makeKategorien();

      
  
  var sortBadges = function(d,key,val){
    d.data.badges.forEach(function(d){
      if(d[key]==val || val=="" || val=="Alle" || (val=="network" && d.mandates.length != 0)) {
        d.active = 4;
      } else if (key == "kategorie" && d.aktiveKategorien.has && d.aktiveKategorien.has(val)) {
        d.active = 4;
      } else {
        d.active = 1;
      }
      if(d.geschlecht=="m") d.active += 0.1;
    })
    d.data.badges.sort(function(a,b){
      return a.active<b.active ? 1:-1;
    });
    // if(val=="" || val=="Alle"){
    //   d.data.badges.sort(function(a,b){
    //     return a.geschlecht<b.geschlecht ?1:-1;
    //   });
    // }

    d.data.badges.forEach(function(e,i){
      e.x = e.px = d.data.badgeSeats[i].x;
      e.y = e.py= d.data.badgeSeats[i].y
    });
    return d.data.badges;
  }

  var sortPolitiker = function(d,key,val){
    d.data.politiker.forEach(function(d){

      d.active = 1;
      d.badges.forEach(function(a){ if(a.active>=4) d.active=4; });
      if(d.geschlecht=="m") d.active+=0.1;
      
    })
    d.data.politiker.sort(function(a,b){
      return a.active<b.active ?1:-1;
    });

    d.data.politiker.forEach(function(e,i){
      e.x = e.px= d.data.politikerSeats[i].x;
      e.y = e.py= d.data.politikerSeats[i].y;

      if(val=="Alle") e.active=4;
    });
    return d.data.politiker;
  }

  var allPolitiker = function(d){
    d.data.politiker.forEach(function(d){
      d.active = 4;
      if(d.geschlecht=="m") d.active+=0.1;
    })
    d.data.politiker.sort(function(a,b){
      return a.active<b.active ? 1:-1;
    });

    d.data.politiker.forEach(function(e,i){
      e.x = e.px = d.data.politikerSeats[i].x;
      e.y = e.py = d.data.politikerSeats[i].y
    });
    return d.data.politiker;
  }

  var filterKatergorie = function(val, key, callback){

    circleSvg.selectAll('.arc').each(function(segment,ii){

      d3.select(this).selectAll(".badges")
        .data(sortBadges(segment,key,val))

      d3.select(this).selectAll(".politiker")
        .data(sortPolitiker(segment,key,val))

      d3.select(this).selectAll('circle')
        .classed("hover", function(d){ return d.active >= 4; })
        .transition()
        .duration(transitionSpeed)
        .delay(function(d,i){ return i*transitionDelay; })
        .attr('cx',function(d,i){ return d.x; })
        .attr('cy',function(d,i){ return d.y; })
        .call(setStyle)
        //.style("opacity",function(d){ return d.geschlecht=="w" ? 0.4 : 1; })
        

    });

    updateVoronoi();
  }

  var setStyle = function(elm){
    elm
      .attr("r",function(d){ 
        if(d.type == "politiker" && d.badges.length == 0  && d.active >= 4){
          return 4;
        } else {
          return d.active;
        }
      })
      .attr("stroke-width", function(d){
        if(d.type == "politiker" && d.badges.length == 0  && d.active >= 4){
          return 1;
        } else {
          return 0;
        }
      })
      .attr("fill", function(d){
          if(d.type == "politiker" && d.badges.length == 0  && d.active >= 4){
            return "#FFF";
          } else if (d.type == "badge") {
            return fill(d.type+d.geschlecht);
          } else {
            return fill(d.type+d.rat+d.geschlecht);
          }
          //return d.type=="badge" ? fill(d.type+d.geschlecht) : fill(d.type+d.rat+d.geschlecht);
      })
      .attr("stroke", function(d){
          if(d.type == "politiker" && d.badges.length == 0){
            return fill(d.type+d.rat+d.geschlecht);
          } else {
            return "#FFF";
          }
      })
  }

  var showPolitiker = function(){

    circleSvg.selectAll('.arc').each(function(segment,ii){

      d3.select(this).selectAll(".politiker")
        .data(allPolitiker(segment))
        .classed("hover", true)
        .transition()
        .duration(transitionSpeed)
        .delay(function(d,i){ return i*transitionDelay; })
        .attr('cx',function(d,i){ return d.x; })
        .attr('cy',function(d,i){ return d.y; })
        //.attr("r",function(d){ return d.active; })
        //.style("opacity",function(d){ return d.geschlecht=="w" ? 0.4 : 1; })
        //.attr("fill", function(d){ 
        //  return d.type=="badge" ? fill(d.type+d.geschlecht) : fill(d.type+d.rat+d.geschlecht);
        //})
        .call(setStyle)
      });

    
  }

  var makeForce = function(){
    var nodes = circleSvg.selectAll('.badges');

    badges.forEach(function(d, i) {
        d.x = Math.random() * 300 - 150;
        d.y = Math.random() * 300 - 150;
    });

    force
      .nodes(badges)
      .on("tick", function(){
        nodes
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
      })
      .charge(-10)

    force.start();
     for (var i = 50; i > 0; --i) force.tick();
    force.stop();

    nodes
      .classed("hover",true)
      .attr("r",function(d){ return 0; })
      .transition()
      .duration(transitionSpeed)
      .attr("r",function(d){ return 4; })
      //.style("opacity",function(d){ return d.geschlecht=="w" ? 0.4 : 1; })
      .attr("fill", function(d){ 
        return d.type=="badge" ? fill(d.type+d.geschlecht) : fill(d.type+d.rat+d.geschlecht);
      })


  }

  var voronoi = d3.geom.voronoi()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .clipExtent([[-0.5*w, -0.5*h], [0.5*w, 0.5*h]])
  

  var voronoiSvg = circleSvg.append("g").classed('voronoi',true);
  var labelSvg = circleSvg.append("g").classed('label',true);



  var updateVoronoi = function(){

    var data = circleSvg.selectAll('circle').filter(".hover").data();

    //console.log(data)

    voronoi(data).map(d3.geom.polygon).forEach(function(d) { d.point.cell = d; });
    
    voronoiSvg.selectAll("g").data([]).exit().remove();

    var cell = voronoiSvg
      .selectAll("g")
      .data(data, id)
        .enter()
        .append("g")

    cell.append("path")
        .attr("class", "cell-border")
        .attr("d", function(d) { return d.cell.length ? "M" + d.cell.join("L") + "Z" : null; })
        .on('mouseover', mouseover)
        .on('mouseout', mouseout)
        .on('click', mouseclick)
  };

  var tooltip = function(){
    var svg = circleSvg.append('g').classed("stooltip", true),
    container = svg.append("g").attr("class", "stooltip").style("display", "none"),
    path = container.append("path"),
    text = container.append("text").attr("dy", ".35em").attr("x", 10);

    this.display = function(d){
      var a = d.x > 0;
      container.style("display", null)
      .attr("transform", "translate(" + (a ? d.x - 4 : d.x + 4) + "," + d.y +  ")rotate("+ (a ? 5 : -5) +")")
      .interrupt()
      .transition()
      .ease("elastic")
      .attr("transform", "translate(" + (a ? d.x - 4 : d.x + 4) + "," + d.y + ")rotate(0)")


      text.style("text-anchor", a ? "end" : "start")
      .attr("x", a ? -10 : 10)
      .text(d.name.trunc(60))
      .style("font-weight", "700")
      .append("tspan")
      .style("font-weight", "500")
      .text(function(){
        return d.deklarierte_funktion ? " " + d.deklarierte_funktion.trunc(60) : "";
      });

     var n = text.node().getComputedTextLength() + 5;
     path
      .attr("d", a ? "M0,0l-10,-10h" + -n + "v20h" + n + "z" : "M0,0l10,-10h" + n + "v20h-" + n + "z")
      // .on("mouseover",function(d){
      //   if(d.type=="mandat"){
      //     text.select("tspan")
      //     .text(function(){
      //       return d.deklarierte_funktion ? " " + d.deklarierte_funktion : "";
      //     });
      //   }
      //})
    }
    this.hide = function(){
      container.style("display", "none");  
    }

    return this;
  }

  var myTooltip = tooltip();

  
  function mouseover(d){

    $("#info").css({ opacity: 1 });

    myTooltip.display(d);
    makeInfo(d);
    //console.log(d)

    if(!networkActive){
      if(showNetworks) makeNetwork(d);
      else makeLink(d);
    }
  
  }

  function mouseout(d){
    if(!networkActive) resetGraph();
  }


  function mouseclick(d){
    networkActive = !networkActive;
    
    if(!networkActive){
      resetGraph();
      circles
        .classed("hover", function(d){ return d.active >= 4; })
        .transition()
        .duration(200)
        .attr("r",function(d){ return d.active; })
    } else {
      circles
        .filter(":not(.hover)")
        .transition()
        .duration(200)
        .attr("r", 1)
    }

    if(searchActive) {
      $("select").val("").trigger('chosen:updated');
      searchActive = false;
    }
    updateVoronoi();
  }

  var resetGraph = function(){
    //console.log("reset");

    networkActive=false;

    linkSvg.selectAll(".link").remove();
    mandatesSvg.selectAll("circle").remove();

    circleSvg.selectAll(".hover")
      .classed("hover", false)
      .call(setStyle)
      // .attr("r",function(d){ return d.active; })
      // .attr("stroke", "none")
      
    myTooltip.hide();
  }


  var showNetworks = false;
  var networkActive = false;

  var diagonal = d3.svg.diagonal();

  var diagonalData = function(d){
      return diagonal({ 
        source: {x:d.source.x, y:d.source.y},
        target: {x:d.target.x, y:d.target.y}
      });
  }


  function getMandates(badges){
    return _.chain(badges)
      .map(function(d) { return d.mandates; })
      .flatten()
      .uniq()
      .value();
  }

  function getMandatesFast(badges){
    return _.chain(badges)
      .map(function(d) { return d.mandates; })
      .flatten()
      .uniq()
      .map(function(d) { return d.values; })
      .flatten()
      .uniq()
      .map(function(d) { return d.mandates; })
      .flatten()
      .uniq()
      .value();
  }

  function getPersonsForMandates(mandates){
    return _.chain(mandates)
    .map(function(d) { return d.values; })
    .flatten()
    .uniq()
    .map(function(d) { return [d.politiker].concat(d.politiker.badges) })
    .flatten()
    .uniq()
    .value()
  }

  function getBadges(mandates){
    return _.chain(mandates)
      .map(function(d) { return d.values; })
      .flatten()
      .uniq()
      .value();
  }

  var force = d3.layout.force()
             //.size([300, 300])
             
             // .linkDistance(function(d){
             //    return d.type=="center" ? 0 : 20;
             // });
  
  var getPolitiker = function(d){ return d.type == "politiker" ? d : d.politiker; };

  var makeLink = function(d){
    //console.log("makeLink",d);

    var politiker = getPolitiker(d);
    var personen = [politiker].concat(politiker.badges);

    circles.data(personen, id)
      .attr('r',8)
      .attr('stroke-width',2)
      .attr('stroke',function(d){
        return (d.type == "politiker" && d.badges.length == 0) ? fill(d.type+d.rat+d.geschlecht) : "#EEE";
      })
      .attr('opacity',1)
      .classed('hover',true);

    // s.exit()
    //   .classed('hover',false)
    //   .attr('r',function(d){ return d.active; })
    //   .attr('stroke','none');

    var links = politiker.badges.map(function(b){
      return { source: politiker, target: b } 
    });

    linkSvg.selectAll(".link").data(links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", diagonal);

    // s.exit().remove();
    // s.attr("d", diagonal);

  }


  var makeNetwork = function(d){
    //console.log("makeNetwork",d);

    var source = d.type == "badge" ? [d] : d.badges;

    var mandates = getMandates(source);
    var personen = getPersonsForMandates(mandates);

    //console.log("makeMandates",source,mandates,personen);

    if(mandates.length==0){
      // shortcut
      makeLink(d);
      return true;
    }
  
    var links = [];
    var nodes = [];

    mandates
      .forEach(function(d){
        d.values.forEach(function(b){
          links.push({ 
            source: d,
            target: b,
            type:"mandat",
            weight: d.values.length
          });
        })
        d.x = 0;
        d.y = 0;
      });

    personen
      .filter(function(d){ return d.type=="politiker"; })
      .forEach(function(d){
        d.badges.forEach(function(b){
          links.push({ 
            source: d,
            target: b
          });
        })
      })

    nodes = [].concat(personen).concat(mandates);

    mandatesSvg
      .selectAll("circle")
      .data(mandates)
        .enter()
        .append("circle")
        .attr("r",4)
        .attr('opacity',function(d){
          return d.values.length == 1 ? 0.2 : 1;
        })
        .classed("hover",true)

    linkSvg.selectAll(".link")
      .data(links)
      .enter()
        .append("path")
        .attr("class", "link")
        .style("opacity",function(d){
          var o=1;
          if(d.type =="mandat" && d.weight == 1){
            o=0.2;
          }
          if(d.type=="center"){
            o=0;
          }
          return o;
        })

    var s = circles.data(personen, id)

    s
      .attr('r',8)
      .attr('stroke-width',2)
      .attr('stroke','#EEE')
      .attr('opacity',1)
      .classed('hover',true);

    // s.exit()
    //   .classed('hover',false)
    //   .attr('r',function(d){
    //     return d.active;
    //   })
    //   .attr('stroke','none');

    var node = circleSvg.selectAll(".hover");
    var link = linkSvg.selectAll(".link");

    force
      .stop()
      .charge(-300)
      .gravity(1.4)
      .nodes(nodes)
      .links(links)
      .on("tick", function(d){
        node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })

        link
          .attr("d", diagonalData)
      })
      //.start();
      
    force.start();
      for (var i = 10; i > 0; --i) force.tick();
    // force.stop();

    //updateVoronoi();
        
  }

  var pack = d3.layout.pack()
    .sort(null)
    .size([200,200])
    .value(function(d) { return 5; })
    .padding(15);

  var makeMandates = function(data){
    //console.log("makeMandates",data);

    var dd = data.mandates.map(function(d){ return { name: d.key };});

    //console.log(dd)

    mandatesSvg.selectAll("circle").data([]).exit().remove();

    mandatesSvg
      .selectAll("circle")
      .data(pack.nodes({children: dd}).slice(1))
        .enter()
        .append("circle")
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r",4)

  }

  //filterKatergorie('network');
  //filterNetwork()
  //
  
  

  var step = {
    now:0,
    next:function(){
      this.steps[this.now]();
      if(this.now<=this.steps.length) this.now++;
    },
    steps: [
      function(){

        $('#stepper').hide();
        $('.intro-show').hide();

        resetGraph();
        filterKatergorie('Alle');

        setTimeout(function(){

          $('.intro-hide').fadeIn();

          makeFunktionen();
          makeSearch(); 
          makeAuswahl();
          makeKategorien();

          // release the kraken
          personen.forEach(function(d){ d.fixed = true; });
          showNetworks=true;

        },1000);

      },
      function(){
        $('.intro-hide').show();

        resetGraph();

        personen.forEach(function(d){ d.fixed = true; });
        showNetworks=true;

      }
    ]
  };

  // $('.intro-hide').show();
  //$('#network').hide();

  showPolitiker();
  makeForce();
  updateVoronoi();

  // makeFunktionen();
  // makeSearch(); 

  //step.steps[0]();
  

  // setTimeout(function(){
  //   step.steps[1]();
  // }, 2000)
  

  $('#stepper').click(function(){
    step.next();
    return false;
  });

  // $("#network input[type=checkbox]").switchButton({
  //   show_labels: false,
  //   labels_placement: "right",
  //   on_label: "An" ,
  //   off_label: "Aus" 
  // })
  // .change(function(){
  //   if($(this).is(':checked')){
  //     resetGraph();
  //     filterKatergorie('Alle');
  //     personen.forEach(function(d){ d.fixed = true; });
  //     showNetworks=true;
  //     $("#auswahl select").attr('disabled', false).trigger("chosen:updated");
  //   } else {
  //     showNetworks=false;
  //     resetGraph();
  //     filterKatergorie('Alle');
  //     $("#auswahl select").attr('disabled', true).trigger("chosen:updated");
  //   }
  // });

}

  queue()
  .defer(d3.csv, 'data/politiker.csv')
  .defer(d3.csv, 'data/badges.csv')
  .defer(d3.csv, 'data/network.csv')
  .defer(d3.csv, 'data/auswahl.csv')
  .await(ready)

} else {
  $('#noSupport').show();
  $('#vizContainer, #modal-quellen').hide();
}


// helper funcs

String.prototype.trunc =
     function(n,useWordBoundary){
         var toLong = this.length>n,
             s_ = toLong ? this.substr(0,n-1) : this;
         s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
         return  toLong ? s_ + '...' : s_;
      };

// Array.prototype.move = function (old_index, new_index) {
//     if (new_index >= this.length) {
//         var k = new_index - this.length;
//         while ((k--) + 1) {
//             this.push(undefined);
//         }
//     }
//     this.splice(new_index, 0, this.splice(old_index, 1)[0]);
//     return this; // for testing purposes
// };

function move(array, from, to) {
  if( to === from ) return;

  var target = array[from];                         
  var increment = to < from ? -1 : 1;

  for(var k = from; k != to; k += increment){
    array[k] = array[k + increment];
  }
  array[to] = target;
}
