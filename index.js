let M; 

const rust = import('./pkg/font_wasm.js')
    .then(function(module) {
        M = module;
        return module.default();
    }).then(function() {
        load_font_from_url("Roboto-Medium.ttf");
    });

let ENTRIES = [];
let TEXT = "Hello World!";

function load_font_from_url(url) {
    fetch(url)
        .then(r => r.arrayBuffer())
        .then(load_font, url);
}

function load_font(data, name) {
    let font = new M.FontRef(new Uint8Array(data));
    let div = document.createElement("div");
    let canvas = draw_text(font, TEXT);
    div.appendChild(canvas);
    let entry = {
        name: name,
        font: font,
        div: div
    };
    document.getElementById("views").append(div);
    ENTRIES.push(entry);
}
        
function draw_text(font, text) {
    let image = font.draw_text(100, text);
    let canvas = image2canvas(image);
    return canvas;
}

function update_text(e) {
    let text = e.target.value;
    ENTRIES.forEach(function(entry) {
        let canvas = draw_text(entry.font, text);
        let div = entry.div;
        div.replaceChild(canvas, div.firstChild);
    });
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
function add_fonts(files) {
    for (var i = 0; i < files.length; i++) {
        let file = files[i];
        let reader = new FileReader();
        reader.onload = function() {
            load_font(reader.result, file.name);
        };
        reader.readAsArrayBuffer(file);
    }
}
function drop_handler(e) {
    e.stopPropagation();
    e.preventDefault();
    add_fonts(e.dataTransfer.files);
}
function dragover_handler(e) {
    e.stopPropagation();
    e.preventDefault();
}

document.addEventListener("drop", drop_handler, false);
document.addEventListener("dragover", dragover_handler, false);
