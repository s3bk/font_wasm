extern crate wasm_bindgen;
extern crate wee_alloc;
#[macro_use]
extern crate serde;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use wasm_bindgen::prelude::*;
use font::{Font, parse, layout::line};
use raqote::{DrawTarget, Path};
use vector::{PathStyle, Rgba8};
use serde_json;
use serde::Deserialize;

#[derive(Deserialize)]
struct StrokeStyle {
    color: [u8; 3],
    opacity: f32,
    width: f32
}
#[derive(Deserialize)]
struct FillStyle {
    color: [u8; 3],
    opacity: f32
}
impl Into<(Rgba8, f32)> for StrokeStyle {
    fn into(self) -> (Rgba8, f32) {
        (rgba_from_color_and_opacity(self.color, self.opacity), self.width)
    }
}
impl Into<Rgba8> for FillStyle {
    fn into(self) -> Rgba8 {
        rgba_from_color_and_opacity(self.color, self.opacity)
    }
}
    
#[derive(Deserialize)]
struct Settings {
    font_size: f32,
    fill: Option<FillStyle>,
    stroke: Option<StrokeStyle>,
    baseline: Option<StrokeStyle>
}
fn rgba_from_color_and_opacity(color: [u8; 3], opacity: f32) -> Rgba8 {
    let [r, g, b] = color;
    let a = (255. * opacity) as u8;
    (r, g, b, a)
}

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}
macro_rules! console_log {
    // Note that this is using the `log` function imported above during
    // `bare_bones`
    ($($t:tt)*) => (log(&format!($($t)*)))
}

#[wasm_bindgen]
pub struct Style {
    font_size: f32,
    glyph_style: PathStyle,
    baseline_style: Option<PathStyle>
}

impl From<Settings> for Style {
    fn from(settings: Settings) -> Style {
        Style {
            font_size: settings.font_size,
            glyph_style: PathStyle {
                fill: settings.fill.map(Into::into),
                stroke: settings.stroke.map(Into::into)
            },
            baseline_style: settings.baseline
                .map(|stroke| PathStyle { fill: None, stroke: Some(stroke.into()) })
        }
    }
}

#[wasm_bindgen]
impl Style {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Style {
        Settings {
            font_size: 100.,
            fill: None,
            stroke: None,
            baseline: None
        }.into()
    }
    
    pub fn update(&mut self, json: &str) {
        let settings: Settings = serde_json::from_str(json).unwrap();
        *self = settings.into();
    }
}

#[wasm_bindgen]
pub struct FontRef {
    raqote: Box<dyn Font<Path>>,
}

#[wasm_bindgen]
impl FontRef {
    #[wasm_bindgen(constructor)]
    pub fn load(data: &[u8]) -> FontRef {
        FontRef {
            raqote: parse::<Path>(&data)
        }
    }
    
    pub fn draw_text(&self, text: &str, style: &Style) -> Image {
        Image {
            data: line::<DrawTarget>(&*self.raqote, style.font_size, text, style.glyph_style, style.baseline_style)
        }
    }
}

#[wasm_bindgen]
pub struct Image {
    data: DrawTarget
}

#[wasm_bindgen]
impl Image {
    pub fn width(&self) -> u32 {
        self.data.width() as _
    }
    pub fn height(&self) -> u32 {
        self.data.height() as _
    }
    pub fn write_rgba_to(&self, buffer: &mut [u8]) {
        for (&src, dst) in self.data.get_data().iter().zip(buffer.chunks_mut(4)) {
            let [b, g, r, a] = src.to_le_bytes();
            dst[0] = r;
            dst[1] = g;
            dst[2] = b;
            dst[3] = a;
        }
    }
}
#[wasm_bindgen(start)]
pub fn main() {
    // executed automatically ...
}
