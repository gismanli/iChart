var data = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    series: [
        {
            label: "My First dataset",
            fillColor: "rgba(0,110,220,0.2)",
            strokeColor: "rgba(0,110,220,1)",
            data: [65, 59, 80, 81, 56, 55, 50]
        },
        {
            label: "My First dataset",
            fillColor: "rgba(111,111,111,0.2)",
            strokeColor: "rgba(111,111,111,1)",
            data: [165, 159, 180, 181, 156, 155, 110]
        }
        ,
        {
            label: "My First dataset",
            fillColor: "rgba(2,22,222,0.2)",
            strokeColor: "rgba(2,22,222,1)",
            data: [265, 259, 280, 282, 256, 255, 210]
        }
        ,
        {
            label: "My First dataset",
            fillColor: "rgba(1,11,111,0.2)",
            strokeColor: "rgba(1,11,111,1)",
            data: [365, 359, 380, 383, 356, 355, 310]
        }
    ]
};

var ctx = document.getElementById('canvas').getContext('2d');
var myLineChart = new iChart(ctx).Column(data, {
});