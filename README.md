<h3>At first really appreciate of reading this article!</h3>
<br>
<h2>Harmonics Tuner</h2>
- Function<br>
- Problem<br>
- Question


<br>I am studying the audio programming and trying to build the tuning software that showing not only tonic frequency(General guitar tuner does) but also 2nd, 3rd Harmonics of realtime audio input at the same time. The Harmonics tuner.

Sadly I don't have any background for programming and audio but tried after research and video tutorials. I chose HTML, CSS and Javascript to build simply and to check whether it works or not.

At I first I thought it worked well but found some problems, so that would like to ask advise from the community...

[**Here is the website**,](https://harmonicstuner.netlify.app/) You can try here.<br>
[**Github,**](https://github.com/colobus-guereza/Harmonics-Tuner.git) You can see HTML/CSS/JS code here but I attached only JS script at bottom.


<br>**Function:**
1. The user click the 'microphone on' and choose the pitch for tuning.
2. If you choose the pitch button, the information including pitch octave will be shown like 'D3' in Selected Pitch:.
3. Then three frequencies of realtime audio input, tonic, 2nd & 3rd Harmonics will be shown at each part including the comparison value between frequency data of input audio and the exact frequency number of pitch.
4. So the user can check the tuning state with actual frequency data of instrument.

<br>**Problem**
 1. The analyzer of Audio Web API does not catch the tonic frequency correctly. If I play the sound of D3(Instrument: Handpan), this website shows the tonic as 150.73Hz but iStroboSoft(professional tuning software) shows 148.5Hz. I guess the quality of audio analyzer of Audio Web API is not good as much as iStorbo's one.
 

 2. Regardless of any pitch and octave, many time the frequency of 2nd Harmonics fixed 2X bigger then tonic, [Tonic: 290.70, 2nd Harmonic: 581.40]. I doubt the page is showing just the calculated value(2 * analyzed tonic frequency) not from the real 2nd Harmonics frequency from original sound. <br>


------------------------------
 * The logic I made for capturing 2nd/3rd Harmonics in the code:
1) Find the index of 2nd and 3rd harmonics based on the index of tonic. Index of tonic is fixed with exact Hz data and multiply 2 & 3, then it becomes the index for both Harmonics.<br>
2) Set the range ±30Hz based on each Harmonics' index.<br>
3) Find the peak in the range and capture it as 2nd and 3rd Harmonic frequency.<br>

ex) If I set D3 for tuning, 
tonic index: 220Hz
2nd Harmonic index and range: 440Hz, 410~470Hz
3rd Harmonics index and range: 660Hz, 630~690Hz

I guess there is a error somewhere in the code to make this function..


* I keep playing the sound of well-tuned Handpan, which has 2nd and 3rd Harmonics. And also I am using 'Linotune' app, standard tuner for handpan tuning, to compare.

------------------------------
After few days of coding and tries, I realized I know nothing on this subject actually, just made a code theoretically in my head. Therefore better to ask to professionals in this field...



**Question**
1. Should I add some filter, pre-processing function to improve tonic analyzer to capture better original sound?
2. How can I get the accurate 2nd Harmonics frequency, or all Harmonics data from original sound well in Javascript?
3. Is Python better than Javascript to make Harmonics tuner in the aspect of audio analyzing?


------------------------
Below are information about the code.<br>

**Documentation**<br>
**Summary**:
The code captures audio input from a microphone, analyzes its frequency spectrum, and identifies the tonic and its harmonics (second and third). It also provides a user interface to select reference pitches and octaves, displaying the difference between the real-time captured frequency and the reference frequencies on a graph.

**Initialization**:
- audioContext: Represents an audio-processing graph built from audio modules linked together.
- analyser: An interface to capture audio frequency and time-domain data.
- microphoneStream: Captures the current microphone stream.
- isMicrophoneActive: Flag indicating if the microphone is active.
- currentOctave & currentNote: Variables storing the current selected octave and note.
- referenceFrequencies: A map of musical notes to their reference frequencies in multiple octaves.
- frequencyRanges: Provides a range of frequencies around each note for searching the tonic frequency.
- highpassFilter: Filters out frequencies below 120Hz.

**Utility Functions**:
- getFrequencyRangeForCurrentOctave(note): Returns the frequency range considering the current octave.
- getMaxIndexOfArray(array): Finds the index with the highest value within a given array, crucial for determining the tonic frequency.
- getHarmonicIndexRange(tonicIndex, harmonicNumber): Returns the expected index range of a given harmonic based on the tonic index.
- getFrequencyForExpectedHarmonic(frequencyData, indexRange): Finds the most powerful frequency within the expected harmonic range.
- setReferenceFrequency(note): Sets the reference frequency for a given note considering the current octave.
- updateSelectedPitch(note): Updates the display with the selected note and octave.
User Interface Event Handling:

**Event listeners** for toggling the microphone on/off.
- Event listeners for selecting a pitch (note) and setting the current note and its reference frequency.
- Event listeners for changing the octave (up or down).

**Microphone & Audio** Processing Logic:
- startMicrophone(): Initializes the microphone stream and connects it to the analyzer.
- updateAnalysis(): A recursive function that analyzes the audio input in real-time, determining the tonic and its harmonics, updating the displayed information, and refreshing the frequency spectrum graph.

**Graph** Plotting:
- frequencyDataArray: An array storing the frequency data.
The code creates a graph that visually represents the real-time frequency spectrum using the Chart.js library.
