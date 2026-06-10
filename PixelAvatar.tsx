import React from "react";

// Pixel Avatar Customization Types
export type GenderType = "male" | "female";

export type HairStyle =
  | "neat_dark"    // Male default: Classic short boy bangs
  | "devil_part"   // Male: Grey trendy parted hair (comma)
  | "comma_brown"  // Male: Wave dandy brown parted hair with a mini back-tied ponytail braid (Photo 3 match!)
  | "street_blue"  // Male: Shaggy spiky deep cobalt-blue hair
  | "pink_wave"    // Female: Gorgeous flowing soft long pink hair with peach gradient & retro sunglasses on head (Photo 4 match!)
  | "wavy_long"    // Female: Elegant sleek midnight-black waves cascading past shoulders (Photo 2 match!)
  | "twin_tail"    // Female: Cute golden lemon twin-tails with ribbon pins
  | "bob_chic";    // Female: Chic lavender short bob with side sweeping bangs

export type OutfitStyle =
  | "uniform"      // School Blazer (Male) / Pleated Sailor Suit (Female)
  | "hoodie"       // Cozy Black Street Hoodie (Male) / Emerald Tech Hoodie with white crop top (Female, Photo 1)
  | "varsity"      // Sporty Athletic Varsity (Male) / High-Teen look: white halter top, light sky-blue baggy trousers with a pink sash strap & mini white handbag in hand (Female, Photo 4 match!)
  | "demon"        // Oriental Warrior: midnight-blue warrior robe with crimson lapels, white linings, and gold back design (Photo 5 style match!)
  | "princess"     // Prince Royal Suit (Male) / Off-shoulder romantic white summer dress with violet checker hem patterns & purple shoes (Female, Photo 2 match!)
  | "lab_coat";    // White research dandy long-coat with black high-neck (Photo 3 style)

export type HatStyle = "none" | "crown" | "red_ribbon" | "wizard_hat" | "straw_hat";

interface PixelAvatarProps {
  gender?: GenderType;
  direction?: "up" | "down" | "left" | "right";
  isWalking?: boolean;
  walkFrame?: number;
  hair?: HairStyle;
  outfit?: OutfitStyle;
  hat?: HatStyle;
  isIdle?: boolean;
  scale?: number;
  className?: string;
}

/**
 * 100% SVG Elite Retro JRPG Pixel Character Sprite (Multi-Gender & Deluxe Clothes Edition).
 * Redesigned with custom rounder face structure, highly detailed male/female facial distinctions,
 * and elite tiered clothes matching exactly the reference photos sent by the user.
 */
