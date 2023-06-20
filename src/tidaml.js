import * as yaml from 'js-yaml'

import * as core from '@strudel.cycles/core';
import * as mini from '@strudel.cycles/mini';
import * as webaudio from '@strudel.cycles/webaudio';
import * as tonal from '@strudel.cycles/tonal';
import { registerSoundfonts } from '@strudel.cycles/soundfonts';

import { EditorView, keymap } from '@codemirror/view';
import { solarizedLight } from '@uiw/codemirror-theme-solarized';
import * as yamlMode from '@codemirror/legacy-modes/mode/yaml';
import { StreamLanguage, LanguageSupport } from '@codemirror/language'

const TUNES_PATH = './tunes/'
const TUNES = [ 'ws2_stack', 'ws3_delay', 'ws3_dub_tune', 'ws3_stack_in_stack', 'ws4_add_stack',
  'barry_harris', 'giant_steps', 'sample_drums', 'zelda_rescue' ];
  // 'blippy_rhodes', 'caverave', 'festival_of_fingers', 'swimming', 'wavy_kalimba' ];
const SIGNALS_FN = [ 'Saw', 'Sine', 'Cosine', 'Tri', 'Square', 'Rand', 'Perlin',
  'Saw2', 'Sine2', 'Cosine2', 'Tri2', 'Square2', 'Rand2' ]
const LAMBDA_PARAMS_NAME = [ 'a', 'b', 'c']

const ctx = webaudio.getAudioContext();

const yamlLang = new LanguageSupport(StreamLanguage.define(yamlMode.yaml));
const domSelectTune = document.getElementById('select_tune');
const editor = new EditorView({
  extensions: [
    solarizedLight,
    yamlLang,
    keymap.of([
      { key: 'Ctrl-Enter', run: () => onPlay() },
      { key: 'Ctrl-.', run: () => onStop() },
    ])
  ],
  parent: document.getElementById('input')
});

initAudio();

window.addEventListener('DOMContentLoaded', () => {
  TUNES.map( tune => {
    const domTuneItem = document.createElement('option');
    domTuneItem.value = tune;
    domTuneItem.innerHTML = tune.replaceAll('_', ' ');
    domSelectTune.append(domTuneItem);
  });

  loadTune(window.location.hash.substring(1)
    || TUNES[Math.floor(Math.random() * TUNES.length)]);
});

domSelectTune.addEventListener('change', event => {
  loadTune(event.target.value);
});

const { evaluate, stop } = core.repl({
  defaultOutput: webaudio.webaudioOutput,
  getTime: () => ctx.currentTime,
  transpiler
});

function loadTune(tuneName) {
  console.log(`Loading tune ${tuneName}...`)
  fetch(TUNES_PATH + tuneName + '.yml')
  .then(response => response.text())
  .then((data) => {
    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: data
      }
    })
  });
  domSelectTune.value = tuneName
  window.location.hash = `#${ tuneName }`
}

document.getElementById('start').addEventListener('click', onPlay);
document.getElementById('stop').addEventListener('click', onStop);

function initAudio() {
  webaudio.samples('https://strudel.tidalcycles.org/vcsl.json',
    'github:sgossner/VCSL/master/', { prebake: true })
  webaudio.samples('https://strudel.tidalcycles.org/piano.json',
    'https://strudel.tidalcycles.org/piano/', { prebake: true }),
  webaudio.samples('https://strudel.tidalcycles.org/tidal-drum-machines.json',
    'github:ritchse/tidal-drum-machines/main/machines/', { prebake: true, tag: 'drum-machines' }),
  webaudio.samples('https://strudel.tidalcycles.org/EmuSP12.json',
    'https://strudel.tidalcycles.org/EmuSP12/', { prebake: true, tag: 'drum-machines' })
  
  webaudio.initAudioOnFirstClick();
  webaudio.registerSynthSounds();
  registerSoundfonts();
  core.evalScope(core.controls, core, mini, webaudio, tonal);  
}

