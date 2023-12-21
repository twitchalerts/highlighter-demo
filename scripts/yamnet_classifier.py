import argparse
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import csv
import io
import matplotlib.pyplot as plt
from IPython.display import Audio
from scipy.io import wavfile
import scipy.signal
import json
import os


# Create the parser and add arguments
parser = argparse.ArgumentParser(description="Process an audio file and save the output.")
parser.add_argument("input_file", help="The path to the input audio file.")
parser.add_argument("output_dir", help="The directory to save the output files.")
args = parser.parse_args()

# Ensure the output directory exists
os.makedirs(args.output_dir, exist_ok=True)


def ensure_sample_rate(original_sample_rate, waveform,
                       desired_sample_rate=16000):
  """Resample waveform if required."""
  if original_sample_rate != desired_sample_rate:
    desired_length = int(round(float(len(waveform)) /
                               original_sample_rate * desired_sample_rate))
    waveform = scipy.signal.resample(waveform, desired_length)
  return desired_sample_rate, waveform

# Load the model.
model = hub.load('https://www.kaggle.com/models/google/yamnet/frameworks/TensorFlow2/variations/yamnet/versions/1')

# Input: 3 seconds of silence as mono 16 kHz waveform samples.
# waveform = np.zeros(3 * 16000, dtype=np.float32)

sample_rate, wav_data = wavfile.read(args.input_file, 'rb')
sample_rate, wav_data = ensure_sample_rate(sample_rate, wav_data)

# Show some basic information about the audio.
duration = len(wav_data)/sample_rate
print(f'Sample rate: {sample_rate} Hz')
print(f'Total duration: {duration:.2f}s')
print(f'Size of the input: {len(wav_data)}')

# Listening to the wav file.
Audio(wav_data, rate=sample_rate)

# The wav_data needs to be normalized to values in [-1.0, 1.0]
waveform = wav_data / tf.int16.max


# Run the model, check the output.
scores, embeddings, spectrogram = model(waveform)
scores.shape.assert_is_compatible_with([None, 521])
embeddings.shape.assert_is_compatible_with([None, 1024])
spectrogram.shape.assert_is_compatible_with([None, 64])

# Find the name of the class with the top score when mean-aggregated across frames.
def class_names_from_csv(class_map_csv_text):
  """Returns list of class names corresponding to score vector."""
  class_map_csv = io.StringIO(class_map_csv_text)
  class_names = [display_name for (class_index, mid, display_name) in csv.reader(class_map_csv)]
  class_names = class_names[1:]  # Skip CSV header
  return class_names

class_map_path = model.class_map_path().numpy()
class_names = class_names_from_csv(tf.io.read_file(class_map_path).numpy().decode('utf-8'))
print(class_names[scores.numpy().mean(axis=0).argmax()])  # Should print tha class name.

scores_np = scores.numpy()
spectrogram_np = spectrogram.numpy()
infered_class = class_names[scores_np.mean(axis=0).argmax()]
print(f'The main sound is: {infered_class}')




# Plot and label the model output scores for the top-scoring classes.
mean_scores = np.mean(scores, axis=0)
top_n = 10
top_class_indices = np.argsort(mean_scores)[::-1][:top_n]


# Define the class names you are interested in.
desired_classes = ['Shout','Yell', 'Screaming', 'Cheering', 'Applause', 'Laughter', 'Whoop', 'Clapping', 'Gunshot, gunfire']  # Add more class names as needed

# Find the indices of these classes.
desired_indices = [class_names.index(cls) for cls in desired_classes if cls in class_names]

# Ensure that the desired classes are included in the top classes to plot.
for index in desired_indices:
    if index not in top_class_indices:
        top_class_indices = np.append(top_class_indices, index)


# SAVE TO JSON
# Extract the scores for top_class_indices.
scores_data = scores_np[:, top_class_indices].T.tolist()

# Extract the class names for top_class_indices.
class_names_data = [class_names[i] for i in top_class_indices]

# Create a dictionary to hold the scores and class names.
data_to_save = {
    "classNames": class_names_data,
    "scores": scores_data
}

# Convert the dictionary to a JSON string.
json_data = json.dumps(data_to_save, indent=4)

# Write the JSON data to a file.
json_output_path = os.path.join(args.output_dir, 'scores_data.json')
with open(json_output_path, 'w') as file:
    file.write(json_data)

print("Data saved to scores_data.json")

# /SAVE TO JSON


# # UNCOMMENT TO PLOT SPECTROGRAM and SCORES

# plt.figure(figsize=(10, 6))

# # Plot the waveform.
# plt.subplot(3, 1, 1)
# plt.plot(waveform)
# plt.xlim([0, len(waveform)])

# # Plot the log-mel spectrogram (returned by the model).
# plt.subplot(3, 1, 2)
# plt.imshow(spectrogram_np.T, aspect='auto', interpolation='nearest', origin='lower')


# plt.subplot(3, 1, 3)
# plt.imshow(scores_np[:, top_class_indices].T, aspect='auto', interpolation='nearest', cmap='gray_r')

# # Corrected y-ticks labeling
# yticks = range(0, len(top_class_indices), 1)
# plt.yticks(yticks, [class_names[top_class_indices[x]] for x in yticks])
# _ = plt.ylim(-0.5 + np.array([len(top_class_indices), 0]))



# # Save the figure to a file
# figure_output_path = os.path.join(args.output_dir, 'audio-plot.png')
# plt.savefig(figure_output_path, dpi=900) 

# # Display the plot
# plt.show()