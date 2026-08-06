-- Aseprite Script: optimize_palette.lua
-- Concrete Kings: The Block Chronicles
-- Remaps image pixels strictly to the nearest color in the Master 64-Color Palette.

local sprite = app.activeSprite
if not sprite then return end

local hex_palette = {
    "#08080A","#101116","#181920","#22252E","#2D313D","#393E4D","#474D5E","#565E70",
    "#666E82","#788196","#8B95AB","#A0AAC2","#B6C0D8","#CBD5ED","#E2E8F7","#F4F7FF",
    "#2B0D0D","#4D1414","#7A1D1C","#AA2724","#D9382E","#F25438","#FF7A45","#FFA059",
    "#FFC475","#FFE299","#6E3E14","#9C5C1D","#C9822B","#F0AB43","#FFCD68","#FFF0AA",
    "#0A1526","#11233F","#1C375C","#274F80","#366BA6","#488BD9","#5EAAFF","#85C4FF",
    "#0D2926","#174540","#246961","#339488","#47C2B3","#6FE8D8","#2A1138","#521C6E",
    "#140A07","#26120B","#3B1C11","#522717","#6B341D","#854224","#A1522C","#BE6436",
    "#D97843","#EB8E52","#F7A768","#FFC085","#FFD6A8","#3D2218","#5C3222","#7D442C"
}

app.transaction("Optimize to Master Palette", function()
    local pal = Palette(#hex_palette)
    for i, hex in ipairs(hex_palette) do
        local r = tonumber(hex:sub(2,3), 16)
        local g = tonumber(hex:sub(4,5), 16)
        local b = tonumber(hex:sub(6,7), 16)
        pal:setColor(i-1, Color{ r=r, g=g, b=b, a=255 })
    end
    sprite:setPalette(pal)
    app.command.ColorMode{ ui=false, mode="indexed" }
end)
app.alert("Palette optimized and locked to 64 colors!")
