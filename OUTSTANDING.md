# Outstanding Tasks

## Weapon Profile Verification

### Status: Core Weapons ✅ COMPLETE
All core rulebook weapons have been verified against https://tow.whfb.app/weapons-of-war/ and updated:
- Great Weapon, Halberd, Lance, Cavalry Spear, Spear, Flail, Morning Star
- Crossbow, Repeater Crossbow, Handgun, Pistol, Brace of Pistols, Repeater Handgun
- Javelin, Sling, Throwing Axe
- Wicked Claws, Serrated Maw, Venomous Tail

### Status: Magic Weapons ⏳ PENDING
Need to verify against tow.whfb.app and update weapon profiles:
- **Dwarfen Mountain Holds:** Dragonblade, Foebreaker, Frontier Axe, Morning Star of Fracasse, Heartwood Lance, Sword of the Stout Hearted
- **Empire of Man:** Beast Reaver, Judgement, Sorrow's End, Sword of Heroes, Sword of the Quest, The Dolorous Blade (Deadly Blows variant), The Dolorous Blade (Rapid Strikes variant)
- **Kingdom of Bretonnia:** Various Arthurian-themed magic weapons

### Status: Faction-Specific Weapons ⏳ PENDING
Weapons with faction-specific profiles that don't appear in core rulebook:
- **Dwarfen Mountain Holds:** Brimstone Gun, Clattergun, Drakegun, Furnace Hammer, Goblin-Hewer, Gromril Great Axe, Rivet Gun, Steam Drill, Steam Gun, Trollhammer Torpedo
- **Empire of Man:** Ball & Chain, Blunderbuss, Grenade Launching Blunderbuss, Helblaster Volley Gun, Helstorm Rocket Battery, Hochland Long Rifle, Hooked Halberd, Light Cannon, Long Rifle, Man-Catcher, Ogre Pistol, Pigeon Bombs, Repeating Rifle, Steam Cannon, Steam Gun
- **Kingdom of Bretonnia:** Blunderbuss, Bombard, Burning Braziers, Defensive Stakes, Field Trebuchet, Polearm, Trebuchet
- **Other Factions:** Beastmen, High Elves, Orc & Goblins, Tomb Kings, Warriors of Chaos, Wood Elves all have faction-specific weapons

## Process for Remaining Weapons

1. Fetch weapon profile from tow.whfb.app if available
2. If not available, use faction book rules or notes field as reference
3. Update all instances across all factions using same name
4. Test weapon profile table display with each update
5. Commit with verification URL reference

## Expected Impact

- **Magic Weapons:** ~15-20 weapons across multiple factions
- **Faction-Specific Weapons:** ~50+ unique weapons across all factions
- **Total Instances:** 200-300+ weapon profile updates

## Notes

- Some weapons may only exist in specific faction books and not have tow.whfb.app entries
- For those, use the faction book sources or official rules as reference
- Ensure special_rules use consistent naming convention (snake_case with underscores)
- Some weapons have conditional bonuses (e.g., apply only on charge turn) - capture these in notes field if they don't fit the standard profile
