import React, { useState, useEffect } from 'react';

import { styled } from '@mui/material/styles';

import { Button, Menu, Typography, Box } from '@mui/material';

import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';

import { ColorOption } from './ColorOption';

const StyledButton = styled(Button)(({ theme }) => ({
  justifyContent: 'space-evenly',
  border: `1px solid ${theme.palette.text.secondary}`,
  height: "100%",
  transition: "border-color .2s ease-in-out, background-color .2s ease-in-out",
  ":hover": {
    border: `1px solid ${theme.palette.text.primary}`,
    backgroundColor: "rgba(0,0,0,0)",

    "& .MuiButton-endIcon": {
      "& .MuiSvgIcon-root": {
        color: theme.palette.text.primary + " !important",
      },
    },
  },
  ":active": {
    border: `1px solid ${theme.palette.primary.main}`,
  },
  "& .MuiButton-endIcon": {
    "& .MuiSvgIcon-root": {
      fontSize: '3rem',
    },
  },
}));

const StyledBox = styled(Box)(({ theme }) => ({
  outline: 'none',
  cursor: 'pointer',
  position: 'relative',
  width: '80%',
  height: '80%',
  boxSizing: 'border-box',
  borderRadius: theme.shape.borderRadius,
}));

export interface ColorPickerProps {
  palette?: ColorPaletteType;
  onSelectHandler?: (event: React.MouseEvent | React.TouchEvent) => void;
  onClick: (value: string) => void;
  previousValue?: string;
  value: string;
}

export type ColorPaletteType = { [key: string]: string };

const createGroupsOf = (arr: any[], perGroup: number): any => {
  const numGroups = Math.ceil(arr.length / perGroup);
  return new Array(numGroups)
    .fill('')
    .map((_, i) => arr.slice(i * perGroup, (i + 1) * perGroup));
};

