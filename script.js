// 1. Initializing constants and variables

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 4096;
analyser.smoothingTimeConstant = 0.8;

let microphoneStream = null;
let isMicrophoneActive = false;
let currentOctave = 4; // The default octave is 4.
let currentNote = null; // This is for selected Note in the page.
let currentReference = null;

let referenceFrequencies = { // Setting the exact pitch for tuning. All pitches have 3 frequencies: tonic, 2nd/3rd Harmonics. The default octave is 4. 
    'C': [261.63, 523.25, 784.88],
    'C#': [277.18, 554.37, 831.55],
    'D': [293.66, 587.33, 880.99],
    'Eb': [311.13, 622.25, 933.38],
    'E': [329.63, 659.26, 988.89],
    'F': [349.23, 698.46, 1047.70],
    'F#': [369.99, 739.99, 1109.98],
    'G': [392.00, 784.00, 1176.00],
    'G#': [415.30, 830.61, 1245.91],
    'A': [440.00, 880.00, 1320.00],
    'Bb': [466.16, 932.33, 1398.49],
    'B': [493.88, 987.77, 1481.66]
};

const frequencyRanges = { // Setting the pitch ranage of tonic frequency per note, ±30Hz. Code to prevent tonic and second harmonics from being detected together when finding the tonic frequency
    'C': { min: 231.63, max: 291.63 },
    'C#': { min: 247.18, max: 307.18 },
    'D': { min: 263.66, max: 323.66 },
    'Eb': { min: 281.13, max: 341.13 },
    'E': { min: 299.63, max: 359.63 },
    'F': { min: 319.23, max: 379.23 },
    'F#': { min: 339.99, max: 399.99 },
    'G': { min: 362, max: 422 },
    'G#': { min: 385.3, max: 445.3 },
    'A': { min: 410, max: 470 },
    'Bb': { min: 436.16, max: 496.16 },
    'B': { min: 463.88, max: 523.88 }  
};

const highpassFilter = audioContext.createBiquadFilter(); // Filter for white noise.
highpassFilter.type = 'highpass';
highpassFilter.frequency.value = 120; // Remove the frequency under 120Hz


// 2. Utility function definition

function getFrequencyRangeForCurrentOctave(note) { // Function to return the frequency range considering the current octave
    const baseRange = frequencyRanges[note];
    const multiplier = Math.pow(2, currentOctave - 4);  // 4 means the default octave

    return {
        min: baseRange.min * multiplier,
        max: baseRange.max * multiplier
    };
}

function getMaxIndexOfArray(array) { //Find the index with the maximum value in an array. Important features in determining tonic frequency
    let max = -Infinity;
    let index = -1;

    const currentRange = getFrequencyRangeForCurrentOctave(currentNote);
    const minIndex = currentReference ? Math.floor(currentRange.min * analyser.fftSize / audioContext.sampleRate) : 0;
    const maxIndex = currentReference ? Math.ceil(currentRange.max * analyser.fftSize / audioContext.sampleRate) : array.length;

    for (let i = minIndex; i < maxIndex; i++) {
        if (array[i] > max) {
            max = array[i];
            index = i;
        }
    }
    return index;
}

function getHarmonicIndexRange(tonicIndex, harmonicNumber) { // Returns the expected harmonic index range based on a given tonic frequency index and harmonic number (2 or 3)
    // Add -5 and +5 to account for adjacent index ranges.
    const range = 5; 
    const harmonicIndex = tonicIndex * harmonicNumber;
    return {
        start: harmonicIndex - range,
        end: harmonicIndex + range
    };
}

function getFrequencyForExpectedHarmonic(frequencyData, indexRange) { //Finds the most powerful frequency (the frequency with the maximum value) within the expected harmonic index range and returns its frequency value.
    let max = -Infinity;
    let maxIndex = -1;
    for (let i = indexRange.start; i <= indexRange.end; i++) {
        if (frequencyData[i] > max) {
            max = frequencyData[i];
            maxIndex = i;
        }
    }
    return maxIndex * audioContext.sampleRate / analyser.fftSize;
}

