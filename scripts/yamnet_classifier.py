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

# Length of each chunk in seconds (30 minutes = 1800 seconds)
chunk_length_seconds = 1800

# Number of samples per chunk
samples_per_chunk = sample_rate * chunk_length_seconds

# Calculate the total number of chunks
total_chunks = int(np.ceil(len(wav_data) / samples_per_chunk))

# Process each chunk
for chunk_idx in range(total_chunks):
    start_sample = chunk_idx * samples_per_chunk
    end_sample = start_sample + samples_per_chunk
    chunk_waveform = wav_data[start_sample:end_sample]

    # Ensure chunk is in the correct format for the model
    chunk_waveform = chunk_waveform / tf.int16.max  # Normalize

    # Process the chunk with the model
    scores, embeddings, spectrogram = model(chunk_waveform)
    
    # Convert scores to a list (or perform any required aggregation/processing)
    scores_list = scores.numpy().tolist()

  # Save each chunk's scores to a separate JSON file without formatting
    json_output_path = os.path.join(args.output_dir, f'scores_data_chunk_{chunk_idx}.json')
    with open(json_output_path, 'w') as file:
      # No indentation or additional spacing is used here for compactness
      json.dump({"scores": scores_list}, file)

    print(f"Chunk {chunk_idx} processed and saved.")

# # Run the model, check the output.
# scores, embeddings, spectrogram = model(waveform)
# scores.shape.assert_is_compatible_with([None, 521])
# embeddings.shape.assert_is_compatible_with([None, 1024])
# spectrogram.shape.assert_is_compatible_with([None, 64])
# scores_np = scores.numpy()





# Find the name of the class with the top score when mean-aggregated across frames.
def class_names_from_csv(class_map_csv_text):
  """Returns list of class names corresponding to score vector."""
  class_map_csv = io.StringIO(class_map_csv_text)
  class_names = [display_name for (class_index, mid, display_name) in csv.reader(class_map_csv)]
  class_names = class_names[1:]  # Skip CSV header
  return class_names

class_map_path = model.class_map_path().numpy()
class_names = class_names_from_csv(tf.io.read_file(class_map_path).numpy().decode('utf-8'))



# SAVE TO JSON

# Create a dictionary to hold the class names.
data_to_save = class_names;

# Convert the dictionary to a JSON string.
json_data = json.dumps(data_to_save, indent=4)

# Write the JSON data to a file.
json_output_path = os.path.join(args.output_dir, 'scores_classes.json')
with open(json_output_path, 'w') as file:
    file.write(json_data)

print("Data saved")

# /SAVE TO JSON




# chunk_size = 16000 * 60 * 30  # 30 minutes at 16kHz
# start_idx = 0

# final_scores = []
# while start_idx < len(wav_data):
#     end_idx = min(start_idx + chunk_size, len(wav_data))
#     chunk = wav_data[start_idx:end_idx]
#     chunk_scores = process_chunk(chunk, model)

#     # Aggregate the results
#     final_scores = np.concatenate((final_scores, chunk_scores))

#     start_idx = end_idx