export const ColorPicker = (props: ColorPickerProps) => {
  const palette = props.palette || {
    tomato: '#D50000',
    flamingo: '#E67C73',
    tangerine: '#F4511E',
    banana: '#F6BF26',
    sage: '#33B679',
    basil: '#0B8043',
    peacock: '#039BE5',
    blueberry: '#3F51B5',
    lavender: '#7986CB',
    grape: '#8E24AA',
    graphite: '#616161',
    charcoal: '#212121',

    "exp-white": '#FFFFFF',
    "exp-black": '#000000',
    "exp-red": '#FF0000',
    "exp-green": '#00FF00',
    "exp-blue": '#0000FF',
    "exp-yellow": '#FFFF00',
    "exp-cyan": '#00FFFF',
    "exp-magenta": '#FF00FF',
  };

  const [localPalette, setLocalPalette] = useState<ColorPaletteType>(palette)

  // when the incoming value changes, generate a small tonal palette based on it
  useEffect(() => {
    if (!props.previousValue) return
    try {
      const generated = generateShadesFromHex(props.previousValue, 7)
      // also generate negatives (inverted colors) for the generated shades
      const negatives: ColorPaletteType = {}
      Object.keys(generated).forEach((k) => {
        try {
          negatives[`${k}-neg`] = invertHex(generated[k])
        } catch (e) {
          // ignore inversion errors
        }
      })

      // merge generated shades and their negatives into local palette, preferring existing keys
      setLocalPalette((prev) => ({ ...prev, ...generated, ...negatives }))
    } catch (err) {
      // invalid color value; ignore
      // console.warn('ColorPicker: failed to generate shades from', props.value, err)
    }
  }, [props.previousValue])

  // sync when incoming palette prop changes
  useEffect(() => {
    if (props.palette) setLocalPalette(props.palette)
  }, [props.palette])

  const [selected, setSelected] = useState(localPalette['peacock'] || props.previousValue || '#039BE5');

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorOptionClick = (color: string) => {
    setSelected(color);
    props.onClick(color);
    handleClose();
  };

  const buildPaletteOptions = (paletteArg: ColorPaletteType): React.ReactNode => {
    const keys = Object.keys(paletteArg || {})

    // categorize keys
    const generatedKeys = keys.filter((k) => k.startsWith('gen-') && !k.endsWith('-neg'))
    const negativeKeys = keys.filter((k) => k.endsWith('-neg'))
    const defaultKeys = keys.filter((k) => !k.startsWith('gen-') && !k.endsWith('-neg') && !k.startsWith('exp-'))
    const exageratedKeys = keys.filter((k) => k.startsWith('exp-'))

    const renderGroup = (groupKeys: string[]) => {
      const list = groupKeys.map((key) => (
        <ColorOption
          key={key}
          color={`${paletteArg[key]}`}
          onClick={handleColorOptionClick}
          colorKey={key}
          selected={paletteArg[key] === selected}
        />
      ))

      // group into rows of 6 for compact display
      const rows = createGroupsOf(list, 6)
      return rows.map((row: React.ReactNode[], i: number) => (
        <Box
          key={`${groupKeys.join('-')}-${i}`}
          sx={{ px: '0.25rem', py: '0.15rem', overflow: 'hidden', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}
        >
          {row}
        </Box>
      ))
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 1 }}>
        {defaultKeys.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{ px: 0.5, color: 'text.primary' }}>Default</Typography>
            {renderGroup(defaultKeys)}
          </Box>
        )}

        {exageratedKeys.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{ px: 0.5, color: 'text.primary' }}>Primary</Typography>
            {renderGroup(exageratedKeys)}
          </Box>
        )}

        {generatedKeys.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{ px: 0.5, color: 'text.primary' }}>Generated</Typography>
            {renderGroup(generatedKeys)}
          </Box>
        )}

        {negativeKeys.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{ px: 0.5, color: 'text.primary' }}>Negative</Typography>
            {renderGroup(negativeKeys)}
          </Box>
        )}
      </Box>
    )
  }

  function generateShadesFromHex(hex: string, count = 7): ColorPaletteType {
    const cleaned = (hex || '').replace('#', '')
    if (!/^[0-9a-fA-F]{3,8}$/.test(cleaned)) throw new Error('invalid hex')

    const rgb = hexToRgb(hex)
    if (!rgb) throw new Error('invalid hex')
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

    // produce shades by varying lightness around the base
    const out: ColorPaletteType = {}
    const steps = count
    // generate values from darker to lighter
    for (let i = 0; i < steps; i++) {
      // map i in [0,steps-1] to lightness multiplier between 0.15..0.95
      const t = i / Math.max(1, steps - 1)
      const L = Math.max(0, Math.min(1, (hsl.l * (1 - 0.5 * (t))) + (0.4 * t)))
      const rgb2 = hslToRgb(hsl.h, hsl.s, L)
      const key = `gen-${(i + 1) * Math.round(100 / steps)}`
      out[key] = rgbToHex(rgb2.r, rgb2.g, rgb2.b)
    }

    return out
  }

  function hexToRgb(hex: string) {
    const cleaned = hex.replace('#', '')
    if (cleaned.length === 3) {
      const r = parseInt(cleaned[0] + cleaned[0], 16)
      const g = parseInt(cleaned[1] + cleaned[1], 16)
      const b = parseInt(cleaned[2] + cleaned[2], 16)
      return { r, g, b }
    }
    if (cleaned.length === 6 || cleaned.length === 8) {
      const r = parseInt(cleaned.slice(0, 2), 16)
      const g = parseInt(cleaned.slice(2, 4), 16)
      const b = parseInt(cleaned.slice(4, 6), 16)
      return { r, g, b }
    }
    return null
  }

  function rgbToHex(r: number, g: number, b: number) {
    const toHex = (n: number) => {
      const s = Math.round(n).toString(16)
      return s.length === 1 ? '0' + s : s
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  function rgbToHsl(r: number, g: number, b: number) {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }
    return { h, s, l }
  }

  function hslToRgb(h: number, s: number, l: number) {
    let r: number, g: number, b: number
    if (s === 0) {
      r = g = b = l * 255
      return { r, g, b }
    }
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3) * 255
    g = hue2rgb(p, q, h) * 255
    b = hue2rgb(p, q, h - 1 / 3) * 255
    return { r, g, b }
  }

  function invertHex(hex: string) {
    const rgb = hexToRgb(hex)
    if (!rgb) throw new Error('invalid hex')
    const r = 255 - rgb.r
    const g = 255 - rgb.g
    const b = 255 - rgb.b
    return rgbToHex(r, g, b)
  }

  return (
    <div style={{
      height: '58px',
      width: '100%',
      position: 'relative',
    }}>
      <StyledButton
        id="color-picker-button"
        aria-controls={open ? 'color-picker-menu' : undefined}
        aria-haspopup="true"
        fullWidth
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        style={open ? { borderColor: 'var(--mui-palette-primary-main' } : {}}
        endIcon={
          open ?
            <ArrowDropUp
              style={{
                color: 'var(--mui-palette-primary-main)'
              }}
            />
            :
            <ArrowDropDown
              style={{
                color: 'var(--mui-palette-text-secondary)'
              }} />
        }
      >
        <StyledBox
          tabIndex={-1}
          className="color-dot-container"
          sx={{
            backgroundColor: `${props.previousValue || selected}`,
          }}
        >
          <Box
            className={'color-dot'}
            component="li"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
            }}
          />
        </StyledBox>
      </StyledButton>

      <Menu
        component="div"
        id="color-picker-menu"
        aria-labelledby="color-picker-button"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {buildPaletteOptions(localPalette)}
      </Menu>
    </div>
  );
};