function setReferenceFrequency(note) {
    currentReference = referenceFrequencies[note].map(f => f * Math.pow(2, currentOctave - 4));
}

function updateSelectedPitch(note) {
    document.getElementById('selected-note').textContent = note + currentOctave;
}


// 3. User interface event handling

document.getElementById('toggle-mic').addEventListener('click', async () => { // Mic on and off
    if (isMicrophoneActive) {
        microphoneStream.getTracks().forEach(track => track.stop());
        await audioContext.suspend();
        isMicrophoneActive = false;
    } else {
        await audioContext.resume();
        startMicrophone();
    }
});

document.querySelectorAll(".pitch").forEach(btn => {
    btn.addEventListener("click", function() {
        const note = this.getAttribute("data-note");
        currentNote = note;  
        setReferenceFrequency(note);
        updateSelectedPitch(note);
    });
});

document.getElementById("octave-down").addEventListener("click", function() {
    currentOctave--;

    if (currentNote) {
        setReferenceFrequency(currentNote);
        updateSelectedPitch(currentNote);
    }
});

document.getElementById("octave-up").addEventListener("click", function() {
    currentOctave++;

    if (currentNote) {
        setReferenceFrequency(currentNote);
        updateSelectedPitch(currentNote);
    }
});


// 4. Microphone and audio processing logic

function startMicrophone() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            microphoneStream = stream;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(highpassFilter);
            highpassFilter.connect(analyser);

            isMicrophoneActive = true;
            updateAnalysis();
        })
        .catch(err => {
            console.error('Error accessing microphone:', err);
        });
}

function updateAnalysis() { // Analyzes incoming audio data in real time (tonic, 2nd/3rd harmonic) and displays the results on the screen
    if (!isMicrophoneActive) return;

    requestAnimationFrame(updateAnalysis);
 
    analyser.getFloatFrequencyData(frequencyDataArray); //Real-time frequency data update section
    frequencyChart.update(); // Graph update

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);

    const tonicIndex = getMaxIndexOfArray(frequencyData);
    const tonicFrequency = tonicIndex * audioContext.sampleRate / analyser.fftSize;

    const secondHarmonicRange = getHarmonicIndexRange(tonicIndex, 2);
    const secondHarmonicFrequency = getFrequencyForExpectedHarmonic(frequencyData, secondHarmonicRange);

    const thirdHarmonicRange = getHarmonicIndexRange(tonicIndex, 3);
    const thirdHarmonicFrequency = getFrequencyForExpectedHarmonic(frequencyData, thirdHarmonicRange);

    document.getElementById('tonic').textContent = tonicFrequency.toFixed(2) + (currentReference ? `, Difference: ${(tonicFrequency - currentReference[0]).toFixed(2)}` : "");
    document.getElementById('second-harmonic').textContent = secondHarmonicFrequency.toFixed(2) + (currentReference ? `, Difference: ${(secondHarmonicFrequency - currentReference[1]).toFixed(2)}` : "");
    document.getElementById('third-harmonic').textContent = thirdHarmonicFrequency.toFixed(2) + (currentReference ? `, Difference: ${(thirdHarmonicFrequency - currentReference[2]).toFixed(2)}` : "");
}


let frequencyDataArray = new Float32Array(analyser.frequencyBinCount); // You can view the real-time frequency spectrum of tonic, second, and third harmonics graphically.
let maxFrequency = 2000;
let labels = [];
for(let i = 0; i < frequencyDataArray.length; i++) {
    let freq = i * audioContext.sampleRate / analyser.fftSize;
    if(freq > maxFrequency) break;
    labels.push(freq);
}


let ctx = document.getElementById('frequencyChart').getContext('2d');
let frequencyChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
            label: 'Frequency Spectrum',
            data: frequencyDataArray,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: false, // 
        maintainAspectRation: false, // Enable/disable responsive options
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                max: 2000 // Graph horizontal axis limits
            }
        }
    }
});
