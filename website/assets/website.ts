/* eslint-disable no-console */

import { transpiler, JaffleEditor, Strudel } from './jaffle';

const TUNES_PATH = './tunes/';
const TUNES = ['amen_sister', 'arpoon', 'barry_harris', 'bass_fuge', 'bell_dub', 'bridge_is_over',
	'chop', 'delay', 'dino_funk', 'echo_piano', 'festival_of_fingers3', 'flat_rave',
	'giant_steps', 'holy_flute', 'jux_und_tollerei', /* 'lounge_sponge', */ 'melting_submarine',
	'orbit', 'outro_music', 'random_bells', 'sample_demo', 'sample_drums', 'sml1', 'swimming',
	'zelda_rescue', 'ws2_stack', 'ws3_dub_tune', 'ws3_stack_in_stack', 'ws4_add_stack'];
	// 'blippy_rhodes', 'caverave', 'csound_demo', 'festival_of_fingers', 'wavy_kalimba' ];

const DEFAULT_TUNE = 'ws2_stack';
const domSelectTune = <HTMLSelectElement> document.getElementById('select_tune');
const editor = new JaffleEditor();
const strudel = new Strudel();

function loadTune(tuneName: string): void {
	console.log(`Loading tune ${tuneName}...`);
	fetch(`${TUNES_PATH}${tuneName}.yml`)
		.then((response) => response.text())
		.then((data) => {
			editor.setText(data);
			console.log(`Tune loaded (${Math.round((data.length / 1024) * 100) / 100}kB)`);
		});
	domSelectTune.value = tuneName;
	window.location.hash = `#${tuneName}`;
}

// function getRandomTune(): string {
// 	return TUNES[Math.floor(Math.random() * TUNES.length)];
// }

function fillTunesList(): void {
	TUNES.forEach((tune) => {
		const domTuneItem = document.createElement('option');
		domTuneItem.value = tune;
		domTuneItem.innerHTML = tune.replace(/_/g, ' ');
		domSelectTune.append(domTuneItem);
	});
}

strudel.transpiler = (tune) => transpiler(tune);
strudel.init();
editor.onPlay = () => {
	const tune = editor.getText();
	// console.log(transpiler(tune));
	strudel.play(tune);
};
editor.onStop = () => strudel.stop();

window.addEventListener('DOMContentLoaded', () => {
	editor.build(<HTMLInputElement> document.getElementById('jaffle'));
	fillTunesList();
	loadTune(window.location.hash.substring(1) || DEFAULT_TUNE);
});

domSelectTune.addEventListener('change', (event) => {
	loadTune((<HTMLSelectElement> event.target).value);
});
