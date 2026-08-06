extends Camera2D
class_name PixelPerfectCamera

@export var native_resolution: Vector2i = Vector2i(320, 180)

func _ready() -> void:
	get_tree().root.size_changed.connect(_on_viewport_resized)
	_update_camera_zoom()

func _on_viewport_resized() -> void:
	_update_camera_zoom()

func _update_camera_zoom() -> void:
	var window_size: Vector2i = get_viewport().get_visible_rect().size
	var scale_x: int = int(window_size.x / native_resolution.x)
	var scale_y: int = int(window_size.y / native_resolution.y)
	var integer_scale: int = max(1, min(scale_x, scale_y))
	
	position = position.floor()
