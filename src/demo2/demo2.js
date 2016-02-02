var data = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    series: [
        {
            label: "My First dataset",
            fillColor: "rgba(20,220,120,0.2)",
            strokeColor: "rgba(220,220,220,1)",
            pointColor: "rgba(220,220,220,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,1)",
            data: [65, 59, 80, 81, 56, 55, 50]
        },
        {
            label: "My First dataset",
            fillColor: "rgba(22,22,22,0.2)",
            strokeColor: "rgba(22,22,22,1)",
            pointColor: "rgba(22,22,22,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(22,22,22,1)",
            data: [165, 159, 180, 181, 156, 155, 510]
        }
    ]
};

var ctx = document.getElementById('canvas').getContext('2d');
// console.log(new iChart(ctx).Line);
var myLineChart = new iChart(ctx).Line(data, {
    beginAtZero: true
});