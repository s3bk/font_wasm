extern crate wasm_bindgen;
extern crate wee_alloc;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use wasm_bindgen::prelude::*;
use font::{Font, parse, draw_text};
use raqote::{DrawTarget, Path};
use vector::PathStyle;

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
pub struct FontRef {
    raqote: Box<dyn Font<Path>>
}

#[wasm_bindgen]
impl FontRef {
    #[wasm_bindgen(constructor)]
    pub fn load(data: &[u8]) -> FontRef {
        FontRef {
            raqote: parse::<Path>(&data)
        }
    }
    
    pub fn draw_text(&self, font_size: f32, text: &str) -> Image {
        let glyph_style = PathStyle {
            fill: Some((0, 0, 255, 100)),
            stroke: Some(((0, 0, 0, 255), 0.5))
        };
        let baseline_style = PathStyle {
            fill: None,
            stroke: Some(((0, 0, 0, 255), 0.5))
        };
        Image {
            data: draw_text::<DrawTarget>(&*self.raqote, font_size, text, glyph_style, Some(baseline_style))
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
