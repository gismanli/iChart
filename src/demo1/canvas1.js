var canvas = document.getElementById('canvas1')

var context = canvas1.getContext('2d');



// 矩形
context.fillStyle = 'rgba(222, 222, 222, 1)';
context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
context.fillRect(0, 0, 100, 100);
context.strokeRect(0, 0, 100, 100);

// 清除
context.clearRect(20, 20, 60, 60);

// 圆形
context.beginPath()
context.arc(100, 100, 100, 0, Math.PI * 2, true);
context.closePath();
context.fillStyle = 'rgba(0,255,0,0.25)';
context.fill();

// 1/4圆
context.beginPath();
context.closePath();
context.fillStyle = 'rgba(255,0,0,0.25)';
context.fill();

// 线段
context.lineTo(200, 200);
context.moveTo(200, 300);
context.strokeStyle = "rgb(250,0,0)";
context.stroke();

// 花
context.fillStyle = "#EEEEFF";
// context.fillRect(0, 0, 400, 300);
var n = 0;
var dx = 700;
var dy = 100;
var s = 100;
context.beginPath();
context.fillStyle = 'rgb(100,255,100)';
context.strokeStyle = 'rgb(0,0,100)';
var x = Math.sin(0);
var y = Math.cos(0);
var dig = Math.PI / 15 * 11;
for (var i = 0; i < 30; i++) {
    var x = Math.sin(i * dig);
    var y = Math.cos(i * dig);
    context.lineTo(dx + x * s, dy + y * s);
}
context.closePath();
context.fill();
context.stroke();

// 贝塞尔曲线
context.moveTo(100, 300);
context.bezierCurveTo(00, 500, 400, 100, 100, 100);
context.stroke();
context.moveTo(400, 400);
context.quadraticCurveTo(150, 450, 250, 250);
context.stroke();

// 线性渐变
var lg = context.createLinearGradient(0, 500, 100, 600);
lg.addColorStop(0, 'rgb(255,0,0)'); //红  
lg.addColorStop(0.5, 'rgb(0,255,0)');//绿
lg.addColorStop(1, 'rgb(0,0,255)'); //蓝
context.fillStyle = lg;
context.fillRect(300, 0, 10, 200);

// 径向渐变
var rg = context.createRadialGradient(100, 150, 10, 300, 150, 50);
lg.addColorStop(0, 'rgb(255,0,0)'); //红  
lg.addColorStop(0.5, 'rgb(0,255,0)');//绿
lg.addColorStop(1, 'rgb(0,0,255)'); //蓝
context.fillStyle = lg;
context.fillRect(400, 0, 10, 200);

// 图片
// var img = new Image();
// img.src = './image.jpg';
// img.onload = function () {
//     context.drawImage(img, 400, 400, 200, 200, 0, 0, 800, 800);
// }

// 保存
// window.open(canvas.toDataURL("image/jpeg"),"smallwin","width=400,height=350");

// var interal = setInterval(function () {
//        move(context);
//    }, 1);

// var x = 100;//矩形开始坐标
// var y = 100;//矩形结束坐标
// var mx = 0;//0右1左
// var my = 0; //0下1上
// var ml = 1;//每次移动长度
// var w = 20;//矩形宽度
// var h = 20;//矩形高度
// var cw = 400;//canvas宽度
// var ch = 300; //canvas高度

// function move(context) {
//     context.clearRect(0, 0, 400, 300);
//     context.fillStyle = "#EEEEFF";
//     context.fillRect(0, 0, 400, 300);
//     context.fillStyle = "red";
//     context.fillRect(x, y, w, h);       
//     if (mx == 0) {
//         x = x + ml;
//         if (x >= cw-w) {
//             mx = 1;
//         }
//     }
//     else {
//         x = x - ml;
//         if (x <= 0) {
//             mx = 0;
//         }
//     }
//     if (my == 0) {
//         y = y + ml;
//         if (y >= ch-h) {
//             my = 1;
//         }
//     }
//     else {
//         y = y - ml;
//         if (y <= 0) {
//             my = 0;
//         }
//     }
// }

var text = context.measureText("11");
console.log(text.width)