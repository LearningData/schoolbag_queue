function generateBarChart(){
    loginData = document.getElementById("barChartTable").getElementsByTagName("td");
    barChartArr = [];
    for(var tableElement = 0; tableElement < loginData.length; tableElement++){
        var value = parseInt(loginData[tableElement].innerHTML);

        barChartArr[tableElement] = value;
    }

    var w = 230;
    var h = 250;


    var w = w / barChartArr.length - 10;
    width = w > 180 ? w : 180;

    var barPadding = 10;

    var colorArr = d3.scale.ordinal()
        .range(["#10a236", "#dc3b42"]);

    var svg = d3.select("#svgDiv")
        .append("svg")
        .attr("width", width)
        .attr("height", h)
        .attr("position", "relative");

    var detailBox = svg.append("svg:text")
        .attr("dx", "20px")
        .attr("dy", "-5px")
        .attr("text-anchor", "right")
        .style("fill", "#1D5096")
        .style("font-weight", "bold");

    svg.selectAll("rect")
        .data(barChartArr)
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
            return i * (w / barChartArr.length - barPadding);
        })
        .attr("y", function(d){
            return h - (d / 2);
        })
        .attr("width", 40)
        .attr("height", function(d){
            return d;
        })
        .attr("fill", function(d, i) {
            return  colorArr(i);
        })
        .on("mouseover", function(d, i, j) {
            detailBox.attr("x", i * (w / barChartArr.length - barPadding))
                .attr("y", h - (d / 2))
                .text(d)
                .style("visibility", "visible");

            d3.select(this)
                .style("opacity", 0.7);
        }).on("mouseout", function() {
            detailBox.style("visibility", "hidden");

            d3.select(this)
                .style("opacity", 1.0);
        });

    var barChartLegend = d3.select("#loginLegend").append("svg")
       .attr("width", 300)
       .attr("height", w)
       .selectAll("g")
       .data(colorArr.domain().slice().reverse())
       .enter().append("g")
       .attr("transform", function(d, i) {return "translate(0," + i * 20 + ")"; });

    barChartLegend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", colorArr);

    var barLegendStr = ["Unsuccessful logins", "Successful logins"];

    barChartLegend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(function(d, i) { return barLegendStr[i]; });
}

function generatePieChart(){
    var userTypeRows = document.getElementById("userTypes").getElementsByTagName("tr");
    var labelArr = ["T", "P"];
    var typeValueArr = [0, 0];

    for(var userTypeRow = 0; userTypeRow < userTypeRows.length; userTypeRow++) {
        var userTypeLabel = String(userTypeRows[userTypeRow].getElementsByTagName("td")[0].innerHTML.trim());

        if(userTypeLabel == labelArr[0]) {
            typeValueArr[0] = Number(userTypeRows[userTypeRow].getElementsByTagName("td")[1].innerHTML.trim());
        } else if(userTypeLabel == labelArr[1]) {
            typeValueArr[1] = Number(userTypeRows[userTypeRow].getElementsByTagName("td")[1].innerHTML.trim());
        }

    }

    pieWidth = 400;
    pieHeight = 200;
    pieRadius = Math.min(pieWidth,pieHeight) / 2;

    var pieColor = d3.scale.ordinal().range(["#F7941d","#2e3192"]);

    totalSuccessfulLogins = Number(typeValueArr[0]) + Number(typeValueArr[1]);
    teacherPercentStr = ((Number(typeValueArr[0]) / totalSuccessfulLogins) * 100).toFixed();
    pupilPercentStr = ((Number(typeValueArr[1]) / totalSuccessfulLogins) * 100).toFixed();

    var pieData = [{"label":teacherPercentStr + "%","value":typeValueArr[0]},{"label":pupilPercentStr + "%","value":typeValueArr[1]}];

    var pieSvg = d3.select("#pieDiv")
        .append("svg")
        .data([pieData])
        .attr("id","pieChart")
        .attr("width",pieWidth)
        .attr("height",pieHeight)
        .append("svg:g")
        .attr("transform","translate(" + pieRadius + "," + pieRadius + ")");

    var arc = d3.svg.arc().outerRadius(pieRadius);

    var pie = d3.layout.pie() //this will create arc data for us given a list of values
        .value(function(d) { return d.value; });

    arcs = pieSvg.selectAll("g.slice")
        .data(pie)
        .enter()
        .append("svg:g")
        .attr("class","slice");

    arcs.append("svg:path")
        .attr("fill", function(d, i) { return pieColor(i); } ) //set the color for each slice to be chosen from the color function defined above
        .attr("d", arc);

    arcs.append("svg:text") //add a label to each slice
        .attr("transform", function(d) { //set the label's origin to the center of the arc
        d.innerRadius = 0;
        d.outerRadius = pieRadius;
        return "translate(" + arc.centroid(d) + ")"; //this gives us a pair of coordinates like [50, 50]
        })
        .attr("text-anchor", "middle") //center the text on it's origin
        .text(function(d, i) { if(pieData[i].value != "0"){return pieData[i].label;} });


    var pieLegend = d3.select("#typeLegend").append("svg")
        .attr("width", pieRadius * 2)
        .attr("height", pieRadius * 2)
        .selectAll("g")
         .data(pieColor.domain().slice().reverse())
        .enter().append("g")
         .attr("transform", function(d,i) {return "translate(0," + i * 20 + ")"; });

    pieLegend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", pieColor);

    legendStr = ["Students (" + typeValueArr[1] + ")", "Teachers (" + typeValueArr[0] + ")"];

    pieLegend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(function(d,i) { return legendStr[i]; });
}

