let M; 

const rust = import('./pkg/font_wasm.js')
    .then(function(module) {
        M = module;
        return module.default();
    }).then(function() {
        let font = new M.FontRef(new Uint8Array(data));
    });

let FONTS = [];
let TEXT = "Hello World!";
let VIEWS = [];

function load_font(url) {
    fetch(url)
    .then(r => r.arrayBuffer())
    .then(function(data) {
        let font = new M.FontRef(new Uint8Array(data));
        FONTS.append(font);
    })
}
        
function draw_text(font) {
    let image = font.draw_text(200, TEXT);
    let canvas = image2canvas(image);
    let view = document.createElement("div");
    view.appendChild(canvas);
    VIEWS.append(view);
    
    document.body.appendChild(view);
}
function update_text() {
    
}
    
function image2canvas(image) {
    let canvas = document.createElement("canvas");
    let width = canvas.width = image.width();
    let height = canvas.height = image.height();
    let ctx = canvas.getContext('2d');
    var img_data = ctx.createImageData(canvas.width, canvas.height);
    image.get_data(img_data.data);
    ctx.putImageData(img_data,0,0);
    return canvas;
}
