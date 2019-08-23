let worker = new Worker('worker.js');
let running = {};
let job_nr = 0;

function run(method, args, callback, transfer) {
    let id = job_nr;
    job_nr += 1;
    
    console.log(method, args, callback);
    if (callback) {
        running[id] = callback;
    }
    worker.postMessage({
        id: id,
        method: method,
        args: args
    }, transfer);
}
worker.onmessage = function(e) {
    let msg = e.data;
    let id = msg.id;
    let data = msg.data;
    
    console.log(id, data);
    let callback = running[id];
    delete running[id];
    
    if (callback != undefined) {
        callback(data);
    }
}


let ENTRIES = [];
let TEXT = "Hello World!";
let STYLE = 0;

async function load_font_from_url(url) {
    let response = await fetch(url);
    let data = await response.arrayBuffer();
    load_font(data, url);
}

function load_font(data, font_id) {
    let div = document.createElement("div");
    
    run("load_font", {font_id: font_id, data: data}, null, [data]);
    run("draw_text", {font_id: font_id, text: TEXT, style_id: STYLE}, function(data) {
        div.appendChild(image2canvas(data.image));
        
        let label = document.createElement("span");
        label.appendChild(document.createTextNode(font_id));
        div.appendChild(label);
    });
    
    let entry = {
        font_id: font_id,
        div: div
    };
    document.getElementById("views").append(div);
    ENTRIES.push(entry);
}

function update_text(e) {
    TEXT = e.target.value;
    update_all();
}
function update_all() {
    ENTRIES.forEach(function(entry) {
        run("draw_text", {
            font_id: entry.font_id,
            text: TEXT,
            style_id: STYLE
        },
        function(data) {
            let div = entry.div;
            div.replaceChild(image2canvas(data.image), div.firstChild);
        });
    });
}
        
function image2canvas(image) {
    let canvas = document.createElement("canvas");
    let width = canvas.width = image.width;
    let height = canvas.height = image.height;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
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

var TextSettings = function() {
    this.font_size = 100.;
    this.fill = {
        enabled: true,
        color: [0, 20, 200],
        opacity: 0.5
    };
    this.stroke = {
        enabled: true,
        color: [0, 0, 0],
        width: 0.1,
        opacity: 1.0
    };
    this.baseline = {
        enabled: true,
        color: [0, 0, 0],
        width: 0.5,
        opacity: 1.0
    };
};

var settings;
function init_dat() {
    settings = new TextSettings();
    var gui = new dat.GUI();
    gui.add(settings, "font_size", 1, 1000).onFinishChange(update_style);
    
    function add_fill(name, obj) {
        var g = gui.addFolder(name);
        g.add(obj, "enabled").onFinishChange(update_style);
        g.addColor(obj, "color").onFinishChange(update_style);
        g.add(obj, "opacity", 0., 1.).onFinishChange(update_style);
    }
        
    function add_stroke(name, obj) {
        var g = gui.addFolder(name);
        g.add(obj, "enabled").onFinishChange(update_style);
        g.addColor(obj, "color").onFinishChange(update_style);
        g.add(obj, "opacity", 0., 1.).onFinishChange(update_style);
        g.add(obj, "width", 0.1, 10.).onFinishChange(update_style);
    }
    
    add_fill("glyph fill", settings.fill);
    add_stroke("glyph stroke", settings.stroke);
    add_stroke("baseline", settings.baseline);
}

function update_style() {
    let style = { font_size: settings.font_size };
    if (settings.fill.enabled) {
        style.fill = settings.fill;
    }
    if (settings.stroke.enabled) {
        style.stroke = settings.stroke;
    }
    if (settings.baseline.enabled) {
        style.baseline = settings.baseline;
    }
    run("create_style", { style_id: STYLE, json: JSON.stringify(style) });
    update_all();
}

function init() {
    init_dat();
    update_style();
    load_font_from_url("Roboto-Medium.ttf");
}
init();
