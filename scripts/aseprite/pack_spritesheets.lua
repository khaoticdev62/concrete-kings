-- Aseprite Script: pack_spritesheets.lua
-- Concrete Kings: The Block Chronicles
-- Automatically packs active frames into a 2048x2048 Sprite Atlas.

local sprite = app.activeSprite
if not sprite then
    app.alert("No active sprite selected!")
    return
end

app.command.ExportSpriteSheet{
    ui = false,
    type = SpriteSheetType.GRID,
    columns = 64,
    rows = 64,
    width = 2048,
    height = 2048,
    textureFilename = app.fs.joinPath(app.fs.filePath(sprite.filename), "master_atlas.png"),
    dataFilename = app.fs.joinPath(app.fs.filePath(sprite.filename), "master_atlas.json"),
    dataFormat = SpriteSheetDataFormat.JSON_HASH,
    borderPadding = 0,
    shapePadding = 0,
    innerPadding = 0,
    trimSprite = false,
    extrude = false
}
app.alert("Master Atlas Packed to 2048x2048 successfully!")
