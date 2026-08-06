-- Aseprite Script: generate_variants.lua
-- Concrete Kings: The Block Chronicles
-- Generates 8 regional city color variants from a base tile sprite.

local app = app
local sprite = app.activeSprite
if not sprite then
    app.alert("No active sprite found!")
    return
end

-- Define Palette Overrides (Base HEX -> Target HEX)
local city_palettes = {
    Detroit   = { ["7a1d1c"] = "4d1414", ["474d5e"] = "2d313d" },
    Chicago   = { ["7a1d1c"] = "565e70", ["393e4d"] = "181920" },
    Miami     = { ["7a1d1c"] = "6fe8d8", ["474d5e"] = "f25438" },
    Baltimore = { ["7a1d1c"] = "ffcd68", ["6e3e14"] = "101116" },
    Atlanta   = { ["7a1d1c"] = "aa2724", ["246961"] = "174540" },
    Harlem    = { ["7a1d1c"] = "6b341d", ["8b95ab"] = "c9822b" },
    Oakland   = { ["7a1d1c"] = "339488", ["181920"] = "ff7a45" },
    NOLA      = { ["7a1d1c"] = "d97843", ["666e82"] = "246961" }
}

app.transaction("Generate City Variants", function()
    local base_path = sprite.filename
    local dir = app.fs.filePath(base_path)
    local title = app.fs.fileTitle(base_path)

    for city_name, color_map in pairs(city_palettes) do
        local new_sprite = Sprite(sprite)
        local pal = new_sprite.palettes[1]

        for i = 0, #pal - 1 do
            local color = pal:getColor(i)
            local hex = string.format("%02x%02x%02x", color.red, color.green, color.blue)
            if color_map[hex] then
                local target_hex = color_map[hex]
                local r = tonumber(target_hex:sub(1,2), 16)
                local g = tonumber(target_hex:sub(3,4), 16)
                local b = tonumber(target_hex:sub(5,6), 16)
                pal:setColor(i, Color{ r=r, g=g, b=b, a=color.alpha })
            end
        end

        local export_path = app.fs.joinPath(dir, title .. "_" .. city_name .. ".png")
        new_sprite:saveCopyAs(export_path)
        new_sprite:close()
    end
end)
app.alert("Generated 8 city variants successfully!")
