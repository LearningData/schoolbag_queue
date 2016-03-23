var charts = (function() {
    function drawBarCharts(bar) {
        var data = bar.data
        $('#barDiv_' + bar.id).empty()
        var width = $('#barDiv_' + bar.id).width()
        var scale = d3.scale.linear().range([0, width])
        var svg = d3.select('#barDiv_' + bar.id)
            .append('svg')
            .attr('width', width)
            .attr('height', bar.height)
        svg.selectAll("rect")
            .data(data)
          .enter().append("rect")
            .attr("width", function(d, i) { return scale(data[i].width)})
            .attr("x", function(d, i) { return scale(data[i].x)})
            .attr("height", bar.height)
            .style("fill", function(d, i) { return data[i].fill})
            .attr('cursor', 'pointer')
            .on('click', function(event){openDataModel(event.target)})

        svg.selectAll("text")
            .data(data)
          .enter().append("svg:text") //add a label to each slice
            .attr("transform", function(d) {
            return "translate(" + (scale(d.x + (d.width/2))) + "," + (bar.height + 10)/2 + ")";
        })
        .attr("text-anchor", "middle")
        .text(function(d, i) { if (d.value && d.value > 0) {return d.label}})
        .each(function (d, i) { //get border box and check if inside rect
            var box = this.getBBox();
            var rectBox = svg.selectAll("rect")[0][i].getBBox()
            d.visible = textIsInRect(box, rectBox)
        })
        .attr('cursor', 'pointer')
        .attr('fill', '#fff')
        //.attr('font-size', fontSize)
        .attr('display', function (d) { return d.visible ? null : "none"; })
        .on('click', function(event){openDataModel(event.target)});
    }
    function genearateHWStatusClass() {
        var bars = []
        //var total = $('#hw-classes').attr('data-total')
        var max = 0
        //var width = 
        //var data = []
        $('.hw-class-stats')
            .sort(
            function(a,b){
                return  b.getAttribute('data-total') - a.getAttribute('data-total')
            })
            .each(function(index, element){
                var chartItem = {}
                chartItem.id = element.getAttribute('data-id')
                chartItem.height = 50
                var classTotal = Number(element.getAttribute('data-total'))
                max =  classTotal > max ? classTotal : max
                //reordering elements push each one to end of list based on sort.
                $(element).parent().append(element)
                
                var data = [{
                    'width': 1,
                    'fill': '#e6e7e9',
                    'x': 0
                }]
                var stats = $(element).find('.value')
                var x = 0
                for (var i = 0; i < stats.length; i++) {
                    var value = Number($(stats[i]).text().trim())
                    var elementWidth = (classTotal/max) * (value/100)
                    data.push({
                        'title': $(stats[i]).attr('data-label'),
                        'label': value + "%",
                        'value': value,
                        'width': elementWidth,
                        'x': x,
                        'fill': $(stats[i]).attr('data-color'),
                        'target' : $(stats[i]).attr('data-target')
                    })
                    x += elementWidth
                }
                chartItem.data = data
                chartItem.draw = function(){ drawBarCharts(chartItem)}
                bars.push(chartItem)
                $(window).on("resize", chartItem.draw);
            })
        return bars
    }
    
    function pointIsInArc(pt, ptData, arc) {
        /*this tip is from:
            http://musicallyut.blogspot.ie/2013/11/hide-overflowing-labels-on-pie-charts.html
        */
        //check if text border points are inside arc, using inner and outer radius
        // Center of the arc is at 0,0
        // (pt.x, pt.y) are assumed to be relative to the center
        var theta1 = arc.startAngle()(ptData),
            theta2 = arc.endAngle()(ptData);
        var angle = Math.atan2(pt.x, -pt.y);
        angle = (angle < 0) ? (angle + Math.PI * 2) : angle;
        return (theta1 <= angle) && (angle <= theta2);
    }
    function textIsInRect(textBox, rectBox) {
        if (textBox.width > rectBox.width) {
            return false
        }
        return true
    }
    
    function generatePieChart() {
        var homeworkStats = $('.hw-stats');
        var labelArr = ["T", "P"];
        var typeValueArr = [0, 0];
        var pieData = []
        for (var i = 0; i < homeworkStats.length; i++) {
            var value = Number($(homeworkStats[i]).find('.value').text().trim())
            pieData.push({
                'title': $(homeworkStats[i]).find('.value').attr('data-label'),
                'label': value + "%",
                'value': value,
                'fill': $(homeworkStats[i]).find('.value').attr('data-color'),
                'target': $(homeworkStats[i]).find('.value').attr('data-target')
            })
        }
    
        pieWidth = $('#pieDiv').width();
        pieRadius = pieWidth / 2;
    
        var pieSvg = d3.select("#pieDiv")
            .append("svg")
            .data([pieData])
            .attr("id","pieChart")
            .attr("width",pieWidth)
            .attr("height",pieWidth)
            .append("svg:g")
            .attr("transform","translate(" + pieRadius + "," + pieRadius + ")");
    
        var arc = d3.svg.arc().outerRadius(pieRadius).innerRadius(pieRadius/2);
    
        var pie = d3.layout.pie()
            .value(function(d) { return d.value; });
    
        arcs = pieSvg.selectAll("g.slice")
            .data(pie)
            .enter()
            .append("svg:g")
            .attr("class","slice");
    
        arcs.append("svg:path")
            .attr("fill", function(d, i){ return pieData[i].fill })
            .attr("d", arc)
            .attr('stroke', '#fff')
            .attr('stroke-width', '2')
            .attr('cursor','pointer')
            .on('click', function(event){openDataModel(event.data.target)})
    
        arcs.append("svg:text") //add a label to each slice
            .attr("transform", function(d) {
                d.innerRadius = 0;
                d.outerRadius = pieRadius;
                return "translate(" + arc.centroid(d) + ")";
            })
            .attr("text-anchor", "middle")
            .text(function(d, i) { if(pieData[i].value != "0"){return pieData[i].label;} })
            .attr('cursor','pointer')
            .on('click', function(event){openDataModel(event.data.target)})
            .each(function (d) { //get border box and check if inside arc
                var box = this.getBBox(),
                    center = arc.centroid(d);
                var topLeft = {
                  x : center[0] + box.x,
                  y : center[1] + box.y
                };
    
                var topRight = {
                  x : topLeft.x + box.width,
                  y : topLeft.y
                };
    
                var bottomLeft = {
                  x : topLeft.x,
                  y : topLeft.y + box.height
                };
    
                var bottomRight = {
                  x : topLeft.x + box.width,
                  y : topLeft.y + box.height
                };
    
                d.visible = pointIsInArc(topLeft, d, arc) &&
                    pointIsInArc(topRight, d, arc) &&
                    pointIsInArc(bottomLeft, d, arc) &&
                    pointIsInArc(bottomRight, d, arc);
            })
            .attr('fill', '#fff')
            .attr('font-size', '10')
            .attr('display', function (d) {return d.visible ? null : "none"; });
    
    }
    function openDataModel(target) {
        if (target) {
            $('#dataModel .stats').replaceWith($('#' + target).html())
            $('#dataModel .modal-title').text($('#' + target).attr('data-title'))
            $('#dataModel').modal('show')
             $('#dataModel .ellipsis').tooltip()
        }
    }
    function drawWorkLoadIndicator(chart) {
        var data = chart.data
        $('#workLoadDiv').empty()
        var width = $('#workLoadDiv').width()
        if (width <= 480 && data.length > 2) {
            data = data.slice(2)
        }
        chart.height = chart.height ? chart.height : 150;
        var x0 = d3.scale.ordinal().rangeRoundBands([0, width, 0.1])
        var x1 = d3.scale.ordinal()
        var y = d3.scale.linear().range([chart.height, 0])
        var xAxis = d3.svg.axis().scale(x0).orient("bottom").tickPadding(12)
        var yAxis = d3.svg.axis().scale(y).orient("left").ticks(3)
        
        x0.domain(data.map(function(d) { return d.week }))
        x1.domain(chart.days).rangeRoundBands([0, x0.rangeBand()])
        var max = d3.max(data, function(d) { return d3.max(d.days, function(d) { return d.value; })})
        if (chart.homeworkDailyTime > max) {
            max = chart.homeworkDailyTime
        }
        y.domain([0, max])
        
        var workLoadSvg = d3.select('#workLoadDiv')
            .append('svg')
            .attr('class', 'ld-chart')
            .attr('width', width + chart.margin.left + chart.margin.right)
            .attr('height', chart.height + chart.margin.top + chart.margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + chart.margin.left + ',' + chart.margin.top + ')');
    
        workLoadSvg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + chart.height + ")")
            .call(xAxis);
     
        workLoadSvg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr({"transform": "rotate(-90)",
                "y": -40, "dy": ".71em", x:-16,
                "text-anchor": "end",
            })
            .text("Minutes");
    
        workLoadSvg.selectAll(".y.grid-line").data(y.ticks(4)).enter()
        .append("line")
            .attr({
                "class":"grid-line",
                "x1" : 0, "x2" : width,
                "y1" : function(d){ return y(d);},
                "y2" : function(d){ return y(d);},
            });

        workLoadSvg.selectAll(".x.grid-line").data(x0.range()).enter()
        .append("line")
            .attr({
                "class":"grid-line",
                "x1" : function(d) { return d }, "x2" : function(d) { return d },
                "y1" : 0, "y2" : chart.height
            });
    
        var state = workLoadSvg.selectAll(".state")
            .data(data)
            .enter().append("g")
            .attr("class", "g")
            .attr("transform", function(d) {return "translate(" + x0(d.week) + ",0)"; });

        var color = chart.color
        state.selectAll("rect")
            .data(function(d) { return d.days})
            .enter().forEach(function(element,index,array) {
                element.forEach(function(data,data_index,array) {
                    var d = data.__data__
                    if (d.valueOnTime) {
                        d3.select(element.parentNode).append("rect")
                        .attr({
                            "width": x1.rangeBand() - 2, "height": chart.height - y(d.valueOnTime),
                            "x": x1(d.dayOfWeek) + 2, "y": y(d.valueOnTime)
                        })
                        .style("fill", color.OnTime)
                        .on('click', function(event){openDataModel("submitOnTimeDay" + d.date)});
                    }
                    if (d.valueWithDelay) {
                        d3.select(element.parentNode).append("rect")
                        .attr({
                            "width": x1.rangeBand() - 2, "height": chart.height - y(d.valueWithDelay),
                            "x": x1(d.dayOfWeek) + 2, "y": y(d.valueOnTime + d.valueWithDelay)
                        })
                        .style("fill", color.WithDelay)
                        .on('click', function(event){openDataModel("submitDelayDay" + d.date)});
                    }
                    if (d.valueNotSubmit) {
                        d3.select(element.parentNode).append("rect")
                        .attr({
                            "width": x1.rangeBand() - 2, "height": chart.height - y(d.valueNotSubmit),
                            "x": x1(d.dayOfWeek) + 2, "y": y(d.valueOnTime + d.valueWithDelay + d.valueNotSubmit)
                        })
                        .style("fill", color.NotSubmit)
                        .on('click', function(event){openDataModel("notSubmitDay" + d.date)});
                    }
                    if (d.value == 0) {
                        d3.select(element.parentNode).append("rect")
                        .attr({
                            "width": x1.rangeBand(), "height": 0,
                            "x": x1(d.dayOfWeek), "y": 0
                        })
                    }
                    d3.select(element.parentNode).append("text")
                    .attr({
                        "width": x1.rangeBand(), "height": chart.height - y(d.valueOnTime),
                        "x": x1(d.dayOfWeek), "y": chart.height + 12, "class": "day-label"
                    })
                    .text(d.title)
                })
            })
    
        workLoadSvg.append("g")
            .attr("class", "average")
            .append("line")
            .attr("x1", 0)
            .attr("y1", y(chart.homeworkDailyTime))
            .attr("x2", width)
            .attr("y2", y(chart.homeworkDailyTime))
    
    
    }
    function genearateWorkLoadIndicator() {
        var chart = {}
        chart.margin = {top: 20, right: 20, bottom: 30, left: 40}
        
       
        chart.homeworkDailyTime = $('input[type="hidden"][name="homework-daily-time"]').val()
    
        chart.color = {
            OnTime: "#27ae60", WithDelay: "#e84b3a", NotSubmit: "#2282b5"
        }

        var days  = $(".hidden.days").attr('data-days').split(',')
        days = chart.days = days.filter(function(day){ return day < 8 && day != "" })
        
        var data = {}
        $('.daily-work-load').each(function(index, element) {
            var label = element.getAttribute('data-label')
            var day = moment(label).format('d')
            var week = moment(label).day(0).format('Do') + ' - ' + moment(label).day(6).format('Do MMM')
            if (!(moment(label).day(0)).isSame(moment(label).day(6), 'month')) {
                week = moment(label).day(0).format('Do MMM') + ' - ' + moment(label).day(6).format('Do MMM')      
            }
            if (moment(label).day(0).isSame(moment().day(0), 'week')) {
                week = "This week"
            }
            if (data[week] === undefined) {
                data[week] = {} 
            }
            var onTime = parseInt(element.getAttribute('data-submitted-on-time')) || 0,
            withDelay = parseInt(element.getAttribute('data-submitted-with-delay')) || 0,
            notSubmit = parseInt(element.getAttribute('data-not-submitted')) || 0
            data[week][day] = {
                'title': moment(label).format('dd'),
                'dayOfWeek': moment(label).day(),
                'date': label,
                'valueOnTime': onTime,
                'valueWithDelay': withDelay,
                'valueNotSubmit': notSubmit,
                'value':  onTime + withDelay + notSubmit
            }
        })
        var workLoadData = []
    
        for (week in data) {
            var weekData = days.map(function(day) {
                if (data[week][day] != undefined) {
                    
                    return data[week][day]
                } else {
                    return {title: moment().day(day).format('dd'), value: 0, dayOfWeek: day,
                        valueOnTime: 0, valueWithDelay: 0, valueNotSubmit: 0}
                }
            })
            workLoadData.push({
                'week': week,
                'days': weekData.sort(function(a,b)  {return (a.dayOfWeek > b.dayOfWeek) ? 1 : 0})
            })
        }
        chart.data = workLoadData
       
        chart.draw = function(){ drawWorkLoadIndicator(chart)}
        $(window).on("resize", chart.draw);
        return chart
    }

    var init = function() {
        if ($('#HWStatusClassStats').length > 0) {
            var HWStatusClasses = charts.hwStatusClassse = genearateHWStatusClass()
            for (var i =0; i < HWStatusClasses.length; i++) {
                HWStatusClasses[i].draw()
            }
        }
        generatePieChart()
        if ($('.daily-work-load').length > 0) {
           var workLoad = charts.workLoad = genearateWorkLoadIndicator()
           workLoad.draw()
        }
    }
    return {
        init: init
    }
})()
$( document ).ready(function() {
    charts.init()
});