export default function PixelAvatar({
  gender = "male",
  direction = "down",
  isWalking = false,
  walkFrame = 0,
  hair = "neat_dark",
  outfit: rawOutfit = "uniform",
  hat = "none",
  isIdle = true,
  scale = 1,
  className = "",
}: PixelAvatarProps) {
  const outfit = (rawOutfit === "demon" || rawOutfit === "princess" ? "uniform" : rawOutfit) as any as OutfitStyle;
  const isFemale = gender === "female";
  const isLeft = direction === "left";
  const isBack = direction === "up";
  const isSide = direction === "left" || direction === "right";

  // Cycle walking frames (0, 1, 2, 3) for leg scissor and vertical engine bobbing
  const animPhase = isWalking ? walkFrame % 4 : 0;

  // --- Retro Pixel Art Outline Palette ---
  const OUTLINE = "#000000"; // Elegant crisp pitch-black contours for highest JRPG resolution

  // Skin Palette with 3-step high-quality ambient shading
  const SKIN_BASE = "#ffeedd";      // Sweet creamy soft skin tone
  const SKIN_SHADOW = "#e8b195";    // Warm shadow shading (chin, temples, neck)
  const SKIN_HIGHLIGHT = "#ffffff"; // Clear gloss sparkle highlights
  const SKIN_BLUSH = "#ff8fa0";     // Translucent rosy gradient blush
  const LIP = "#ff5577";            // Sweet pink mouth lip

  // Eye Pupils & Sparks
  const EYES_PUPIL = "#111111";
  const EYE_GLEAM = "#ffffff";

  // Dynamic Iris Color Tone harmonized beautifully with Hair styles
  const EYE_IRIS = (() => {
    switch (hair) {
      case "pink_wave": return "#ec4899";  // Magenta pink
      case "wavy_long": return "#ea580c";  // Warm gold / orange
      case "twin_tail": return "#ea580c";  // Matching amber golds
      case "bob_chic": return "#a855f7";   // Lavender violet
      case "devil_part": return "#64748b"; // Slate grey
      case "street_blue": return "#3b82f6"; // Brilliant sapphire blue
      case "comma_brown": return "#b45309"; // Warm cedar brown
      case "neat_dark":
      default: return "#0d9488"; // Sea green / emerald JRPG default
    }
  })();

  // Hair Palettes (Base, High Lights, Shadow depths)
  const HAIR_BLACK = { base: "#2b2e38", light: "#4f5569", dark: "#14151b" }; // Dark Chestnut Black
  const HAIR_GREY = { base: "#64748b", light: "#94a3b8", dark: "#334155" };  // Comma grey
  const HAIR_BROWN = { base: "#92400e", light: "#f59e0b", dark: "#451a03" }; // Warm Princess Amber Brown
  const HAIR_BLUE = { base: "#1e3a8a", light: "#3b82f6", dark: "#172554" };  // Messy shaggy street blue
  const HAIR_PINK = { base: "#fd79a8", light: "#ffb4d6", dark: "#db3572", peach: "#ffeaa7" }; // Peach gradient for Photo 4 pink hair!
  const HAIR_BLACK_WAVE = { base: "#1e1e2d", light: "#4c4868", dark: "#0f0f18" }; // Elegant midnight-black for Photo 2 black hair!
  const HAIR_GOLD = { base: "#ea580c", light: "#fef08a", dark: "#a16207" };  // Lemon gold yellow
  const HAIR_LILAC = { base: "#c084fc", light: "#f3e8ff", dark: "#6b21a8" }; // Elegant short lilac bob
  const HAIR_DANDY_BROWN = { base: "#78350f", light: "#b45309", dark: "#451a03" }; // Comma brown dandy

  interface HairColors {
    base: string;
    light: string;
    dark: string;
    peach?: string;
  }

  const hc: HairColors = (() => {
    switch (hair) {
      case "pink_wave": return HAIR_PINK;
      case "wavy_long": return HAIR_BLACK_WAVE; // Mapped to upscale photo-realistic midnight waves
      case "twin_tail": return HAIR_GOLD;
      case "bob_chic": return HAIR_LILAC;
      case "devil_part": return HAIR_GREY;
      case "street_blue": return HAIR_BLUE;
      case "comma_brown": return HAIR_DANDY_BROWN;
      case "neat_dark":
      default: return HAIR_BLACK;
    }
  })();

  // Unified Outfit Colors Interface
  interface OutfitColors {
    base: string;       // Outer jacket/cloak base body
    light: string;      // Trim highlights, glossy reflections
    dark: string;       // Fold creases, deep pocket shadows
    neon?: string;      // Cyber/fantasy neon glow accents
    inner?: string;     // crop tops or collar shirt fabric
    accent?: string;    // Ties, emblems, or utility brass
  }

  // Outfit Palettes matching the image design concepts perfectly:
  const OUTFIT_UNIFORM: OutfitColors = isFemale ? {
    base: "#1e1b4b",   // Indigo navy jacket
    light: "#4338ca",  // Shading highlight
    dark: "#0f172a",   // Pleated skirt dark shadows
    inner: "#ffffff",  // White collar shirt
    accent: "#dc2626", // Sailor red bow ribbon
  } : {
    base: "#1e1b4b",   // Classic boys high school navy blazer
    light: "#312e81",  // Blazer highlight
    dark: "#0f172a",   // Drop crease shadows
    inner: "#ffffff",  // Starched collar shirt
    accent: "#b91c1c", // Student crimson red tie
  };

  const OUTFIT_HOODIE: OutfitColors = isFemale ? {
    base: "#115e59",   // Image 1: Deep emerald-teal draped cloak
    light: "#134e4a",  // shadow
    dark: "#0f172a",   // deepest shadow folds
    neon: "#2dd4bf",   // Image 1: Glowing bright neon cyan edges & straps
    inner: "#f8fafc",  // Image 1: Minimalist white cropped tank top
  } : {
    base: "#1e293b",   // Boys street slouchy hoodie (charcoal)
    light: "#475569",  // Hoodie cap overlay
    dark: "#0f172a",   // Folds shadows
    inner: "#f59e0b",  // Chunky gold necklace chains
    accent: "#ffffff", // White drawstrings
  };

  const OUTFIT_VARSITY: OutfitColors = isFemale ? {
    // Photo 4/1 High teen look!
    base: "#ffffff",   // White halter Crop top
    light: "#a3cbd1",  // Light sky-blue baggy jeans
    dark: "#0f172a",   // Denim shadow
    inner: "#f8fafc",  // Halter base flat
    accent: "#fd79a8", // Vivid pink side hanging sash strap
  } : {
    base: "#9d174d",   // Carmine varsity jacket
    light: "#f1f5f9",  // White leather sleeve contrast
    dark: "#4d0727",   // Drop shadow folds
    inner: "#1e293b",  // Dark sports inner jersey
    accent: "#fbbf24", // Gold emblem letter
  };

  const OUTFIT_DEMON: OutfitColors = {
    // Photo 5 / Male Photo 3 match (Oriental Robe duromagi navy styling)
    base: "#111827",   // Midnight-blue warrior robe base
    light: "#1f2937",  // Outer coat trim
    dark: "#030712",   // Shadows of robe fold
    inner: "#ffffff",  // White traditional lining collar
    accent: "#dc2626", // Crimson collar lapel borders and belts!
  };

  const OUTFIT_PRINCESS: OutfitColors = isFemale ? {
    // Photo 2 Summer Romantic White Gown with violet checkers
    base: "#ffffff",   // Pure romantic white gown body
    light: "#f1f5f9",  // Drapery shades
    dark: "#a855f7",   // Violet cross stitch/checks on hem
    inner: "#c084fc",  // Purple shoes and bodice ribbon
    accent: "#c084fc", // Purple waistband ribbon
  } : {
    // Royal Prince Tuxedo suit
    base: "#0284c7",   // Royal sky blue coat tail
    light: "#f8fafc",  // Formal crisp white pants
    dark: "#0369a1",   // Shadows
    inner: "#ffffff",  // Starched ruffle shirt collar
    accent: "#fbbf24", // Gold shoulder epaulets and buttons
  };

  const OUTFIT_LAB_COAT: OutfitColors = {
    // Image 3: Intellectual long lab white coat
    base: "#f8fafc",   // Pure white long lab coat
    light: "#cbd5e1",  // Slate gray coat folds
    dark: "#111111",   // Under high-neck dark shirt / dark skirt
    inner: "#92400e",  // Leather brown belts / straps
    accent: "#1e293b", // Slate black trousers or boots
  };

  const oc: OutfitColors = (() => {
    switch (outfit) {
      case "hoodie": return OUTFIT_HOODIE;
      case "varsity": return OUTFIT_VARSITY;
      case "demon": return OUTFIT_DEMON;
      case "princess": return OUTFIT_PRINCESS;
      case "lab_coat": return OUTFIT_LAB_COAT;
      case "uniform":
      default: return OUTFIT_UNIFORM;
    }
  })();

  const getPantsColor = () => {
    if (outfit === "demon") return "#ffffff"; // Oriental white robes trousers (Photo 4/5 match!)
    if (outfit === "princess") return isFemale ? "#ffffff" : "#f8fafc"; // White romantic draft dress skirt layer
    if (outfit === "hoodie" && isFemale) return "#0f172a"; // Tech-black cargo pants
    if (outfit === "hoodie" && !isFemale) return "#334155"; // Baggy slate grey
    if (outfit === "varsity" && isFemale) return "#a3cbd1"; // Light sky-blue denim jeans (Photo 4 match!)
    if (outfit === "varsity" && !isFemale) return "#1d4ed8"; // Sports blue jeans
    if (outfit === "lab_coat") return "#111111"; // Black jeans/skirt
    return "#334155"; // Default school grey
  };

  const getPantsHighlight = () => {
    if (outfit === "demon") return "#f1f5f9";
    if (outfit === "princess") return "#ffffff";
    if (outfit === "hoodie" && isFemale) return "#1e293b";
    if (outfit === "varsity" && isFemale) return "#c5e2e6";
    return "#475569";
  };

  const pantsColor = getPantsColor();
  const pantsHighlight = getPantsHighlight();

  // Vertical walk compression for head-bobbing organic bounce (Frames 1 & 3 are down-frames)
  const isBob = isWalking && (animPhase === 1 || animPhase === 3);
  const headBobOffset = isBob ? 1 : 0;

  return (
    <svg
      width={40 * scale}
      height={53 * scale}
      viewBox="0 0 24 31"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={`${className} select-none overflow-visible`}
      style={{
        imageRendering: "pixelated",
        transform: isLeft ? "scaleX(-1)" : "none",
      }}
    >
      <style>
        {`
          @keyframes pixel-idle-breath {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(1px); }
          }
          .pixel-animated-group {
            animation: ${isIdle && !isWalking ? "pixel-idle-breath 1.2s steps(2) infinite" : "none"};
          }
          .pixel-ambient-shadow {
            fill: rgba(0, 0, 0, 0.32);
          }
        `}
      </style>

      {/* =========================================================================
          PERSPECTIVE SWITCH: FRONT, BACK, and SIDE views completely separated
          ========================================================================= */}

      {isBack ? (
        // ======================== [BACK VIEW] ========================
        <g>
          {/* Ground Foot Shadow */}
          <rect x="6" y="29" width="12" height="1" className="pixel-ambient-shadow" />
          <rect x="7" y="30" width="10" height="1" className="pixel-ambient-shadow" />

          {/* Symmetrical Legs & Shoes (Back Soles) */}
          <g>
            {/* Left Leg */}
            <g style={{ transform: isWalking && animPhase === 1 ? "translateY(-1px)" : "none" }}>
              <rect x="7" y="20" width="4" height="9" fill={OUTLINE} />
              <rect x="8" y="21" width="2" height="7" fill={pantsColor} />
              <rect x="6" y="27" width="5" height="3" fill={OUTLINE} />
              <rect x="7" y="28" width="3" height="1" fill="#1e293b" />
            </g>
            {/* Right Leg */}
            <g style={{ transform: isWalking && animPhase === 3 ? "translateY(-1px)" : "none" }}>
              <rect x="13" y="20" width="4" height="9" fill={OUTLINE} />
              <rect x="14" y="21" width="2" height="7" fill={pantsColor} />
              <rect x="13" y="27" width="5" height="3" fill={OUTLINE} />
              <rect x="14" y="28" width="3" height="1" fill="#1e293b" />
            </g>
          </g>

          {/* UPPER BODY GROUP: Bobs during Idle (via pixel-animated-group) and/or dynamic walker head bobs */}
          <g className="pixel-animated-group">
            {/* Torso / Outfits (Back drape of jackets and cloaks) */}
            <g style={{ transform: `translateY(${headBobOffset}px)` }}>
            {/* Outerwear Base back Outline */}
            <rect x="5" y="12" width="14" height="9" fill={OUTLINE} />

            {/* Arms Back (Left / Right sleeves with walk swing) */}
            <g>
              {/* Left Arm */}
              <g style={{ transform: isWalking ? (animPhase === 1 ? "translateY(1px) translateX(-0.5px)" : animPhase === 3 ? "translateY(-1px) translateX(0.5px)" : "none") : "none" }}>
                <rect x="4" y="12" width="4" height="8" fill={OUTLINE} />
                <rect x="5" y="13" width="2" height="6" fill={oc.base} />
                {outfit === "hoodie" && isFemale && <rect x="5" y="13" width="1" height="6" fill={oc.neon} />}
              </g>
              {/* Right Arm */}
              <g style={{ transform: isWalking ? (animPhase === 1 ? "translateY(-1px) translateX(-0.5px)" : animPhase === 3 ? "translateY(1px) translateX(0.5px)" : "none") : "none" }}>
                <rect x="16" y="12" width="4" height="8" fill={OUTLINE} />
                <rect x="17" y="13" width="2" height="6" fill={oc.base} />
                {outfit === "hoodie" && isFemale && <rect x="17" y="13" width="1" height="6" fill={oc.neon} />}
              </g>
            </g>

            {/* Back Jacket/Dress Fill */}
            <rect x="6" y="13" width="12" height="8" fill={oc.base} />
            <rect x="6" y="13" width="12" height="1" fill={oc.light} opacity="0.5" />
            <rect x="6" y="20" width="12" height="1" fill={oc.dark} />

            {/* Demon Dual Capes Back representation (Photo 5) */}
            {outfit === "demon" && (
              <g>
                <rect x="3" y="12" width="2" height="10" fill={OUTLINE} />
                <rect x="4" y="13" width="1" height="9" fill={oc.light} />
                <rect x="19" y="12" width="2" height="10" fill={OUTLINE} />
                <rect x="19" y="13" width="1" height="9" fill={oc.light} />
                {/* Red waist sash back */}
                <rect x="6" y="17" width="12" height="2" fill={oc.inner} />
              </g>
            )}

            {/* Princess gown ruffles back (Photo 2) */}
            {outfit === "princess" && isFemale && (
              <g>
                <rect x="4" y="17" width="16" height="5" fill={OUTLINE} />
                <rect x="5" y="18" width="14" height="4" fill={oc.base} />
                <rect x="5" y="18" width="14" height="1" fill={oc.light} opacity="0.6" />
                <rect x="7" y="20" width="10" height="2" fill={oc.dark} />
              </g>
            )}

            {/* High-teen pink back sash (Photo 4) */}
            {outfit === "varsity" && isFemale && (
              <g>
                <rect x="6" y="17" width="12" height="1.5" fill={oc.accent} />
              </g>
            )}

            {/* Tech Emerald Hoodie with cyan strap lines back (Photo 1) */}
            {outfit === "hoodie" && isFemale && (
              <g>
                <rect x="7" y="11" width="10" height="4" fill={OUTLINE} />
                <rect x="8" y="11" width="8" height="3" fill={oc.base} />
                <rect x="8" y="13" width="8" height="1" fill={oc.neon} />
              </g>
            )}
          </g>

          {/* Head & Rich Volumetric Back Hair */}
          <g style={{ transform: `translateY(${headBobOffset}px)` }}>
            {/* Neck Structure */}
            <rect x="9" y="11" width="6" height="3" fill={OUTLINE} />
            <rect x="10" y="11" width="4" height="2" fill={SKIN_SHADOW} />

            {/* Volumetric skull with condensed width and circular rounded crown */}
            {/* y="2" Top cap of the dome */}
            <rect x="8" y="2" width="8" height="1" fill={OUTLINE} />

            {/* y="3" Semi-top of the dome with subtle highlight sheen shine */}
            <rect x="7" y="3" width="10" height="1" fill={OUTLINE} />
            <rect x="8" y="3" width="8" height="1" fill={hc.base} />
            <rect x="9.5" y="3" width="5" height="1.0" fill={hc.light} />

            {/* Main curved head body (snugger width 12 outline - conditional on gender) */}
            {isFemale ? (
              <g>
                {/* Tapered back hair outline - softer and narrower at the bottom */}
                <rect x="6" y="4" width="12" height="6" fill={OUTLINE} />
                <rect x="6.5" y="10" width="11" height="1" fill={OUTLINE} />
                <rect x="7.5" y="11" width="9" height="2" fill={OUTLINE} />

                <rect x="7" y="4" width="10" height="6" fill={hc.base} />
                <rect x="7.5" y="10" width="9" height="1" fill={hc.base} />

                {/* Glossy Sheen Ribbon Highlight back */}
                <rect x="8" y="4.5" width="8" height="1.2" fill={hc.light} />

                {/* Bottom tips layered in deep rich dark hair shadows - narrow and elegant */}
                <rect x="8.5" y="11" width="7" height="2" fill={hc.dark} />
              </g>
            ) : (
              <g>
                {/* Head outer bounding outline up to neck nape - stepped to form a smooth circular taper */}
                <rect x="6" y="4" width="12" height="4.5" fill={OUTLINE} />
                <rect x="6.5" y="8.5" width="11" height="1" fill={OUTLINE} />
                <rect x="7.5" y="9.5" width="9" height="1.2" fill={OUTLINE} />

                {/* Hair crown base and sheen highlight */}
                <rect x="7" y="4" width="10" height="4" fill={hc.base} />
                <rect x="8" y="4.5" width="8" height="1.2" fill={hc.light} />

                {/* Symmetrical curved shadow hairline layer */}
                <rect x="7" y="7.5" width="10" height="1" fill={hc.dark} />
                <rect x="7.5" y="8.5" width="9" height="1" fill={hc.dark} />

                {/* Male cropped hairline style exposing back head skin / side ears back tips */}
                <rect x="7" y="8.5" width="0.8" height="1.5" fill={SKIN_SHADOW} />
                <rect x="16.2" y="8.5" width="0.8" height="1.5" fill={SKIN_SHADOW} />

                {/* Snug nape skin of the neck peeking at back */}
                <rect x="7.8" y="8.5" width="8.4" height="2" fill={SKIN_BASE} />
                <rect x="7.8" y="8.5" width="8.4" height="0.6" fill={SKIN_SHADOW} />

                {/* Symmetrical cropped bottom hairline finishing accents to soften the shape */}
                <rect x="7.5" y="9.5" width="1" height="0.8" fill={hc.dark} />
                <rect x="15.5" y="9.5" width="1" height="0.8" fill={hc.dark} />

                {/* Soft underlying bottom outline wrapper to curve the base toward the neck */}
                <rect x="8" y="10.5" width="8" height="0.5" fill={OUTLINE} />
              </g>
            )}

            {/* Special Long cascades for wavy/twin-tail back */}
            {hair === "wavy_long" && (
              <g>
                {/* Tapered back wavy outline */}
                <rect x="5" y="10" width="14" height="4" fill={OUTLINE} />
                <rect x="5.5" y="14" width="13" height="3" fill={OUTLINE} />
                <rect x="6.5" y="17" width="11" height="2" fill={OUTLINE} />

                {/* Base hair fill */}
                <rect x="6" y="10" width="12" height="4" fill={hc.base} />
                <rect x="6.5" y="14" width="11" height="2" fill={hc.base} />

                {/* Dark hair shadow/tips at bottom */}
                <rect x="6.5" y="16" width="11" height="1" fill={hc.dark} />
                <rect x="7.5" y="17" width="9" height="2" fill={hc.dark} />
              </g>
            )}
            {hair === "twin_tail" && (
              <g>
                {/* Twin-tails hanging on each side - condensed slightly */}
                <rect x="3" y="8" width="3" height="10" fill={OUTLINE} />
                <rect x="4" y="9" width="1.5" height="8" fill={hc.base} />
                <rect x="4" y="14" width="1.5" height="3" fill={hc.dark} />
                <rect x="18" y="8" width="3" height="10" fill={OUTLINE} />
                <rect x="18.5" y="9" width="1.5" height="8" fill={hc.base} />
                <rect x="18.5" y="14" width="1.5" height="3" fill={hc.dark} />
              </g>
            )}
            {hair === "pink_wave" && (
              <g>
                <rect x="4" y="9" width="2" height="5" fill={OUTLINE} />
                <rect x="18" y="9" width="2" height="5" fill={OUTLINE} />
              </g>
            )}
          </g>

          {/* Hats mapped from back view */}
          <g style={{ transform: `translateY(${headBobOffset}px)` }}>
            {hat === "crown" && (
              <g style={{ transform: "translateY(-1px) scale(0.95)", transformOrigin: "12px 3px" }}>
                <rect x="5" y="-3" width="14" height="7" fill={OUTLINE} />
                <rect x="6" y="1" width="12" height="3" fill="#d97706" />
                <rect x="6" y="-1" width="2" height="2" fill="#d97706" />
                <rect x="11" y="-2" width="2" height="3" fill="#d97706" />
                <rect x="16" y="-1" width="2" height="2" fill="#d97706" />
              </g>
            )}
            {hat === "red_ribbon" && (
              <g style={{ transform: "translate(4px, 0px)" }}>
                <rect x="7" y="1" width="10" height="5" fill={OUTLINE} />
                <rect x="8" y="2" width="8" height="3" fill="#991b1b" />
              </g>
            )}
            {hat === "wizard_hat" && (
              <g style={{ transform: "translateY(-4px)" }}>
                <rect x="3" y="4" width="18" height="3" fill={OUTLINE} />
                <rect x="7" y="-2" width="10" height="7" fill={OUTLINE} />
                <rect x="10" y="-4" width="4" height="3" fill={OUTLINE} />
                <rect x="4" y="5" width="16" height="1" fill="#1e1b4b" />
              </g>
            )}
            {hat === "straw_hat" && (
              <g style={{ transform: "translateY(-1px)" }}>
                {/* Back Floppy straw hat brim */}
                <rect x="2" y="3.5" width="20" height="2" fill="#d97706" stroke={OUTLINE} strokeWidth="0.8" />
                {/* Crown of back view */}
                <rect x="6" y="-0.5" width="12" height="4.5" fill={OUTLINE} />
                <rect x="7" y="0" width="10" height="3" fill="#eab308" />

                {/* Dark brown band */}
                <rect x="6.5" y="2.5" width="11" height="1" fill="#78350f" />

                {/* Soft double white satin laces draping behind past shoulders in back view */}
                <rect x="9.5" y="4.5" width="1.2" height="7.5" fill="#f1f5f9" stroke={OUTLINE} strokeWidth="0.6" />
                <rect x="13.2" y="4.5" width="1.2" height="7.5" fill="#f1f5f9" stroke={OUTLINE} strokeWidth="0.6" />
                <rect x="9.5" y="4.8" width="0.6" height="6" fill="#ffffff" />
                <rect x="13.2" y="4.8" width="0.6" height="6" fill="#ffffff" />
              </g>
            )}
          </g>
          </g>
        </g>
      ) : isSide ? (
        // ======================== [SIDE VIEW] ========================
        <g>
          {/* Ground Foot Shadow */}
          <rect x="7" y="29" width="10" height="1" className="pixel-ambient-shadow" />
          <rect x="8" y="30" width="8" height="1" className="pixel-ambient-shadow" />

          {/* Legs scissoring cleanly when walking */}
          <g>
            {/* Front Leg */}
            <g style={{ transform: isWalking ? `translateX(${animPhase === 1 ? "-1px" : animPhase === 3 ? "1px" : "0px"}) translateY(${animPhase % 2 === 1 ? "-1px" : "0px"})` : "none" }}>
              <rect x="8" y="20" width="4" height="9" fill={OUTLINE} />
              <rect x="9" y="21" width="2" height="7" fill={pantsColor} />
              <rect x="9" y="21" width="1" height="6" fill={pantsHighlight} />
              <rect x="8" y="27" width="5" height="3" fill={OUTLINE} />
              <rect x="9" y="28" width="3" height="1" fill="#e2e8f0" />
            </g>
            {/* Back Leg (dimmed overlay) */}
            <g style={{ transform: isWalking ? `translateX(${animPhase === 1 ? "1px" : animPhase === 3 ? "-1px" : "0px"})` : "none" }}>
              <rect x="12" y="20" width="4" height="9" fill={OUTLINE} />
              <rect x="13" y="21" width="2" height="7" fill={pantsColor} opacity="0.85" />
              <rect x="12" y="27" width="5" height="3" fill={OUTLINE} />
              <rect x="13" y="28" width="3" height="1" fill="#94a3b8" />
            </g>
          </g>

          {/* UPPER BODY GROUP: Bobs during Idle (via pixel-animated-group) and/or dynamic walker head bobs */}
          <g className="pixel-animated-group">
            {/* Background Arm profile (only visible during walking swings) - drawn behind torso */}
            {isWalking && (
              <g style={{ transform: animPhase === 1 ? "translateY(1px) translateX(-1.5px)" : animPhase === 3 ? "translateY(-1px) translateX(1.5px)" : "none" }}>
                <rect x="11" y="12" width="4" height="8" fill={OUTLINE} opacity="0.8" />
                <rect x="12" y="13" width="2" height="6" fill={oc.dark} />
                <rect x="12" y="19" width="2" height="1" fill={SKIN_SHADOW} />
              </g>
            )}

            {/* Torso & Profiles in Side view */}
            <g style={{ transform: `translateY(${headBobOffset}px)` }}>
            {/* Torso Silhouette Outline */}
            <rect x="7" y="12" width="9" height="9" fill={OUTLINE} />

            {/* Torso Base */}
            <rect x="8" y="13" width="7" height="7" fill={oc.base} />
            <rect x="8" y="13" width="2" height="6" fill={oc.light} opacity="0.4" />

            {/* Princess skirt / Demon sash back profile overlays */}
            {outfit === "princess" && isFemale && (
              <rect x="5.5" y="16" width="10" height="6" fill={oc.base} stroke={OUTLINE} strokeWidth="1" />
            )}
            {outfit === "demon" && (
              <g>
                <rect x="5.5" y="13" width="2" height="9" fill={oc.light} stroke={OUTLINE} strokeWidth="1" />
                <rect x="8" y="17" width="3" height="2" fill={oc.inner} />
              </g>
            )}

            <rect x="8" y="19" width="7" height="1" fill={oc.dark} />

            {/* Profile Outfit features */}
            {outfit === "uniform" && (
              <g>
                <rect x="12" y="13" width="2" height="2" fill="#ffffff" />
                <rect x="12" y="14" width="1" height="3" fill={oc.accent} />
              </g>
            )}
            {outfit === "varsity" && isFemale && (
              <g>
                <rect x="10" y="13" width="3" height="3" fill={oc.inner} />
                <rect x="11" y="17" width="2" height="1" fill={oc.accent} />
              </g>
            )}
            {outfit === "hoodie" && isFemale && (
              <g>
                <rect x="11" y="13" width="2" height="3" fill={oc.inner} />
                <rect x="9" y="14" width="2" height="1" fill={oc.neon} />
              </g>
            )}

            {/* Dominant Front Arm profile (Swings opposite to back arm) */}
            <g style={{ transform: isWalking ? (animPhase === 1 ? "translateY(-1px) translateX(1.5px)" : animPhase === 3 ? "translateY(1px) translateX(-1.5px)" : "none") : "none" }}>
              <rect x="9" y="12" width="4" height="8" fill={OUTLINE} />
              <rect x="10" y="13" width="2" height="6" fill={oc.base} />
              {outfit === "hoodie" && isFemale && <rect x="10" y="13" width="1" height="6" fill={oc.neon} />}
              <rect x="10" y="19" width="2" height="1" fill={SKIN_BASE} />
            </g>
          </g>

          {/* Head Skull with elegant tapered profiles */}
          <g style={{ transform: `translateY(${headBobOffset}px)` }}>
            {/* Back hair layers falling behind profile face (squeezed/reduced horizontally) */}
            <g>
              {hair === "wavy_long" && (
                <g>
                  <rect x="5.0" y="3" width="4.0" height="15" fill={OUTLINE} />
                  <rect x="6.0" y="3.5" width="2.6" height="13.5" fill={hc.base} />
                  <rect x="6.0" y="13" width="2.6" height="4" fill={hc.dark} />
                </g>
              )}
              {hair === "twin_tail" && (
                <g>
                  <rect x="4.2" y="3" width="4.0" height="15" fill={OUTLINE} />
                  <rect x="5.2" y="3.5" width="2.8" height="13.5" fill={hc.base} />
                </g>
              )}
              {hair === "pink_wave" && (
                <g>
                  <rect x="5.0" y="3" width="3.7" height="11" fill={OUTLINE} />
                  <rect x="6.0" y="3.5" width="2.4" height="9.5" fill={hc.base} />
                </g>
              )}
              {isFemale && hair === "bob_chic" && (
                <g>
                  {/* Chic rounded bob back hair draping */}
                  <rect x="5.2" y="3" width="3.3" height="9" fill={OUTLINE} />
                  <rect x="6.0" y="11" width="2.5" height="1" fill={OUTLINE} />
                  <rect x="6.0" y="3.5" width="2.2" height="8" fill={hc.base} />
                  <rect x="6.0" y="10" width="2.2" height="1" fill={hc.dark} />
                </g>
              )}
              {isFemale && hair !== "wavy_long" && hair !== "twin_tail" && hair !== "pink_wave" && hair !== "bob_chic" && (
                <g>
                  {/* Elegant natural short hairline curve - extended higher and fuller */}
                  <rect x="5.8" y="3" width="2.2" height="6.5" fill={OUTLINE} />
                  <rect x="6.8" y="3.5" width="1.4" height="5.5" fill={hc.base} />
                  <rect x="6.8" y="7.5" width="1.2" height="1.5" fill={hc.dark} />
                </g>
              )}
              {(!isFemale) && (
                <g>
                  {/* Snug neat hug around back of the skull - extended higher to blend with the crown */}
                  <rect x="5.8" y="3" width="2.2" height="6" fill={OUTLINE} />
                  <rect x="6.8" y="3.5" width="1.4" height="5" fill={hc.base} />
                  <rect x="6.8" y="7" width="1.2" height="1.5" fill={hc.dark} />
                </g>
              )}
            </g>

            {/* Neck outline & Neck flesh */}
            <rect x="8" y="11" width="6" height="3" fill={OUTLINE} />
            <rect x="9" y="11" width="4" height="2" fill={SKIN_SHADOW} />

            {/* BEAUTIFULLY SCULPTED SIDE-PROFILE FACE SHAPE & SKULL OUTLINES */}
            {/* Layer-by-layer outline to construct vertical forehead, cute nose protrusion, indented lips, and well-defined chin */}
            <rect x="7" y="4" width="10" height="4" fill={OUTLINE} /> {/* y=4..7: back/top skull to forehead */}
            <rect x="7" y="8" width="11" height="1" fill={OUTLINE} /> {/* y=8: nose tip extends to x=17 */}
            <rect x="8" y="9" width="9" height="1" fill={OUTLINE} /> {/* y=9: mouth/lip indent to x=16 */}
            <rect x="9" y="10" width="8" height="1" fill={OUTLINE} /> {/* y=10: majestic chin at x=16 */}
            <rect x="9" y="11" width="6" height="1" fill={OUTLINE} /> {/* y=11: under-jaw connects to throat */}

            {/* Base Skin Fills perfectly aligned with the sculpted outlines */}
            <rect x="8" y="5" width="8" height="3" fill={SKIN_BASE} /> {/* y=5..7: forehead skin */}
            <rect x="8" y="8" width="9" height="1" fill={SKIN_BASE} /> {/* y=8: nose bridge skin extends to x=16 */}
            <rect x="9" y="9" width="7" height="1" fill={SKIN_BASE} /> {/* y=9: cheek/lip skin to x=15 */}
            <rect x="10" y="10" width="6" height="1" fill={SKIN_BASE} /> {/* y=10: chin skin to x=15 */}
            <rect x="10" y="11" width="4" height="1" fill={SKIN_BASE} /> {/* y=11: jaw under-flesh */}

            {/* Forehead Shadow & back ear shadow curves */}
            <rect x="8" y="5" width="8" height="1" fill={SKIN_SHADOW} />

            {/* Cheeks Blush Profile */}
            {isFemale && (
              <g>
                <rect x="12" y="9" width="3" height="1" fill={SKIN_BLUSH} opacity="0.65" />
                <rect x="13" y="9" width="1" height="1" fill="#ffffff" opacity="0.4" />
              </g>
            )}

            {/* HIGH-RESOLUTION ADVANCED PROFILE EYE AND EYEBROW */}
            {/* Beautiful horizontal eyebrow */}
            <rect x="12" y="5.8" width="1.5" height="0.6" fill={SKIN_SHADOW} />
            {/* Eyelash details */}
            <rect x="11.5" y="6.6" width="2" height="0.6" fill={EYES_PUPIL} />
            {/* White Sclera to the left side */}
            <rect x="12" y="7.2" width="1" height="1.8" fill="#ffffff" />
            {/* Dark pupil in the middle */}
            <rect x="13" y="7" width="1" height="2" fill={EYES_PUPIL} />
            {/* Glossy catchlight gleam sparkle at the top of the pupil */}
            <rect x="13" y="7" width="0.8" height="0.8" fill={EYE_GLEAM} />
            {/* Beautiful colored Iris at the front right side */}
            <rect x="14" y="8" width="1" height="1" fill={EYE_IRIS} />

            {/* PROFILE LIP AND CUST PROTRUDING NOSE */}
            {/* Sweet Lip Accent */}
            <rect x="15" y="9" width="1" height="0.8" fill={LIP} />

            {/* Front Side Hair with elegantly rounded crown */}
            <g>
              <rect x="8.5" y="1.5" width="7" height="1" fill={OUTLINE} />
              <rect x="7" y="2" width="10" height="3" fill={OUTLINE} />
              <rect x="8" y="2.5" width="8" height="2.5" fill={hc.base} />
              <rect x="9.5" y="2.5" width="5" height="1" fill={hc.light} />

              {/* Side burn locks draping */}
              <rect x="6" y="5" width="2" height="6" fill={OUTLINE} />
              <rect x="7" y="5" width="1" height="5" fill={hc.base} />

              {/* Hair filled in the original shadow pixel's spot (x=8, y=6 to 10.5) */}
              <rect x="8" y="5.5" width="1.2" height="5" fill={OUTLINE} />
              <rect x="8" y="6" width="1.2" height="4" fill={hc.base} />
              <rect x="8" y="9" width="1.2" height="1" fill={hc.dark} />

              <rect x="9" y="4.5" width="7" height="2" fill={hc.base} />
              <rect x="10" y="5" width="5" height="2.5" fill={hc.dark} />
              <rect x="11" y="6.5" width="2" height="1" fill={OUTLINE} />
            </g>
          </g>

          {/* Hats */}
          <g style={{ transform: `translateY(${headBobOffset}px)` }}>
            {hat === "crown" && (
              <g style={{ transform: "translateY(-1px) scale(0.95) rotate(2deg)", transformOrigin: "12px 3px" }}>
                <rect x="6" y="-3" width="11" height="7" fill={OUTLINE} />
                <rect x="7" y="1" width="9" height="3" fill="#fbbf24" />
                <rect x="7" y="-1" width="1.5" height="2" fill="#fbbf24" />
                <rect x="11" y="-2" width="2" height="3" fill="#fbbf24" />
                <rect x="15" y="-1" width="1.5" height="2" fill="#fbbf24" />
              </g>
            )}
            {hat === "red_ribbon" && (
              <g style={{ transform: "translate(3px, 1px)" }}>
                <rect x="8" y="1" width="8" height="5" fill={OUTLINE} />
                <rect x="9" y="2" width="6" height="3" fill="#bf2131" />
              </g>
            )}
            {hat === "wizard_hat" && (
              <g style={{ transform: "translateY(-4px)" }}>
                <rect x="5" y="4" width="14" height="3" fill={OUTLINE} />
                <rect x="8" y="-2" width="8" height="7" fill={OUTLINE} />
                <rect x="11" y="-4" width="3" height="3" fill={OUTLINE} />
                <rect x="6" y="5" width="12" height="1" fill="#1e1b4b" />
              </g>
            )}
            {hat === "straw_hat" && (
              <g style={{ transform: "translateY(-1px)" }}>
                {/* Side Straw hat brim */}
                <rect x="3" y="3.5" width="18" height="2" fill="#d97706" stroke={OUTLINE} strokeWidth="0.8" />
                <rect x="7" y="-0.5" width="10" height="4.5" fill={OUTLINE} />
                <rect x="8" y="0" width="8" height="3" fill="#eab308" />
                <rect x="7.5" y="2.5" width="9" height="1" fill="#78350f" />

                {/* Violet blossom cluster (Photo 2 side) */}
                <rect x="13.5" y="1" width="2.5" height="1.8" fill="#c084fc" />

                {/* Single white ribbon dangling in side view */}
                <rect x="14" y="4.5" width="1.2" height="6.5" fill="#f1f5f9" stroke={OUTLINE} strokeWidth="0.6" />
                <rect x="14" y="4.8" width="0.6" height="5" fill="#ffffff" />
              </g>
            )}
          </g>
          </g>
        </g>
      ) : (
        // ======================== [FRONT VIEW] ========================
        <g>
          {/* Ground Ambient Foot Shadow */}
          <rect x="6" y="29" width="12" height="1" className="pixel-ambient-shadow" />
          <rect x="8" y="30" width="8" height="1" className="pixel-ambient-shadow" />

          {/* Symmetrical Legs & Shoes */}
          <g>
            {/* Left Leg group */}
            <g style={{ transform: isWalking && animPhase === 1 ? "translateY(-1px)" : "none" }}>
              <rect x="7" y="20" width="4" height="9" fill={OUTLINE} />
              <rect x="8" y="21" width="2" height="7" fill={pantsColor} />
              <rect x="8" y="21" width="1" height="6" fill={pantsHighlight} />
              {/* Shoes outlines & white rubber sneaker tips */}
              <rect x="6" y="27" width="5" height="3" fill={OUTLINE} />
              <rect x="7" y="28" width="3" height="1" fill="#ffffff" />
              <rect x="7" y="28" width="1" height="1" fill={outfit === "hoodie" && isFemale ? "#2dd4bf" : "#dc2626"} />
              {/* Princess heels walking together with Left Leg (Photo 2) */}
              {outfit === "princess" && isFemale && (
                <rect x="8.5" y="24.5" width="2" height="1" fill={oc.inner} />
              )}
            </g>
            {/* Right Leg group */}
            <g style={{ transform: isWalking && animPhase === 3 ? "translateY(-1px)" : "none" }}>
              <rect x="13" y="20" width="4" height="9" fill={OUTLINE} />
              <rect x="14" y="21" width="2" height="7" fill={pantsColor} />
              <rect x="14" y="21" width="1" height="6" fill={pantsHighlight} />
              <rect x="13" y="27" width="5" height="3" fill={OUTLINE} />
              <rect x="14" y="28" width="3" height="1" fill="#ffffff" />
              <rect x="16" y="28" width="1" height="1" fill={outfit === "hoodie" && isFemale ? "#2dd4bf" : "#dc2626"} />
              {/* Princess heels walking together with Right Leg (Photo 2) */}
              {outfit === "princess" && isFemale && (
                <rect x="13.5" y="24.5" width="2" height="1" fill={oc.inner} />
              )}
            </g>
          </g>

          {/* UPPER BODY GROUP: Bobs during Idle (via pixel-animated-group) and/or dynamic walker head bobs */}
          <g className="pixel-animated-group">
            {/* BACKGROUND HAIR Layer (draped behind face skull - snugger style) */}
            <g style={{ transform: `translateY(${headBobOffset}px)` }}>
            {hair === "wavy_long" && (
              <g>
                <rect x="6" y="4" width="12" height="14" fill={OUTLINE} />
                <rect x="7" y="5" width="10" height="12" fill={hc.base} />
                <rect x="7" y="13" width="10" height="3" fill={hc.dark} />
              </g>
            )}
            {hair === "twin_tail" && (
              <g>
                {/* Flowing golden strands down sides - narrowed */}
                <rect x="4" y="6" width="2.5" height="13" fill={OUTLINE} />
                <rect x="4.5" y="7" width="1.5" height="12" fill={hc.base} />
                <rect x="17.5" y="6" width="2.5" height="13" fill={OUTLINE} />
                <rect x="18" y="7" width="1.5" height="12" fill={hc.base} />
              </g>
            )}
            {hair === "pink_wave" && (
              <g>
                <rect x="5" y="4" width="14" height="10" fill={OUTLINE} />
                <rect x="6" y="5" width="12" height="8" fill={hc.base} />
                <rect x="5" y="9" width="1.5" height="3" fill={hc.dark} />
                <rect x="17.5" y="9" width="1.5" height="3" fill={hc.dark} />
              </g>
            )}
          </g>

          {/* Torso & Outerwear Clothes with elegant high-contrast designs */}
          <g style={{ transform: `translateY(${headBobOffset}px)` }}>
            {/* Outer jacket silhouette outline */}
            <rect x="5" y="12" width="14" height="9" fill={OUTLINE} />

            {/* Symmetrical Left / Right Arms with walking swing */}
            <g>
              {/* Left front arm */}
              <g style={{ transform: isWalking ? (animPhase === 1 ? "translateY(1px) translateX(-0.5px)" : animPhase === 3 ? "translateY(-1px) translateX(0.5px)" : "none") : "none" }}>
                <rect x="4" y="12" width="4" height="8" fill={OUTLINE} />
                <rect x="5" y="13" width="2" height="6" fill={oc.base} />
                <rect x="5" y="13" width="1" height="4" fill={oc.light} opacity="0.5" />
                {outfit === "hoodie" && isFemale && <rect x="5" y="13" width="1" height="6" fill={oc.neon} />}
                <rect x="5" y="19" width="2" height="1" fill={SKIN_BASE} />
              </g>
              
              {/* Right front arm */}
              <g style={{ transform: isWalking ? (animPhase === 1 ? "translateY(-1px) translateX(-0.5px)" : animPhase === 3 ? "translateY(1px) translateX(0.5px)" : "none") : "none" }}>
                <rect x="16" y="12" width="4" height="8" fill={OUTLINE} />
                <rect x="17" y="13" width="2" height="6" fill={oc.base} />
                <rect x="17" y="13" width="1" height="4" fill={oc.light} opacity="0.5" />
                {outfit === "hoodie" && isFemale && <rect x="17" y="13" width="1" height="6" fill={oc.neon} />}
                <rect x="17" y="19" width="2" height="1" fill={SKIN_BASE} />
              </g>
            </g>

            {/* Jacket body center board */}
            <rect x="6" y="13" width="12" height="8" fill={oc.base} />
            <rect x="6" y="13" width="1" height="7" fill={oc.light} opacity="0.45" />
            <rect x="6" y="20" width="12" height="1" fill={oc.dark} />

            {/* Demon Fighter back flying capes (Photo 5) */}
            {outfit === "demon" && (
              <g>
                <rect x="2" y="12" width="2" height="10" fill={OUTLINE} />
                <rect x="3" y="13" width="1" height="9" fill={oc.light} />
                <rect x="20" y="12" width="2" height="10" fill={OUTLINE} />
                <rect x="20" y="13" width="1" height="9" fill={oc.light} />
              </g>
            )}

            {/* Outfit specific premium details */}
            {outfit === "uniform" && (
              isFemale ? (
                // Girls Sailor Suit
                <g>
                  <rect x="9" y="13" width="6" height="3" fill="#ffffff" /> {/* white blouse */}
                  <rect x="9" y="13" width="6" height="1" fill={oc.base} /> {/* sailor navy collar flap */}
                  <rect x="11" y="14.5" width="2" height="2.5" fill={oc.accent} /> {/* red sweet ribbon bow */}
                  <rect x="11.5" y="14" width="1" height="1" fill={OUTLINE} />
                  {/* Pleated Skirt */}
                  <rect x="7" y="17.5" width="10" height="3.5" fill={OUTLINE} />
                  <rect x="8" y="18" width="8" height="3" fill={oc.dark} />
                  <rect x="9" y="18" width="1" height="3" fill={oc.base} />
                  <rect x="12" y="18" width="1" height="3" fill={oc.base} />
                  <rect x="14" y="18" width="1" height="3" fill={oc.base} />
                </g>
              ) : (
                // Boys Suit
                <g>
                  <rect x="10" y="13" width="4" height="2" fill="#ffffff" />
                  <rect x="11" y="14" width="2" height="5" fill={OUTLINE} />
                  <rect x="11" y="14" width="1" height="4" fill={oc.accent} />
                  
                  <rect x="8" y="15" width="1" height="1" fill="#e2e8f0" />
                  <rect x="14" y="15" width="1" height="1" fill="#f59e0b" />
                  <rect x="14" y="17" width="1" height="1" fill="#f59e0b" />
                </g>
              )
            )}

            {outfit === "varsity" && (
              isFemale ? (
                // Photo 4/1 High teen spec: white crop halter top, baggy jeans, hanging pink strap & white micro bag
                <g>
                  {/* White halter top */}
                  <rect x="9" y="13" width="6" height="3" fill="#ffffff" stroke={OUTLINE} strokeWidth="0.6" />
                  <rect x="10.5" y="12" width="3" height="1" fill="#ffffff" />
                  
                  {/* Exposed midriff */}
                  <rect x="8" y="15.8" width="8" height="1.2" fill={SKIN_BASE} />

                  {/* Denim Jeans */}
                  <rect x="7" y="17" width="10" height="4.5" fill={OUTLINE} />
                  <rect x="8" y="17.5" width="8" height="3.5" fill={oc.light} />
                  
                  {/* Pink waistband belt & dangling strap (Photo 4) */}
                  <rect x="7.8" y="17" width="8.4" height="0.8" fill={oc.accent} />
                  <rect x="13.5" y="17.5" width="1" height="4" fill={oc.accent} /> {/* hanging belt tail */}
                  <rect x="11.2" y="16.8" width="1.6" height="1.2" fill="#e2e8f0" /> {/* chrome buckle */}

                  {/* Elegant White Micro Handbag held in left hand dangling down (Photo 1/4) */}
                  <g>
                    {/* Hand strap */}
                    <path d="M 4 13.5 C 4.5 12, 5.5 12, 6 13.5" stroke="#475569" strokeWidth="0.8" fill="none" />
                    {/* Micro handbag body */}
                    <rect x="3" y="14.5" width="3.5" height="3" fill="#ffffff" stroke={OUTLINE} strokeWidth="0.8" rx="0.5" />
                    {/* Silver lock pin */}
                    <rect x="4.3" y="15.8" width="0.8" height="0.8" fill="#cbd5e1" />
                  </g>
                </g>
              ) : (
                // Boys Varsity
                <g>
                  <rect x="6" y="13" width="1.5" height="7" fill={oc.light} />
                  <rect x="16.5" y="13" width="1.5" height="7" fill={oc.light} />
                  <rect x="10" y="13" width="4" height="5" fill="#1e293b" />
                  <rect x="11" y="14" width="2" height="4" fill={oc.inner} />
                  <rect x="8" y="15" width="1" height="1" fill="#f59e0b" />
                </g>
              )
            )}

            {outfit === "hoodie" && (
              isFemale ? (
                // Image 1: Emerald Tech hoodie
                <g>
                  <rect x="8" y="13" width="8" height="3" fill="#cbd5e1" />
                  <rect x="8" y="13" width="8" height="2" fill={oc.inner} />
                  
                  <rect x="8" y="15.5" width="8" height="1.5" fill={SKIN_BASE} />
                  <rect x="8" y="15.5" width="2" height="1" fill={SKIN_SHADOW} />

                  <rect x="7" y="17" width="10" height="1" fill={oc.dark} />
                  <rect x="11" y="17" width="2" height="1" fill="#e2e8f0" />
                  <rect x="8" y="18" width="8" height="2" fill={pantsColor} />

                  <rect x="8" y="19" width="3" height="1" fill={oc.neon} />
                  <rect x="13" y="19" width="3" height="1" fill={oc.neon} />
                </g>
              ) : (
                // Boys Street Hoodie
                <g>
                  <rect x="8" y="13" width="8" height="5" fill={oc.base} />
                  <rect x="10" y="14" width="4" height="2" fill={oc.dark} />
                  <rect x="10" y="14.5" width="4" height="0.8" fill={oc.inner} /> {/* Gold chain blink */}
                  <rect x="9" y="18" width="6" height="2" fill={pantsColor} />
                </g>
              )
            )}

            {outfit === "demon" && (
              // Photo 5 / Male Photo 3 match (Oriental midnight-blue duromagi robes)
              <g>
                {/* Midnight coat robe shell */}
                <rect x="6.5" y="13" width="11" height="9" fill={oc.base} stroke={OUTLINE} strokeWidth="0.8" />
                
                {/* V-cut white starched underwear layer */}
                <path d="M 9.5 13 L 12 16.5 L 14.5 13 Z" fill={oc.inner} />
                
                {/* Side sleeve edge fold trim with brown leather tassel fur highlights */}
                <rect x="5.5" y="14" width="1.2" height="4" fill="#b45309" stroke={OUTLINE} strokeWidth="0.8" />
                <rect x="17.3" y="14" width="1.2" height="4" fill="#b45309" stroke={OUTLINE} strokeWidth="0.8" />

                {/* Royal crimson collar contours */}
                <path d="M 9.5 13 L 12 16 M 14.5 13 L 12 16" stroke={oc.accent} strokeWidth="1" fill="none" />

                {/* Symmetrical crimson waistband rope with hanging knot tassles (Photo 5) */}
                <rect x="7.5" y="16.5" width="9" height="1.2" fill={oc.accent} />
                <rect x="7.5" y="16.5" width="9" height="1.2" fill="#ffffff" stroke={oc.accent} strokeWidth="0.4" strokeDasharray="1.5,1.5" /> {/* patterned weave belt */}
                <rect x="9.5" y="17.7" width="1.2" height="4" fill={oc.accent} /> {/* hanging tassel cord */}
                <rect x="9.5" y="21" width="1.5" height="0.8" fill="#eab308" /> {/* gold tassel metal decoration */}

                {/* White trousers layer peeking through the bottom */}
                <rect x="8.5" y="21" width="7" height="1" fill="#ffffff" />
              </g>
            )}

            {outfit === "princess" && (
              isFemale ? (
                // Photo 2 Summer Romantic style: off-shoulder white romantic midi gown + violet diamond chess checkers + purple heels
                <g>
                  {/* Exposed neck skin decollete */}
                  <rect x="8" y="12" width="8" height="1.5" fill={SKIN_BASE} />

                  {/* Bodice details (Pure White off-shoulder corseted top) */}
                  <rect x="7.5" y="13.2" width="9" height="3.5" fill="#ffffff" stroke={OUTLINE} strokeWidth="0.8" />
                  <rect x="10.5" y="13.5" width="3" height="3" fill="#f8fafc" />
                  <circle cx="12" cy="14.8" r="0.8" fill={oc.inner} /> {/* purple flower amethyst gemstone on chest */}

                  {/* Violet Waistband Bow Ribbon */}
                  <rect x="7.5" y="16.2" width="9" height="1.2" fill={oc.accent} />

                  {/* Flowing flare skirt full outline */}
                  <rect x="4.8" y="17" width="14.4" height="5.5" fill={OUTLINE} />
                  <rect x="5.5" y="17.5" width="13" height="4.5" fill="#ffffff" />

                  {/* Amethyst violet lattice checker patterns on the skirt hemline (Photo 2) */}
                  <g fill={oc.dark}>
                    {/* Grid crossing dots */}
                    <rect x="6.5" y="19" width="1.2" height="1.2" />
                    <rect x="9.5" y="19" width="1.2" height="1.2" />
                    <rect x="12.5" y="19" width="1.2" height="1.2" />
                    <rect x="15.5" y="19" width="1.2" height="1.2" />

                    <rect x="8" y="20" width="1.2" height="1.2" />
                    <rect x="11" y="20" width="1.2" height="1.2" />
                    <rect x="14" y="20" width="1.2" height="1.2" />
                    <rect x="17" y="20" width="1.2" height="1.2" />
                  </g>
                </g>
              ) : (
                // Royal Prince Blue coat tux
                <g>
                  <rect x="9" y="13" width="6" height="5" fill="#f8fafc" /> {/* Formal white shirt waist coat */}
                  <rect x="11" y="13.5" width="2" height="4" fill="#ffffff" />
                  <rect x="11.5" y="14" width="1" height="2" fill={oc.accent} /> {/* blue cravat gold button */}

                  {/* Gold epaulets on shoulders */}
                  <rect x="5.5" y="12.5" width="2.5" height="1" fill={oc.accent} />
                  <rect x="16" y="12.5" width="2.5" height="1" fill={oc.accent} />

                  {/* Vest borders sky blue */}
                  <rect x="7" y="13" width="2" height="6.5" fill={oc.base} />
                  <rect x="15" y="13" width="2" height="6.5" fill={oc.base} />
                </g>
              )
            )}

            {outfit === "lab_coat" && (
              // Image 3: Intellect lab coat
              <g>
                {/* Black undergarment screen */}
                <rect x="9" y="13" width="6" height="5.5" fill={oc.dark} />
                {/* Long White researcher coat panels */}
                <rect x="6" y="13" width="3" height="7.5" fill={oc.base} />
                <rect x="15" y="13" width="3" height="7.5" fill={oc.base} />
                <rect x="8" y="13" width="1" height="7.5" fill={oc.light} />
                <rect x="15" y="13" width="1" height="7.5" fill={oc.light} />

                {/* Brown belt strap */}
                <rect x="9" y="17.5" width="6" height="1" fill={oc.inner} />
                <rect x="11" y="17.5" width="2" height="1" fill="#fbbf24" />
              </g>
            )}

          </g>

          {/* FRONT HEAD SKIN & blushing sparkling JRPG anime eyes */}
          <g style={{ transform: `translateY(${headBobOffset}px)` }}>
            {/* Neck structure */}
            <rect x="9" y="11" width="6" height="3" fill={OUTLINE} />
            <rect x="10" y="11" width="4" height="2" fill={SKIN_SHADOW} />

            {/* HIGH-QUALITY TAPERED ANIME FACE SHAPE SILHOUETTE OUTLINE */}
            <rect x="6" y="4" width="12" height="5" fill={OUTLINE} />
            <rect x="6" y="9" width="12" height="1" fill={OUTLINE} />
            <rect x="7" y="10" width="10" height="1" fill={OUTLINE} />
            <rect x="9" y="11" width="6" height="1" fill={OUTLINE} />

            {/* Skin Base fills precisely matching the tapered silhouette coordinates */}
            <rect x="7" y="5" width="10" height="4" fill={SKIN_BASE} />
            <rect x="7" y="9" width="10" height="1" fill={SKIN_BASE} />
            <rect x="8" y="10" width="8" height="1" fill={SKIN_BASE} />
            <rect x="10" y="11" width="4" height="1" fill={SKIN_BASE} />

            {/* Forehead under-hair shadow plate & side ear shadows */}
            <rect x="7" y="5" width="10" height="1" fill={SKIN_SHADOW} />
            <rect x="7" y="6" width="1" height="4" fill={SKIN_SHADOW} />
            <rect x="16" y="6" width="1" height="4" fill={SKIN_SHADOW} />
            <rect x="8" y="10" width="1" height="1" fill={SKIN_SHADOW} />
            <rect x="15" y="10" width="1" height="1" fill={SKIN_SHADOW} />
            <rect x="10" y="11" width="4" height="1" fill={SKIN_SHADOW} />

            {/* TRANSLUCENT ROSY CHEEK BLUSH */}
            {isFemale && (
              <g opacity="0.7">
                {/* Left Cheek */}
                <rect x="7.5" y="9.5" width="2.2" height="1" fill={SKIN_BLUSH} />
                <rect x="7.5" y="9.5" width="1" height="1" fill="#ffffff" opacity="0.45" />
                {/* Right Cheek */}
                <rect x="14.3" y="9.5" width="2.2" height="1" fill={SKIN_BLUSH} />
                <rect x="14.3" y="9.5" width="1" height="1" fill="#ffffff" opacity="0.45" />
              </g>
            )}

            {/* MAGICAL SPARKLING ANIME RPG EYES (LIT FROM TOP-LEFT) */}
            <g>
              {/* Symmetrical Lash line/eyebrows */}
              <rect x="8" y="6" width="2" height="1" fill={SKIN_SHADOW} stroke={SKIN_SHADOW} strokeWidth="0.1" />
              <rect x="14" y="6" width="2" height="1" fill={SKIN_SHADOW} stroke={SKIN_SHADOW} strokeWidth="0.1" />

              {/* Left Eye */}
              <rect x="8" y="7" width="3" height="1" fill="#000000" />
              <rect x="7.3" y="7.3" width="1.2" height="1.2" fill="#000000" /> {/* anime lashes wings */}
              <rect x="10" y="8" width="1" height="2" fill="#ffffff" />
              <rect x="8" y="8" width="2" height="2" fill={EYES_PUPIL} />
              <rect x="9" y="9" width="1" height="1" fill={EYE_IRIS} />
              <rect x="8" y="8" width="1.2" height="1.2" fill={EYE_GLEAM} /> {/* catchlight */}
              {isFemale && <rect x="9" y="8" width="0.8" height="0.8" fill={EYE_GLEAM} opacity="0.5" />} {/* double sparkle for girls */}

              {/* Right Eye */}
              <rect x="13" y="7" width="3" height="1" fill="#000000" />
              <rect x="15.5" y="7.3" width="1.2" height="1.2" fill="#000000" />
              <rect x="13" y="8" width="1" height="2" fill="#ffffff" />
              <rect x="14" y="8" width="2" height="2" fill={EYES_PUPIL} />
              <rect x="14" y="9" width="1" height="1" fill={EYE_IRIS} />
              <rect x="15" y="8" width="1.2" height="1.2" fill={EYE_GLEAM} />
              {isFemale && <rect x="14" y="8" width="0.8" height="0.8" fill={EYE_GLEAM} opacity="0.5" />}
            </g>

            {/* Nose */}
            <rect x="11.5" y="9.2" width="1" height="1" fill={SKIN_SHADOW} opacity="0.6" />

            {/* Sweet happy smiling mouth lip */}
            <rect x="11" y="10" width="2" height="1" fill={OUTLINE} />
            <rect x="11" y="10" width="2" height="0.6" fill={LIP} />
          </g>

          {/* FRONT HAIR SYSTEM */}
          <g style={{ transform: `translateY(${headBobOffset}px)` }}>
            {hair === "neat_dark" && (
              <g>
                {/* Rounded Hair crown */}
                <rect x="7.2" y="1.2" width="9.6" height="1" fill={OUTLINE} />
                <rect x="6" y="2" width="12" height="4" fill={OUTLINE} />
                <rect x="7.2" y="2.5" width="9.6" height="2" fill={hc.base} />
                <rect x="8.5" y="2.5" width="7" height="0.8" fill={hc.light} />

                {/* Left/Right hair framing cheeks - narrowed */}
                <rect x="6" y="4" width="1.2" height="6" fill={OUTLINE} />
                <rect x="6.2" y="5" width="0.8" height="5" fill={hc.base} />
                <rect x="16.8" y="4" width="1.2" height="6" fill={OUTLINE} />
                <rect x="16.8" y="5" width="0.8" height="5" fill={hc.base} />

                {/* Symmetrical bangs fringe */}
                <rect x="7.2" y="4.5" width="9.6" height="1.5" fill={hc.base} />
                <rect x="8" y="6.2" width="1.8" height="1" fill={hc.dark} />
                <rect x="14.2" y="6.2" width="1.8" height="1" fill={hc.dark} stroke={OUTLINE} strokeWidth="0.2" />
                <rect x="11" y="5" width="2" height="1" fill={hc.dark} />
              </g>
            )}

            {hair === "devil_part" && (
              <g>
                {/* Ash-grey dandy split part comma hair with rounded crown */}
                <rect x="7.2" y="1" width="9.6" height="1" fill={OUTLINE} />
                <rect x="6" y="1.5" width="12" height="4.5" fill={OUTLINE} />
                <rect x="7.2" y="2.5" width="9.6" height="3" fill={hc.base} />
                <rect x="8.5" y="2" width="7" height="1.2" fill={hc.light} />

                {/* Comma forehead sweep */}
                <rect x="6.5" y="4.5" width="4" height="2.2" fill={hc.base} />
                <rect x="13.5" y="4.5" width="4" height="2.2" fill={hc.base} />
                <rect x="6.5" y="6.6" width="3.5" height="0.6" fill={OUTLINE} />
                <rect x="14" y="6.6" width="3.5" height="0.6" fill={OUTLINE} />
                
                {/* Left side strand - snugger */}
                <rect x="5.8" y="5" width="1.2" height="4.5" fill={OUTLINE} />
                <rect x="5.8" y="5.5" width="0.8" height="3.5" fill={hc.base} />
              </g>
            )}

            {hair === "comma_brown" && (
              // Shaggy layered brown dandy leaf-cut (with rounded crown & snugger sides)
              <g>
                <rect x="7.5" y="0.8" width="9" height="1" fill={OUTLINE} />
                <rect x="6.2" y="1.5" width="11.6" height="4.5" fill={OUTLINE} />
                <rect x="7" y="2.5" width="10" height="3" fill={hc.base} />
                <rect x="8" y="2" width="8" height="1" fill={hc.light} />

                {/* Sweeping styled leaf forehead bangs */}
                <rect x="6.5" y="5" width="4.5" height="2" fill={hc.base} />
                <rect x="13" y="5" width="4.5" height="2" fill={hc.base} />
                <rect x="6.5" y="6.8" width="3.8" height="0.6" fill={OUTLINE} />
                <rect x="13.2" y="6.8" width="3.8" height="0.6" fill={OUTLINE} />

                {/* Sideburn dangles - tighter */}
                <rect x="5.8" y="5" width="1.2" height="5.5" fill={OUTLINE} />
                <rect x="5.8" y="5.5" width="0.8" height="4.5" fill={hc.base} />
                <rect x="17" y="5" width="1.2" height="5.5" fill={OUTLINE} />
                <rect x="17.0" y="5.5" width="0.8" height="4.5" fill={hc.base} />

                {/* Braid ponytail popping nicely on the side (Photo 9/10 style) */}
                <rect x="4" y="8" width="2" height="3" fill={OUTLINE} />
                <rect x="4.5" y="8.5" width="1" height="2" fill={hc.dark} />
              </g>
            )}

            {hair === "street_blue" && (
              <g>
                {/* Spiky messy cobalt blue with rounded background crown base & snug sides */}
                <rect x="7.5" y="0.8" width="9" height="1" fill={OUTLINE} />
                <rect x="6" y="1.5" width="12" height="4.5" fill={OUTLINE} />
                <rect x="7" y="2" width="10" height="3.5" fill={hc.base} />
                <rect x="8.5" y="1.8" width="7" height="1.2" fill={hc.light} />

                {/* Spiky hair fringes on top */}
                <rect x="7.5" y="0.5" width="1.2" height="2" fill={OUTLINE} />
                <rect x="7.5" y="0.8" width="0.8" height="1" fill={hc.base} />
                <rect x="11.5" y="0.3" width="1.5" height="2" fill={OUTLINE} />
                <rect x="11.5" y="0.6" width="1" height="1" fill={hc.base} />
                <rect x="14.8" y="0.5" width="1.2" height="2" fill={OUTLINE} />
                <rect x="14.8" y="0.8" width="0.8" height="1" fill={hc.base} />

                {/* Messy forehead bangs */}
                <rect x="7.5" y="5" width="9" height="1.8" fill={hc.base} />
                <rect x="8.5" y="6.5" width="1.8" height="0.8" fill={OUTLINE} />
                <rect x="13.5" y="6.5" width="1.8" height="0.8" fill={OUTLINE} />
              </g>
            )}

            {hair === "pink_wave" && (
              // Gorgeous flowing soft long pink hair (rounded crown & condensed width)
              <g>
                <rect x="6.5" y="0.5" width="11" height="1.2" fill={OUTLINE} />
                <rect x="5.5" y="1.5" width="13" height="3.5" fill={OUTLINE} />
                <rect x="6.5" y="2" width="11" height="3" fill={hc.base} />
                <rect x="7.5" y="2" width="9" height="1" fill={hc.light} />

                {/* Massive long locks draping - snugger/narrower */}
                <rect x="4.5" y="4.5" width="2.2" height="12.5" fill={OUTLINE} />
                <rect x="5" y="5" width="1.2" height="11.5" fill={hc.base} />
                <rect x="5" y="11" width="1.2" height="5.5" fill={hc.peach} />
                <rect x="4.5" y="12" width="0.8" height="4" fill={hc.dark} opacity="0.4" />

                <rect x="17.3" y="4.5" width="2.2" height="12.5" fill={OUTLINE} />
                <rect x="17.8" y="5" width="1.2" height="11.5" fill={hc.base} />
                <rect x="17.8" y="11" width="1.2" height="5.5" fill={hc.peach} />
                <rect x="18.7" y="12" width="0.8" height="4" fill={hc.dark} opacity="0.4" />

                {/* Light sweeping bangs above eyelashes */}
                <rect x="7.5" y="4.2" width="9" height="1.8" fill={hc.base} />
                <rect x="8.5" y="5.8" width="2.5" height="1" fill={hc.base} />
                <rect x="13" y="5.8" width="2.5" height="1" fill={hc.base} />
                <rect x="8.5" y="6.6" width="2.5" height="0.6" fill={OUTLINE} />
                <rect x="13" y="6.6" width="2.5" height="0.6" fill={OUTLINE} />

                {/* Integrated Retro Hot-Pink Sunglasses on head-crown (Photo 4 match!) */}
                <rect x="7.5" y="0.5" width="9" height="2" fill={OUTLINE} />
                <rect x="8" y="1" width="8" height="1" fill="#e056fd" /> {/* hot pink frame */}
                <rect x="9" y="1.2" width="2" height="0.6" fill="#000000" />
                <rect x="13" y="1.2" width="2" height="0.6" fill="#000000" />
                <rect x="9" y="1.2" width="0.8" height="0.4" fill="#ffffff" opacity="0.75" />
                <rect x="13" y="1.2" width="0.8" height="0.4" fill="#ffffff" opacity="0.75" />
              </g>
            )}

            {hair === "wavy_long" && (
              // Elegant sleek midnight-black waves (rounded crown & snugger locks)
              <g>
                <rect x="7.2" y="1" width="9.6" height="1" fill={OUTLINE} />
                <rect x="6" y="1.5" width="12" height="4" fill={OUTLINE} />
                <rect x="7" y="2.5" width="10" height="2.5" fill={hc.base} />
                <rect x="8" y="2" width="8" height="1" fill={hc.light} />

                {/* Elegant flowing dark waves framing the chest nicely - narrowed */}
                <rect x="4.5" y="4" width="2.2" height="13.5" fill={OUTLINE} />
                <rect x="5" y="5" width="1.2" height="12" fill={hc.base} />
                <rect x="5" y="6" width="0.6" height="10" fill={hc.light} opacity="0.25" />
                <rect x="4.5" y="12" width="0.8" height="4" fill={hc.dark} />

                <rect x="17.3" y="4" width="2.2" height="13.5" fill={OUTLINE} />
                <rect x="17.8" y="5" width="1.2" height="12" fill={hc.base} />
                <rect x="17.8" y="6" width="0.6" height="10" fill={hc.light} opacity="0.25" />
                <rect x="18.7" y="12" width="0.8" height="4" fill={hc.dark} />

                {/* Forehead bangs */}
                <rect x="7.2" y="4" width="9.6" height="1.4" fill={hc.base} />
                <rect x="7.5" y="5.2" width="2.5" height="1" fill={hc.dark} />
                <rect x="14" y="5.2" width="2.5" height="1" fill={hc.dark} />
              </g>
            )}

            {hair === "twin_tail" && (
              // Cute golden twin tails (rounded crown & snugger locks)
              <g>
                <rect x="7.5" y="1" width="9" height="1" fill={OUTLINE} />
                <rect x="6" y="1.5" width="12" height="4" fill={OUTLINE} />
                <rect x="7" y="2.5" width="10" height="2.5" fill={hc.base} />
                <rect x="8" y="2" width="8" height="1.2" fill={hc.light} />

                {/* Butterfly hair clips in sky blue */}
                <rect x="5" y="4" width="2" height="2" fill="#38bdf8" stroke={OUTLINE} strokeWidth="0.8" />
                <rect x="17" y="4" width="2" height="2" fill="#38bdf8" stroke={OUTLINE} strokeWidth="0.8" />

                {/* Bouncy Twin-Tails loops - snugger */}
                <rect x="3.5" y="5" width="3" height="6" fill={OUTLINE} />
                <rect x="4" y="5.5" width="2" height="5" fill={hc.base} />
                <rect x="17.5" y="5" width="3" height="6" fill={OUTLINE} />
                <rect x="18" y="5.5" width="2" height="5" fill={hc.base} />

                {/* Neatly combed tidy bangs fringe */}
                <rect x="7.5" y="4.5" width="9" height="1.5" fill={hc.base} />
                <rect x="8" y="5.8" width="2" height="0.8" fill={OUTLINE} />
                <rect x="14" y="5.8" width="2" height="0.8" fill={OUTLINE} />
              </g>
            )}

            {hair === "bob_chic" && (
              // Chic elegant lavender short bob (rounded crown & snug straight panels)
              <g>
                <rect x="7.2" y="1" width="9.6" height="1" fill={OUTLINE} />
                <rect x="6" y="1.5" width="12" height="4.5" fill={OUTLINE} />
                <rect x="7.2" y="2.5" width="9.6" height="3" fill={hc.base} />
                <rect x="8" y="2" width="8" height="1" fill={hc.light} />

                {/* Sleek straight side panels tucking in snugly */}
                <rect x="6" y="4.5" width="1.2" height="5.5" fill={OUTLINE} />
                <rect x="6.2" y="4.5" width="0.8" height="5.2" fill={hc.base} />
                <rect x="16.8" y="4.5" width="1.2" height="5.5" fill={OUTLINE} />
                <rect x="16.8" y="4.5" width="0.8" height="5.2" fill={hc.base} />

                {/* Slick diagonal swept-across bangs */}
                <rect x="7.5" y="4.5" width="9" height="1.6" fill={hc.base} />
                <rect x="7.5" y="5" width="6" height="1.2" fill={hc.base} stroke={OUTLINE} strokeWidth="0.8" />
              </g>
            )}
          </g>

          {/* High Teen sunglasses accessories on head if we are female + varsity (Photo 4) */}
          {isFemale && outfit === "varsity" && (
            <g style={{ transform: `translateY(${headBobOffset}px)` }}>
              {/* Pink retro shades sitting on the hair crown! */}
              <rect x="8" y="1" width="8" height="2" fill={OUTLINE} />
              <rect x="9" y="1.5" width="2.5" height="1" fill={oc.accent} />
              <rect x="12.5" y="1.5" width="2.5" height="1" fill={oc.accent} />
              <rect x="10" y="1.5" width="1" height="0.6" fill="#ffffff" />
              <rect x="13.5" y="1.5" width="1" height="0.6" fill="#ffffff" />
            </g>
          )}

          {/* Hats and Accessories perfectly scaled */}
          <g style={{ transform: `translateY(${headBobOffset}px)` }}>
            {hat === "crown" && (
              <g style={{ transform: "translateY(-1px) scale(0.95)", transformOrigin: "12px 3px" }}>
                <rect x="5" y="-3" width="14" height="7" fill={OUTLINE} />
                <rect x="6" y="1" width="12" height="2" fill="#fbbf24" />
                <rect x="6" y="3" width="12" height="1" fill="#b45309" />
                
                <rect x="6" y="-1" width="2" height="2" fill="#fbbf24" />
                <rect x="9" y="0" width="1" height="1" fill="#fbbf24" />
                <rect x="11" y="-2" width="2" height="3" fill="#fbbf24" />
                <rect x="14" y="0" width="1" height="1" fill="#fbbf24" />
                <rect x="16" y="-1" width="2" height="2" fill="#fbbf24" />

                {/* Sparkling tiny precious Ruby & Sapphire gemstones */}
                <rect x="8" y="2" width="1" height="1" fill="#dc2626" />
                <rect x="11" y="1" width="2" height="1" fill="#dc2626" />
                <rect x="15" y="2" width="1" height="1" fill="#2563eb" />
              </g>
            )}
            {hat === "red_ribbon" && (
              <g style={{ transform: "translate(4px, 1px)" }}>
                <rect x="7" y="1" width="10" height="5" fill={OUTLINE} />
                <rect x="8" y="2" width="8" height="3" fill="#dc2626" />
                <rect x="10" y="3" width="4" height="1" fill="#ef4444" />
                <rect x="11" y="3" width="2" height="2" fill="#7f1d1d" />
              </g>
            )}
            {hat === "wizard_hat" && (
              <g style={{ transform: "translateY(-4px)" }}>
                <rect x="3" y="4" width="18" height="3" fill={OUTLINE} />
                <rect x="7" y="-2" width="10" height="7" fill={OUTLINE} />
                <rect x="10" y="-4" width="4" height="3" fill={OUTLINE} />
                <rect x="4" y="5" width="16" height="1" fill="#312e81" />
                <rect x="12" y="-3" width="1" height="2" fill="#4f46e5" />
                <rect x="7" y="5" width="10" height="1" fill="#fbbf24" />
                <rect x="11" y="5" width="2" height="1" fill="#dc2626" />
              </g>
            )}
            {hat === "straw_hat" && (
              // Photo 2 Summer Romantic Straw Hat with Violet flowers list
              <g style={{ transform: "translateY(-1px)" }}>
                {/* Wide brim of floppy straw hat */}
                <rect x="2" y="3.5" width="20" height="2" fill="#d97706" stroke={OUTLINE} strokeWidth="0.8" />
                <rect x="3" y="4" width="18" height="1" fill="#f59e0b" />

                {/* Main Crown of the Straw Hat */}
                <rect x="6" y="-0.5" width="12" height="4.5" fill={OUTLINE} />
                <rect x="7" y="0" width="10" height="3" fill="#eab308" />
                <rect x="8" y="0.5" width="8" height="1" fill="#fef08a" />

                {/* Dark brown ribbon band around hat crown */}
                <rect x="6.5" y="2.5" width="11" height="1" fill="#78350f" />

                {/* Violet Blossom design cluster on side of hat (Photo 2) */}
                <rect x="14" y="1" width="3.5" height="1.8" fill="#c084fc" />
                <rect x="14.3" y="1" width="2.5" height="1" fill="#a855f7" />
                <rect x="14.3" y="1" width="1" height="0.8" fill="#ffffff" opacity="0.9" />

                {/* Hanging delicate white satin ribbons flowing behind the ear down past neck */}
                <rect x="16" y="4.5" width="1.2" height="6.5" fill="#f1f5f9" stroke={OUTLINE} strokeWidth="0.6" />
                <rect x="16.3" y="4.8" width="0.6" height="5.5" fill="#ffffff" />
              </g>
            )}
          </g>
          </g>
        </g>
      )}
    </svg>
  );
}
