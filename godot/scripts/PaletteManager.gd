extends Node
class_name PaletteManager

enum CityTheme { DETROIT, CHICAGO, MIAMI, BALTIMORE, ATLANTA, HARLEM, OAKLAND, NOLA }

@export var palette_swap_material: ShaderMaterial

func set_city_theme(theme: CityTheme) -> void:
	if palette_swap_material:
		palette_swap_material.set_shader_parameter("city_index", float(theme))