function transpiler(inputYaml) {
  const tune = yaml.load(inputYaml)
  let outputJs = readOutro(tune)
  outputJs += `return ${ readBlock(tune instanceof Array ? { 'Stack': tune } : tune) }\n`
  console.log(outputJs);
  return outputJs
}

function readBlock(block, indentLvl=0) {
  let js

  if (block instanceof Array) {
    js = block.map(item => readBlock(item, indentLvl + 2)).join(', ')
  } else if (block instanceof Object) {
    js = readObject(block, indentLvl)
  } else {
    js = valueToString(block)
  }

  return js
}

function getMainAttribute(obj) {
  const mainAttrs = Object.keys(obj).filter(key => key[0] != key[0].toLowerCase())
  let mainAttr = ''

  if (mainAttrs.length == 0) {
    console.error('Main attribute not found.')
  } else if (mainAttrs.length > 1) {
    console.error(`Too many main attributes: ${ mainAttrs.join(', ') }`)
  } else {
    mainAttr = mainAttrs[0]
  }
  return mainAttr
}

function getOutroAttributes(obj) {
  return Object.keys(obj).filter(key => key[0] === '.')
}

function getOtherAttributes(obj) {
  return Object.keys(obj).filter(key => key[0] === key[0].toLowerCase() && key[0] !== '.')
}

function valueToString(value) {
  if (value === null) {
    value = ''
  } else if ( ! isNaN(value)) {
    value = `${ value }`
  } else if (value[0] === '=') {
    value = value.substring(1).replaceAll(/[^a-c0-9\.\+\-\*\/\(\)]/g, '')
  } else if (value[0] === ':') {
    value = `'${ value.substring(1) }'`
  } else if (value[0] === '/') {
    value = `mini('${ value.substring(1).trim() }')`
  } else {
    value = `mini('${ value.trim() }')`
  }
  return value
}

function indent(lvl) {
  return lvl == 0 ? '' : '\n' + '  '.repeat(lvl)
}

function readOutro(obj) {
  let js = ''
  for (const attr of getOutroAttributes(obj)) {
    const newAttr = attr.split('^')[0]
    const prefix = attr[1] === '.' ? `await ${ newAttr.substring(2) }` : newAttr.substring(1)
    js += `${ prefix }(${ getValue(attr, obj) })\n`
  }
  return js
}

function getValue(attr, obj, indentLvl) {
  let serialize = attr.split('^')[1]

  if (serialize === undefined) {
    return readBlock(obj[attr], indentLvl)
  } else if (serialize === '') {
      return JSON.stringify(obj[attr], null, '  ').replaceAll('"', "'")
  } else {
    const paramId = parseInt(serialize) - 1
    return obj[attr].map((value, id) =>
      id == paramId ?
        JSON.stringify(value, null, '  ').replaceAll('"', "'")
      : valueToString(value))
  }
}

function readObject(obj, indentLvl) {
  let js, value
  const mainAttr = getMainAttribute(obj)

  if (mainAttr === 'M') {
    js = valueToString(obj[mainAttr])
  } else if (mainAttr === 'Set') {
    if (obj[mainAttr] === null) {
      js = 'x => x'
    } else {
      const param_names = LAMBDA_PARAMS_NAME.slice(0, obj[mainAttr])
      js = `(x, ${ param_names.join(', ') }) => x`
    }
    indentLvl -= 1
  } else {
    const newAttr = mainAttr.split('^')[0]
    js = indent(indentLvl) + newAttr[0].toLowerCase() + newAttr.substring(1)
    if (obj[mainAttr] !== null && ! SIGNALS_FN.includes(newAttr)) {
      value = getValue(mainAttr, obj, indentLvl)
      js += `(${ value })`
    }
  }

  for (let attr of getOtherAttributes(obj)) {
    const newAttr = attr.split('^')[0]
    value = getValue(attr, obj, indentLvl)
    js += indent(indentLvl + 1) + `.${ newAttr }(${ value })`
  }

  return js;
}

function onPlay() {
  ctx.resume();
  evaluate(editor.contentDOM.innerText);
}

function onStop() {
  stop();
}
