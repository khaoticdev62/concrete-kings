shader_type canvas_item;

uniform sampler2D palette_texture : hint_default_black;
uniform float city_index : hint_range(0.0, 7.0, 1.0);
uniform float total_cities = 8.0;

void fragment() {
	vec4 col = texture(TEXTURE, UV);
	if (col.a < 0.01) {
		COLOR = col;
	} else {
		float u = col.r;
		float v = (city_index + 0.5) / total_cities;
		vec4 swapped_color = texture(palette_texture, vec2(u, v));
		COLOR = vec4(swapped_color.rgb, col.a);
	}
}
