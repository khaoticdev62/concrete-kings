extends TileMap
class_name BlockTileMap

const TILE_SIZE: int = 16

func _ready() -> void:
	cell_quadrant_size = TILE_SIZE
	tile_set.tile_size = Vector2i(TILE_SIZE, TILE_SIZE)
	add_layer(0) # Ground Asphalt/Sidewalk
	add_layer(1) # Building Walls/Stoops
	add_layer(2) # Props/Streetlamps (Y-Sorted)
	set_layer_y_sort_enabled(2, true)
