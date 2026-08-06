extends Node
class_name AtlasLoader

var atlas_texture: Texture2D = preload("res://assets/atlases/master_atlas.png")
var sprite_cache: Dictionary = {}

func get_atlas_sub_texture(rect: Rect2) -> AtlasTexture:
	var cache_key: String = str(rect)
	if sprite_cache.has(cache_key):
		return sprite_cache[cache_key]
	
	var sub_tex := AtlasTexture.new()
	sub_tex.atlas = atlas_texture
	sub_tex.region = rect
	sprite_cache[cache_key] = sub_tex
	return sub_tex
