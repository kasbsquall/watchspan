import {loadFont as loadDisplay} from '@remotion/google-fonts/Archivo';
import {loadFont as loadText} from '@remotion/google-fonts/Archivo';
import {loadFont as loadMono} from '@remotion/google-fonts/SpaceMono';

// Type system: a display face with real character + a quieter companion for UI/body.
// Everything in one font at one weight is the #1 "template" tell.
//
// Both faces are OFL (safe to redistribute) and deliberately NOT the AI-default stack:
// Inter, Roboto, Arial, Open Sans, Helvetica, system fonts and the Space Grotesk +
// Instrument Serif + Geist combo are banned. Bricolage Grotesque additionally carries an
// optical-size axis. Swap per film to match the brand — any @remotion/google-fonts/*
// import works, or use @remotion/fonts to load a licensed local file.
// Ported from the product, so the film and the app are one object: Archivo for
// everything typographic, Space Mono wherever a figure has to be read as data.
const display = loadDisplay('normal', {weights: ['500', '600', '700']});
const text = loadText('normal', {weights: ['400', '500', '600']});
const mono = loadMono('normal', {weights: ['400', '700']});

export const FONT = {
  display: display.fontFamily, // headlines, section headers, the building sentence
  text: text.fontFamily, // UI, chips, captions, body
};

/** @deprecated legacy alias — use FONT.text. Named INTER for backwards compatibility
 *  with older scenes; it no longer loads Inter, which is a banned face. */
export const INTER = FONT.text;

// System monospace stack for hashes / code (guaranteed in headless Chrome).
export const MONO = `${mono.fontFamily}, ui-monospace, monospace`;

// Ported from web/app/globals.css: the product's own OKLCH tokens converted to
// sRGB, so a frame of the film and a screenshot of the app cannot disagree.
export const C = {
  ink950: '#0f0d09',   // ground
  ink900: '#181612',   // panel
  ink850: '#221f1a',
  ink800: '#2c2823',
  ink700: '#46423b',
  ink500: '#8a857e',   // tertiary type
  ink400: '#96918b',
  ink300: '#b4b0ab',   // secondary type
  ink100: '#e7e4e0',   // primary type
  ember: '#ed990e',    // the one accent, under 5% of pixels
  ember600: '#cf7b00',
  alarm: '#e64343',    // reserved for the degradation declaration
  ok: '#68b986',
  line: 'rgba(231,228,224,0.08)',
};

export const FPS = 30;