function generateWeeklyLoginsChart(){
    var latestWeeksTable = document.getElementById("weeklyLogins").getElementsByTagName("td");
    var latestWeeksArr = [];

    for(var latestWeek = 0; latestWeek < latestWeeksTable.length; latestWeek++) {
        var content = latestWeeksTable[latestWeek].innerHTML.trim();
        var splittedContent = content.split("::");

        latestWeeksArr[latestWeek] = {
            "value": Number(splittedContent[1]),
            "date": splittedContent[0]
        };
    }

    d3.select("#loginChartTime")
        .selectAll("svg")
        .data(latestWeeksArr)
        .enter().append("div")
        .style("width", function(d) { return d.value / 2 + "px"; })
        .text(function(d) {
            return d.date + " (" + d.value + ")";
        });
}

function generateWeeklyUsageChart(){
    weekHomeworkArr = document.getElementById("maxWeek").getElementsByTagName("td");
    var maxWeekNum = 0;

    for(var week = 0; week < weekHomeworkArr.length; week++) {
        var weekHomeworkNum = Number(weekHomeworkArr[week].innerHTML.trim());

        if(maxWeekNum < weekHomeworkNum) {
            maxWeekNum = weekHomeworkNum;
        }
    }

    var latestWeeksTable = document.getElementById("latestWeeks").getElementsByTagName("td");
    var latestWeeksArr = [];

    for(var latestWeek = 0; latestWeek < latestWeeksTable.length; latestWeek++) {
        latestWeeksArr[latestWeek] = Number(latestWeeksTable[latestWeek].innerHTML.trim());
        console.log(latestWeeksArr);
    }

    d3.select("#barChartTime")
        .selectAll("svg")
        .attr("class","bg")
        .data(latestWeeksArr)
        .enter().append("div")
        .style("width", function(d) { return d * 5 + "px"; })
        .text(function(d) { return d; });
}

$( document ).ready(function() {
    var tables = $("#schools-statistics")[0].getElementsByTagName("table");

    $("#issuedType").click(function() {
        for (var i = tables.length - 1; i >= 0; i--) {
            tables[i].style.display = "none"
        };

        var option = $("#issuedType").val();
        $("#" + option).show();
    });

    generateBarChart();
    generatePieChart();
    generateWeeklyUsageChart();
    generateWeeklyLoginsChart();
});




